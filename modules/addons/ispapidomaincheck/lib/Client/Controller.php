<?php

namespace WHMCS\Module\Addon\ispapidomaincheck\Client;

use WHMCS\Domains\Pricing\Premium;
use WHMCS\Domains\DomainLookup\SearchResult;
use WHMCS\Config\Setting;
use WHMCS\Module\Addon\ispapidomaincheck\DCHelper;
use WHMCS\Module\Registrar\Ispapi\Ispapi;

/**
 * Client Area Controller
 */
class Controller
{

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
            $_SESSION["relations"] = [];
            $r = Ispapi::call(['COMMAND' => 'StatusUser']);
            if ($r["CODE"] == "200" && isset($r["PROPERTY"]["RELATIONTYPE"])) {
                foreach ($r["PROPERTY"]["RELATIONTYPE"] as $idx => &$type) {
                    $_SESSION["relations"][$type] = $r["PROPERTY"]["RELATIONVALUE"][$idx];
                }
            }
        }
        return [
            'vars' => [
                '_lang' => $vars['_lang'],
                'modulelink' => $vars['modulelink'],
                'modulepath' => "/modules/addons/ispapidomaincheck/",
                'domain' => isset($_POST["domain"]) ? $_POST["domain"] : "",
                'currency' => $_SESSION["currency"],
                'carttpl' => Setting::getValue("OrderFormTemplate")
            ]
        ];
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
        $cmd = [
            "COMMAND"           => "CheckDomains",
            "DOMAIN"            => $data["pc"]
        ];
        if ($data["premiumDomains"] == 1) {
            $cmd["PREMIUMCHANNELS"] = "*";
        }
        $r = Ispapi::call($cmd);//TODO check for active registrar
        $res = [
            "success" => $r["CODE"] == "200",
            "results" => []
        ];
        if ($res["success"]) {
            $keys = ["PREMIUMCHANNEL", "PRICE", "PRICERENEW", "REASON", "CLASS"];
            $rs = $r["PROPERTY"];
            if ($rs) {
                if (isset($rs["PRICE"])) {
                    $rs["PRICERENEW"] = $rs["PRICE"];//create a copy to have all indexes
                }
                foreach ($rs["DOMAINCHECK"] as $idx => &$val) {
                    $idn = $data["idn"][$idx];
                    $row = [];
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
                            $whois = localAPI('DomainWhois', ["domain" => $idn]);
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
                                    //TODO: we could improve here by just converting currency
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
                $res["results"][] = [
                    "statusText" => SearchResult::STATUS_UNKNOWN,
                    "status" => "UNKOWN"
                ];
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
        $cmd = [
            "COMMAND"   => "QueryDomainSuggestionList",
            "KEYWORD"   => $data['keyword'],
            "SOURCE"    => "ISPAPI-SUGGESTIONS",
            "FIRST"     => 0,
            "LIMIT"     => 500
        ];
        foreach ($data['zones'] as $idx => $z) {//TODO support arrays in every SDK
            $cmd["ZONE" . $idx] = $z;
        }
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
            $cmd["LANGUAGE"] = [$data["language"]];
        }
        //TODO replace 'ispapi' with registrar lookup
        $r = Ispapi::call($cmd);
        if ($r["CODE"] == "200") {
            return $r["PROPERTY"]["DOMAIN"];
        }
        return [];
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
        return $vars["_lang"];
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
        if (isset($data["IDN"], $data["PC"])) {
            foreach ($_SESSION["cart"]["domains"] as $index => &$row) {
                if ($row["domain"] == $data["IDN"] || $row["domain"] == $data["PC"]) {
                     unset($_SESSION["cart"]["domains"][$index]);
                     $_SESSION["cart"]["domains"] = array_values($_SESSION["cart"]["domains"]);
                     return [
                         "success" => true
                     ];
                }
            }
        }
        return [
            "success" => false
        ];
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
        $cartitems = [];
        foreach (
            array_filter(
                $orderfrm->getCartDataByKey('domains', []),
                function ($item) {
                    return ($item["type"] === "register");
                }
            ) as &$item
        ) {
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
        $backorders = [];
        $backordering = DCHelper::loadBackorderAPI();
        if ($backordering) {
            //get all domains that have already been backordered by the user. If not logged in, array will be empty, this is perfect.
            $r = backorder_api_call([
                "COMMAND" => "QueryBackorderList"
            ]);
            if ($r["CODE"] == "200" && isset($r["PROPERTY"]["DOMAIN"])) {
                foreach ($r["PROPERTY"]["DOMAIN"] as $idx => &$d) {
                    $backorders[$d] = 1; //TODO $r["PROPERTY"]["ID"][$idx];
                }
            }
        }

        // collect current configuration data
        // and build list of tlds in use by this configuration
        $categories = DCHelper::SQLCall("Select * from ispapi_tblcategories ORDER BY name ASC", null, "fetchall");
        $defcats = [];
        foreach ($categories as &$cat) {
            $cat["id"] = (int)$cat["id"];
            $defcats[] = $cat["id"];
        }

        // default active categories
        $setting = \WHMCS\Config\Setting::getValue("ispapiDomaincheckDefaultCategories");
        if ($setting != null && trim($setting) != "") {
            $defcats = explode(",", $setting);
            foreach ($defcats as &$cat) {
                $cat = (int)$cat;
            }
        }

        //get list of tlds ordered by priority
        $tldsbyprio = [];
        $rows = DCHelper::SQLCall("SELECT SUBSTR(extension,2) as extension FROM `tbldomainpricing` ORDER BY `order` ASC", null, "fetchall");
        foreach ($rows as &$row) {
            $tldsbyprio[] = $row["extension"];
        }

        //get categories and pricing
        $scfg = DCHelper::getSearchConfiguration($_SESSION["currency"], $backordering, $_SESSION["uid"]);

        //build response format
        $cfg = [
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
            "suggestionsOn" => (DCHelper::getDomaincheckerMode() == "on") ? 1 : 0,
            //suggestcheck if .com / .net have to be suppressed (suggestions engine)
            "suggestionsCfg" => DCHelper::getSuggestionsConfig(),
            //default active Categories
            "defaultActiveCategories" => $defcats,
            //premium domains availability
            "premiumDomains" => (int)\WHMCS\Config\Setting::getValue('PremiumDomains'),
            //taken domains availability
            "takenDomains" => (int)\WHMCS\Config\Setting::getValue('ispapiDomaincheckTakenDomains')
        ];
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
