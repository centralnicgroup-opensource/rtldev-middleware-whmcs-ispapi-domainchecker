<?php

namespace WHMCS\Module\Addon\ispapidomaincheck\Client;

use WHMCS\Domains\Pricing\Premium;
use WHMCS\Domains\DomainLookup\SearchResult;
use WHMCS\Config\Setting;
use ISPAPI\I18n;
use ISPAPI\DCHelper;

/**
 * Client Area Controller
 */
class Controller
{

    /**
     * constructor method
     * load translation db
     */
    public function __construct()
    {
        $i18n = new I18n();
        $this->lang = $i18n->getTranslations();
    }

    /**
     * Index action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return string
     */
    public function index($vars, $smarty)
    {
        //load user relations into session (to have premium renewal prices; as unsupported by WHMCS)
        if (!isset($_SESSION["relations"])) {
            $_SESSION["relations"] = array();
            $r = DCHelper::APICall('ispapi', array('COMMAND' => 'StatusUser'));
            if ($r["CODE"]=="200" && isset($r["PROPERTY"]["RELATIONTYPE"])) {
                foreach ($r["PROPERTY"]["RELATIONTYPE"] as $idx => &$type) {
                    $_SESSION["relations"][$type] = $r["PROPERTY"]["RELATIONVALUE"][$idx];
                }
            }
        }
        return array(
            'pagetitle' => $this->lang['domaintitle'],//TODO
            'breadcrumb' => array(//TODO
                'index.php?m=ispapidomaincheck' =>  $this->lang["domaintitle"]
            ),
            //-> templatefile see mydomainchecker.php
            'requirelogin' => false,
            'forcessl' => false,
            'vars' => array(
                'modulelink' => $vars['modulelink'],
                'modulepath' => "/modules/addons/ispapidomaincheck/",
                'domain' => isset($_POST["domain"]) ? $_POST["domain"] : "",
                'currency' => $_SESSION["currency"]
            )
        );
    }

    /**
     * addPremiumToCart action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function addPremiumToCart($vars, $smarty)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data["PC"], $data["IDN"], $data["registrar"], $data["registerprice"], $data["term"])) {
            $pc = $data["PC"];
            $idn = $data["IDN"];
            //get the registrarCostPrice, registrarRenewalCostPrice and registrarCurrency of the domain name
            //calculate the customer price and compare with the price we get from $_REQUEST, if they match,
            //add to the cart
            $registrar = $data["registrar"];
            if (!empty($registrar)) {
                $check = DCHelper::APICall($registrar, array(
                    "COMMAND" => "CheckDomains",
                    "DOMAIN0" => $pc,
                    "PREMIUMCHANNELS" => "*"
                ));
                if (!empty($check["PROPERTY"]["PREMIUMCHANNEL"][0])) {
                    $currencies = DCHelper::getCurrencies();
                    $currency = $check["PROPERTY"]["CURRENCY"][0];
                    $price = $check["PROPERTY"]["PRICE"][0];
                    $currencysettings = $currencies[$currency];
                    $register_price = DCHelper::getPremiumRegistrationPrice(
                        $price,
                        $currencysettings
                    );
                    //if the registration price we get from $_REQUEST is the same than the one we calculated,
                    //then we can add the dommain to the cart; due to rounding issues, we are not simply comparing
                    if (abs($data['registerprice'] - $register_price) < 0.1) {
                        //get renew price
                        $renew_price = DCHelper::getPremiumRenewPrice(
                            $registrar,
                            $check["PROPERTY"]["CLASS"][0],
                            DCHelper::getDomainExtension($idn),
                            $currencysettings
                        );
                        //get the domain currency id
                        if (!is_array($_SESSION["cart"]["domains"])) {
                            $_SESSION["cart"]["domains"] = array();
                        }
                        $_SESSION["cart"]["domains"][] = array(
                            "type" => "register",
                            "domain" => $idn,
                            "regperiod" => $data["term"],
                            "isPremium" => "1",
                            "domainpriceoverride" => $register_price,
                            "registrarCostPrice" => $price,
                            "registrarCurrency" => $currencysettings["id"],
                            "domainrenewoverride" =>  $renew_price,
                            //"registrarRenewalCostPrice" => //NOT REQUIRED
                        );
                        return array("success" => true);
                    }
                }
            }
        }
        return array("success" => false);
    }

    /**
     * checkdomains action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function checkdomains($vars, $smarty)
    {
        ignore_user_abort(false);
        $data = json_decode(file_get_contents('php://input'), true); //convert JSON into array
        $cmd = array(
            "COMMAND"           => "CheckDomains",
            "DOMAIN"            => $data["pc"],
            "SKIPIDNCONVERT"    => 1 //exception for call_raw method to skip idn conversion step
        );
        if ($data["premiumDomains"]==1) {
            $cmd["PREMIUMCHANNELS"] = "*";
        }
        $r = DCHelper::APICall('ispapi', $cmd);//TODO check for active registrar
        $res = array(
            "success" => $r["CODE"] == "200",
            "results" => array()
        );
        if ($res["success"]) {
            $keys = array("PREMIUMCHANNEL", "PRICE", "PRICERENEW", "REASON", "CLASS");
            $rs = $r["PROPERTY"];
            if ($rs) {
                if (isset($rs["PRICE"])) {
                    $rs["PRICERENEW"] = $rs["PRICE"];//create a copy to have all indexes
                }
                foreach ($rs["DOMAINCHECK"] as $idx => &$val) {
                    $idn = $data["idn"][$idx];
                    $row = array();
                    $type = false;
                    switch (substr($val, 0, 3)) {
                        case "210":
                            $availability = true;
                            break;
                        case "549"://invalid repository (unsupported TLD)
                            //this should be superfluous as we pre-check for available
                            //relations for any TLD offered in availability check
                            //just in case relations are there, but not repository,
                            //this might be used
                            $whois = localAPI('DomainWhois', array("domain" => $idn));
                            $availability = preg_match("/^available$/i", $whois["status"]);
                            break;
                        case "211":
                            $availability = false;
                            //further handling of specific cases on client-sides
                            if (isset($rs["PRICE"], $rs["CURRENCY"]) && !empty($rs["PRICE"][$idx])) {
                                $price = $rs["PRICE"][$idx];
                                $currency = $rs["CURRENCY"][$idx];
                                $currencies = DCHelper::getCurrencies();
                                $currencysettings = $currencies[$currency];
                                $active_settings = $currencies[$_SESSION["currency"]];
                                if ($currencysettings === null) {
                                    //unsupported currency in WHMCS
                                    unset($rs["PRICE"][$idx], $rs["PRICERENEW"][$idx], $rs["CURRENCY"][$idx]);
                                } else {
                                    $premiumchannel = $rs["PREMIUMCHANNEL"][$idx];
                                    $class = $rs["CLASS"][$idx];
                                    $register_price_raw = DCHelper::getPremiumRegistrationPrice(
                                        $price,
                                        $currencysettings
                                    );
                                    $renew_price_raw = DCHelper::getPremiumRenewPrice(
                                        $data["registrars"][$idx],
                                        $class,
                                        DCHelper::getDomainExtension($idn),
                                        $currencysettings
                                    );
                                    $availability = true;
                                    $rs["PRICE"][$idx] = $register_price_raw;
                                    $rs["PRICERENEW"][$idx] = $renew_price_raw;
                                }
                            }
                            break;
                        case "541":
                            $availability = false;
                            $rs["REASON"][$idx] = preg_replace("/^[^;]+;/", "", $val);
                            break;
                        default:
                            $availability = false;
                            break;
                    }
                    $row["statusText"] = $availability ? SearchResult::STATUS_NOT_REGISTERED : SearchResult::STATUS_REGISTERED;
                    $row["status"] = $availability ? 'AVAILABLE' : "TAKEN";
                    foreach ($keys as &$key) {
                        if (!empty($rs[$key][$idx])) {
                            $row[$key] = $rs[$key][$idx];
                        }
                    }
                    $res["results"][] = $row;
                }
            }
        } else {
            foreach ($data["pc"] as &$pc) {
                $res["results"][] = array(
                    "statusText" => SearchResult::STATUS_UNKNOWN,
                    "status" => "UNKOWN"
                );
            }
            $res["errormsg"] = "Check failed (" . $r["CODE"] . " " . $r["DESCRIPTION"] . ")";
        }
        ksort($res["results"]);
        return $res;
    }

    /**
     * getsuggestions action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function getsuggestions($vars, $smarty)
    {
        $data = json_decode(file_get_contents('php://input'), true); //convert JSON into array
        $cmd = array(
            "COMMAND"   => "QueryDomainSuggestionList",
            "KEYWORD"   => $data['keyword'],
            "SOURCE"    => "ISPAPI-SUGGESTIONS",
            "ZONE"      => $data['zones'],
            "FIRST"     => 0,
            "LIMIT"     => 500
        );
        //OPTION: Use my ip address
        if ($data["useip"]) {
            //detect client's ip address
            if (isset($_SERVER['HTTP_X_FORWARDED_FOR'])) {
                $client_ip = $_SERVER['HTTP_X_FORWARDED_FOR'];
            } else {
                $client_ip = $_SERVER['REMOTE_ADDR'];
            }
            $cmd["IPADDRESS"] = $client_ip;
        }
        //OPTION: Use Language
        if (!empty($data["language"])) {
            $cmd["LANGUAGE"] = array($data["language"]);
        }
        //TODO replace 'ispapi' with registrar lookup
        $r = DCHelper::APICall('ispapi', $cmd);
        if ($r["CODE"]=="200") {
            return $r["PROPERTY"]["DOMAIN"];
        }
        return array();
    }

    /**
     * loadtranslations action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function loadtranslations($vars, $smarty)
    {
        //translation texts
        return $this->lang;
    }

    /**
     * deleteorder action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function deleteorder($vars, $smarty)
    {
        $data = json_decode(file_get_contents('php://input'), true);
        $response = array("success" => false);
        if (isset($data["IDN"], $data["PC"])) {
            foreach ($_SESSION["cart"]["domains"] as $index => &$row) {
                if ($row["domain"] == $data["IDN"] || $row["domain"] == $data["PC"]) {
                     unset($_SESSION["cart"]["domains"][$index]);
                     $_SESSION["cart"]["domains"] = array_values($_SESSION["cart"]["domains"]);
                     return array("success" => true);
                }
            }
        }
        return array("success" => false);
    }

    /**
     * getcartitems action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function getcartitems($vars, $smarty)
    {
        //get shopping cart items of interest (domains for registration)
        $orderfrm = new \WHMCS\OrderForm();
        $cartitems = array();
        foreach (array_filter(
            $orderfrm->getCartDataByKey('domains', array()),
            function ($item) {
                return ($item["type"] === "register");
            }
        ) as &$item) {
            $cartitems[$item["domain"]] = $item;
        }
        return $cartitems;
    }

    /**
     * loadconfiguration action.
     *
     * @param array $vars Module configuration parameters
     * @param smarty smarty instance
     * @return array
     */
    public function loadconfiguration($vars, $smarty, $data = null)
    {
        //check if backorder modules can be used
        $backorders = array();
        $backordering = DCHelper::loadBackorderAPI();
        if ($backordering) {
            //get all domains that have already been backordered by the user. If not logged in, array will be empty, this is perfect.
            $r = backorder_api_call(array(
                "COMMAND" => "QueryBackorderList"
            ));
            if ($r["CODE"]=="200" && isset($r["PROPERTY"]["DOMAIN"])) {
                foreach ($r["PROPERTY"]["DOMAIN"] as $idx => &$d) {
                    $backorders[$d] = 1; //TODO $r["PROPERTY"]["ID"][$idx];
                }
            }
        }

        // collect current configuration data
        // and build list of tlds in use by this configuration
        $categories = DCHelper::SQLCall("Select * from ispapi_tblcategories ORDER BY name ASC", null, "fetchall");
        $defcats = array();
        foreach ($categories as &$cat) {
            $cat["id"] = (int)$cat["id"];
            $defcats[] = $cat["id"];
        }

        // default active categories
        $setting = \WHMCS\Config\Setting::getValue("ispapiDomaincheckDefaultCategories");
        if ($setting != null && trim($setting)!="") {
            $defcats = explode(",", $setting);
            foreach ($defcats as &$cat) {
                $cat = (int)$cat;
            }
        }

        //get list of tlds ordered by priority
        $tldsbyprio = array();
        $rows = DCHelper::SQLCall("SELECT SUBSTR(extension,2) as extension FROM `tbldomainpricing` ORDER BY `order` ASC", null, "fetchall");
        foreach ($rows as &$row) {
            $tldsbyprio[] = $row["extension"];
        }

        //get categories and pricing
        $scfg = DCHelper::getSearchConfiguration($_SESSION["currency"], $backordering);

        //build response format
        $cfg = array(
            //lookup provider
            "lookupprovider" => \WHMCS\Config\Setting::getValue('domainLookupRegistrar'),
            //backorder items: domain <-> application id
            "backorders" => $backorders,
            //load categories + tlds + prices
            "categories" => $scfg["categories"],
            //pricing
            "pricing" => $scfg["pricing"],
            //tlds by priority
            "tldsbyprio" => $tldsbyprio,
            //load configured registrars for tlds
            "registrars" => DCHelper::getTLDRegistrars(),
            //paths
            "path_to_dc_module" => "/modules/addons/ispapidomaincheck/",
            //check if suggestion engine is active or not
            "suggestionsOn" => (DCHelper::getDomaincheckerMode()=="on")?1:0,
            //default active Categories
            "defaultActiveCategories" => $defcats,
            //premium domains availability
            "premiumDomains" => (int)\WHMCS\Config\Setting::getValue('PremiumDomains'),
            //taken domains availability
            "takenDomains" => (int)\WHMCS\Config\Setting::getValue('ispapiDomaincheckTakenDomains')
        );
        if ($cfg["suggestionsOn"]) {
            //locales for domain name suggestion config
            $cfg["locales"] = \LANG::getLocales();
        }
        if ($backordering) {
            $cfg["path_to_bo_module"] = "/modules/addons/ispapibackorder/";
        }
        return $cfg;
    }
}
