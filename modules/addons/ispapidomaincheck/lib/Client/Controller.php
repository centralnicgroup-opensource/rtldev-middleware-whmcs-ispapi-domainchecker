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
        //$invalids = [];
        //$takens = [];
        //$reserveds = [];
        if ($res["success"]) {
            $keys = ["PREMIUMCHANNEL", "PRICE", "PRICERENEW", "REASON", "CLASS"];
            $rs = $r["PROPERTY"];
            if ($rs) {
                if (isset($rs["PRICE"])) {
                    $rs["PRICERENEW"] = $rs["PRICE"];//create a copy to have all indexes
                }
                foreach ($rs["DOMAINCHECK"] as $idx => &$val) {
                    $idn = $data["idn"][$idx];
                    list($code, $descr) = explode(" ", $val, 2);
                    $row = [
                        "DOMAIN" => $data["pc"][$idx],
                        "API" => [
                            "CODE" => $code ? $code : "421",
                            "DESCR" => $descr ? $descr : "Temporary Error occured.",
                            "REASON" => $code ? $rs["REASON"][$idx] : ""
                        ]
                    ];
                    $type = false;
                    switch ($row["API"]["CODE"]) {
                        case "210":
                            $row["statusText"] = SearchResult::STATUS_NOT_REGISTERED;
                            $row["status"] = "AVAILABLE";
                            break;
                        case "":
                        case "421":
                            $row["statusText"] = SearchResult::STATUS_UNKNOWN;
                            $row["status"] = "ERROR";
                            $row["REASON"] = $row["API"]["DESCR"];
                            break;
                        case "504":
                        case "505":                           
                        case "541":
                        case "549"://invalid repository (unsupported TLD)
                            // 504 Parameter value policy error
                            // 505 Parameter value syntax error: Invalid domain name.
                            // 549 Command failed; Invalid value in field [.+/DomainName]
                            // 549 Command failed; Domain name is not a valid IDN for this TLD
                            $row["statusText"] = preg_replace("/^[^;]+; /", "", $val);
                            $row["status"] = "INVALID";
                            //$invalids[$row["DOMAIN"]] = $row;
                            
                            /*$whois = localAPI('DomainWhois', ["domain" => $idn]);
                            if ($whois["result"] === "error") {
                                $availability = -1;
                                $rs["REASON"][$idx] = $whois["message"];
                            } else {
                                $availability = preg_match("/^available$/i", $whois["status"]);
                            }*/
                            break;
                        case "211":
                            if (preg_match("/reserved/i", $rs["REASON"][$idx])) {
                                $row["statusText"] = SearchResult::STATUS_RESERVED;
                                $row["status"] = "RESERVED";
                                //$reserveds[$row["DOMAIN"]] = $row;
                            } elseif (
                                preg_match("/^(invalid|Character from an invalid script.|Invalid.+syntax|.+is not supported|Domain name not in a valid format.|.+Illegal unicode code points|U-label is not valid.+|disallowed codes|Not a valid.+domain name|invalid domain name|string contains.+character table)$/i", $rs["REASON"][$idx])
                                || $rs["CLASS"][$idx] === "PREMIUM_ASIA_INVALID"
                            ) {
                                $row["statusText"] = $rs["REASON"][$idx];
                                $row["status"] = "INVALID";
                                //$invalids[$row["DOMAIN"]] = $row;
                            } else {
                                $row["status"] = "TAKEN";
                                $row["statusText"] = SearchResult::STATUS_REGISTERED;   
                                //$availability = false; // TODO
                                //further handling of specific cases on client-sides
                                if (
                                    !empty($rs["PREMIUMCHANNEL"][$idx]) //e.g. AFTERNIC, SEDO
                                    && preg_match("/not available/i", $descr) //taken ones -> aftermarket
                                    && isset($rs["PRICE"], $rs["CURRENCY"])
                                    && !empty($rs["PRICE"][$idx])
                                ) {
                                    $row["status"] = "AFTERMARKET";//STATUS_REGISTERED
                                }
                                elseif (
                                    !empty($rs["PREMIUMCHANNEL"][$idx]) //exclude already registered ones
                                    && preg_match("/^PREMIUM_/", $rs["CLASS"][$idx])
                                    && preg_match("/^Premium Domain name available/i", $descr) //exclude aftermarket
                                    && isset($rs["PRICE"], $rs["CURRENCY"])
                                    && !empty($rs["PRICE"][$idx])
                                ) {
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
                                        //$availability = true;//TODO
                                        $row["statusText"] = SearchResult::STATUS_NOT_REGISTERED;
                                        $row["status"] = "AVAILABLE";
                                        $rs["PRICE"][$idx] = $register_price_raw;
                                        $rs["PRICERENEW"][$idx] = $renew_price_raw;
                                    }
                                }
                                //if (!$availability) {//TODO
                                //    $takens[$row["DOMAIN"]] = $row;
                                //}
                            }
                            break;
                        default:
                            $row["status"] = "TAKEN";
                            $row["statusText"] = SearchResult::STATUS_REGISTERED;
                            //$takens[$row["DOMAIN"]] = $row;
                            break;
                    }
                    foreach ($keys as &$key) {
                        if (!empty($rs[$key][$idx])) {
                            $row[$key] = $rs[$key][$idx];
                        }
                    }
                    $res["results"][] = $row;
                }
            }
        } else {
            $msg = "Check failed (" . $r["CODE"] . " " . $r["DESCRIPTION"] . ")";
            foreach ($data["pc"] as &$pc) {
                $res["results"][] = [
                    "statusText" => SearchResult::STATUS_UNKNOWN,
                    "status" => "ERROR",
                    "REASON" => $msg
                ];
            }
            $res["errormsg"] = $msg;
        }
        /*if (!empty($invalids)) {
            $file = "/var/www/html/invalid.json";
            if (file_exists($file)) {
                $current = json_decode(file_get_contents($file), true);
                $current = array_merge($current, $invalids);
            } else {
                $current = $invalids;
            }
            file_put_contents($file, json_encode($current, JSON_PRETTY_PRINT));
        }
        if (!empty($takens)) {
            $file = "/var/www/html/taken.json";
            if (file_exists($file)) {
                $current = json_decode(file_get_contents($file), true);
                $current = array_merge($current, $takens);
            } else {
                $current = $takens;
            }
            file_put_contents($file, json_encode($current, JSON_PRETTY_PRINT));
        }*/
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
        if ($r["CODE"] == "200" && $r["PROPERTY"]["COUNT"][0] > 0) {
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
