<?php

namespace WHMCS\Module\Addon\ispapidomaincheck;

use WHMCS\Config\Setting;
use WHMCS\Domains\Pricing\Premium;
use WHMCS\Module\Registrar\Ispapi\Helper;

$path = implode(DIRECTORY_SEPARATOR, [ROOTDIR,"modules","registrars","ispapi","lib","Helper.php"]);
if (!file_exists($path)) {
    die("Please install the latest version of our <a href=\"https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip\">ISPAPI Registrar Module</a>.");
}
require_once($path);

/**
 * PHP DCHelper Class
 *
 * @copyright  2018 HEXONET GmbH
 */
class DCHelper extends Helper
{
    /**
     * load full tld pricing data for all currencies.
     *
     * @return array cross-currency tld pricing data
     */
    public static function loadfullcurrencydata()
    {
        $data = [];
        $cs = localAPI("GetCurrencies", []);
        if ($cs["result"] != "success") {
            return false;
        }

        foreach ($cs["currencies"]["currency"] as $currency) {
            $d = localAPI("GetTLDPricing", ["currencyid" => $currency["id"]]);
            if ($d["result"] != "success") {
                return false;
            }
            $data[] = $d;
        }
        return $data;
    }

    /**
     * save a configuration setting
     *
     * @param string $key configuration setting id
     * @param string $val configuration setting value
     * @return array operation result
     */
    public static function saveSetting($key, $val)
    {
        $setting = \WHMCS\Config\Setting::setValue($key, $val);
        if ($setting->value == $val) {
            return [
                "success" => true,
                "msg" => "Setting saved successfully."
            ];
        }
        return [
            "success" => false,
            "msg" => "Update not processed."
        ];
    }

    /*
     * Helper to send SQL call to the Database with Capsule
     *
     *
     * @param string $sql The SQL query
     * @param array $params The parameters of the query DEFAULT = NULL
     * @param $fetchmode The fetching mode of the query (fetch, fetchall, execute) - DEFAULT = fetch
     * @param $debug Set to true to have the SQL Query in addition returned in case of an error
     * @return json|array The SQL query response or JSON string with error message.
     */
    public static function SQLCall($sql, $params = null, $fetchmode = "fetch", $debug = false)
    {
        $r = parent::SQLCall($sql, $params, $fetchmode, $debug);
        if (empty($r["errormsg"])) {
            if ($fetchmode == "execute") {
                return $r["success"];
            }
            return $r["result"];
        }
        $out = [
            "feedback" => [
                "f_type" => "sqlerror",
                "f_message" => "An error occured, please contact support."
            ]
        ];
        if ($debug) {
            $out["sqlmessage"] = $r["errormsg"];
            $out["sqlquery"] = $query;
        }
        die(json_encode($out));
    }

    /**
     * Returns the domainchecker mode. (Suggestions or Regular)
     *
     * @return string The domainchecker mode
     */
    public static function getDomaincheckerMode()
    {
        $registrar = \WHMCS\Config\Setting::getValue('domainLookupRegistrar');
        if ($registrar === "ispapi") {
            $dc_setting = self::getLookupConfigurationValue($registrar, 'suggestions');
            if (!empty($dc_setting)) {
                return $dc_setting;
            }
        }
        return "";
    }

    /**
     * Returns the suggestion engine settings
     *
     * @return string The domainchecker mode
     */
    public static function getSuggestionsConfig()
    {
        $cfg = [];
        if (!empty(self::getDomaincheckerMode())) {
            $defaults = [
                "suggstionsamount" => 100,
                "suggestionsnoweighted" => false
            ];
            foreach (["suggstionsamount", "suggestionsnoweighted"] as $k) {
                $v = self::getLookupConfigurationValue("ispapi", $k);
                if (is_null($v)) {
                    $v = $defaults[$k];
                } elseif ($v === "on") {
                    $v = true;
                }
                $cfg[$k] = $v;
            }
        }
        return $cfg;
    }

    /**
     * Get configuration value for given addon module and setting
     *
     * @param string $module the addon name
     * @param string $setting the setting
     * @return null|string|array returns null in case of an error otherwise the configuration value or assoc array if $setting not provided
     */
    public static function getAddOnConfigurationValue($module, $setting = false)
    {
        if ($setting === false) {
            $sql = "SELECT * FROM tbladdonmodules WHERE module=:module";
            $modulevars = [];
            $r = DCHelper::SQLCall($sql, [
                ":module" => $module
            ], "fetchall");
            foreach ($r as $row) {
                $modulevars[$row["setting"]] = $row["value"];
            }
            return $modulevars;
        }
        $r = DCHelper::SQLCall(
            "SELECT value FROM tbladdonmodules WHERE module=:module AND setting=:setting LIMIT 1",
            [
                ":module" => $module,
                ":setting" => $setting
            ]
        );
        return isset($r["value"]) ? $r["value"] : null;
    }

    /**
     * Get lookup provider configuration value for given registrar and setting
     *
     * @param string $registrar the registrar
     * @param string $setting the setting
     * @return null|string returns null in case of an error otherwise the configuration value
     */
    public static function getLookupConfigurationValue($registrar, $setting)
    {
        $r = self::SQLCall(
            "SELECT value FROM tbldomain_lookup_configuration WHERE registrar = :registrar AND setting = :setting LIMIT 1",
            [
                ":registrar" => $registrar,
                ":setting" => $setting
            ]
        );
        return isset($r["value"]) ? $r["value"] : null;
    }

    /**
     * Fetch all TLDs with no registrar configured for whois lookup
     *
     * @return array list of tlds
     */
    public static function getWhoisLookupTLDs()
    {
        $registrars = [];
        // `none` (empty string)
        $rows = self::SQLCall("SELECT SUBSTR(extension, 2) as extension FROM tbldomainpricing WHERE autoreg is null or autoreg = ''", null, "fetchall");
        foreach ($rows as $row) {
            $registrars[$row["extension"]] = 1;
        }
        return $registrars;
    }
    /**
     * Fetch list of active registrars
     *
     * @return array list of active registrars
     */
    public static function getActiveRegistrars()
    {
        $regs = [];
        $rows = self::SQLCall("SELECT DISTINCT registrar FROM tblregistrars ORDER BY registrar ASC", null, "fetchall");
        foreach ($rows as $row) {
            $regs[] = $row["registrar"];
        }
        return $regs;
    }
    /**
     * Fetch list of registrar per TLD
     *
     * @return array map TLD <-> configured registrar, empty string for `none`
     */
    public static function getTLDRegistrars()
    {
        $registrars = [];
        //TODO do not offer if registrar is not set or inactive
        //We may filter by prev. method
        $rows = self::SQLCall("SELECT SUBSTR(extension, 2) as extension, autoreg FROM tbldomainpricing", null, "fetchall");
        foreach ($rows as $row) {
            $registrars[$row["extension"]] = $row["autoreg"];
        }
        return $registrars;
    }

    /**
     * Get the list of search categories with their TLDs incl. pricing for given currency
     *
     * @param int $currencyid the currency ID
     * @return array list of defined categories and tlds incl. pricing
     */
    public static function getSearchConfiguration($currencyid, $backorderEngineOn = false, $uid = null)
    {
        global $_LANG;
        
        if (!is_null($uid)) {
            $pricing = localApi('GetTLDPricing', [
                'clientid' => $_SESSION['uid']
            ]);
        } else {
            $pricing = localApi('GetTLDPricing', [
                'currencyid' => $currencyid
            ]);
        }

        if ($backorderEngineOn) {
            $prices = self::SQLCall(
                "SELECT extension, fullprice, liteprice FROM backorder_pricing WHERE currency_id=:currencyid",
                [
                    ":currencyid" => $currencyid
                ],
                "fetchall"
            );
            foreach ($prices as &$p) {
                $tld = $p["extension"];
                if (!isset($pricing["pricing"][$tld])) {
                    $pricing["pricing"][$tld] = [];
                }
                if (!is_null($p["fullprice"])) {
                    $pricing["pricing"][$tld]["backorder"] = "" . $p["fullprice"];
                }
                if (!is_null($p["liteprice"])) {
                    $pricing["pricing"][$tld]["backorderlite"] = "" . $p["liteprice"];
                }
            }
        }

        foreach ($pricing["pricing"] as $tld => &$data) {
            unset(
                $data["categories"],
                $data["addons"],
                $data["redemption_period"],
                $data["grace_period"],
                $data["transfer"]
            );
            if (empty($data)) {
                unset($pricing["pricing"][$tld]);
            }
        }

        $r = self::SQLCall("SELECT * FROM ispapi_tblcategories", null, "fetchall");
        foreach ($r as $idx => &$row) {
            $row["tlds"] = explode(" ", preg_replace("/\s\s+/", " ", trim($row["tlds"])));
            $row["tlds"] = array_filter($row["tlds"], function ($tld) use ($pricing) {
                return array_key_exists($tld, $pricing["pricing"]);
            });
            $row["id"] = (int)$row["id"];
            if (empty($row["tlds"])) {
                unset($r[$idx]);
            } else {
                //ensure correct ordered index (avoid json encode issues)
                $row["tlds"] = array_values($row["tlds"]);
            }
            if (isset($_LANG["domainTldCategory"][$row["name"]])) {
                $row["name"] = $_LANG["domainTldCategory"][$row["name"]];
            }
        }
        //ensure correct ordered index (avoid json encode issues)
        $r = array_values($r);

        return [
            "categories" => $r,
            "pricing" => [
                "tlds" => $pricing["pricing"],
                "currency" => $pricing["currency"]
            ]
        ];
    }

    /**
     * Loads the backorder API, returns false if backorder module not installed.
     *
     * @return boolean true if backorder API has been loaded
     */
    public static function loadBackorderAPI()
    {
        $activeAddOns = explode(",", $GLOBALS["CONFIG"]["ActiveAddonModules"]);
        if (in_array("ispapibackorder", $activeAddOns)) {
            $path = implode(DIRECTORY_SEPARATOR, [ROOTDIR,"modules","addons","ispapibackorder","backend","api.php"]);
            if (file_exists($path)) {
                require_once($path);
                return true;
            }
        }
        return false;
    }

    /**
     * Get the domain extension (e.g. testdomain.net => net)
     *
     * @param string $domain The IDN domain name
     * @return string The domain extension (without ".")
     */
    public static function getDomainExtension($domain)
    {
        return preg_replace("/^[^.]+\./", "", $domain);
    }

    /**
     * Converts the price in the selected currency and add the markup.
     * Selected currency is taken from the session.
     *
     * @see https://docs.whmcs.com/Premium_Domains (premium renewal costs are without markup!)
     *
     * @param string $price A price
     * @param array $registrar_currency_array WHMCS currency settings for registrar currency
     * @return string The price converted BUT NOT FORMATTED
     */
    private static function convertPriceToSelectedCurrency($price, $registrar_currency_array, $ordertype)
    {
        //get the selected currency
        $selected_currency_array = self::getCurrencySettingsById($_SESSION["currency"]);
        $code = $selected_currency_array["code"];

        if ($registrar_currency_array) {
            //WE ARE ABLE TO CALCULATE THE PRICE
            $registrar_code = $registrar_currency_array["code"];
            if ($code == $registrar_code) {
                return round(($ordertype === "renew") ? $price : self::addResellerMarkup($price), 2);
            } else {
                $rate = $selected_currency_array["rate"];
                if ($registrar_currency_array["default"] == 1) {
                    //CONVERT THE PRICE IN THE SELECTED CURRENCY
                    $cost = $price * $rate;
                    return round(($ordertype === "renew") ? $cost : self::addResellerMarkup($cost), 2);
                } else {
                    //FIRST CONVERT THE PRICE TO THE DEFAULT CURRENCY AND
                    //THEN CONVERT THE PRICE IN THE SELECTED CURRENCY
                    //get the price in the default currency
                    $price_default_currency = $price * ( 1 / $registrar_currency_array["rate"] );
                    $cost = $price_default_currency * $rate;
                    //get the price in the selected currency
                    return round(($ordertype === "renew") ? $cost : self::addResellerMarkup($cost), 2);
                }
            }
        }
        return "";
    }

    /**
     * Returns the price for a premiumdomain renewal.
     *
     * @param string $registrar The assigned registrar for the TLD
     * @param string $class The premium class
     * @param string $tld The IDN TLD (com, net, co.uk, ...)
     * @param string $currencysettings whmcs settings for the registrar currency
     * @return string The price not formatted
     */
    public static function getPremiumRenewPrice($registrar, $class, $tld, $currencysettings)
    {
        //here we are calling the getRenewPrice from the respective registar module
        $fn = $registrar . "_getRenewPrice";
        if (function_exists($fn)) {
            $registrarRenewPrice = call_user_func(
                $fn,
                getregistrarconfigoptions($registrar),
                $class,
                $currencysettings["id"],
                $tld
            );
            return self::convertPriceToSelectedCurrency($registrarRenewPrice, $currencysettings, "renew");
        }
        return false;
    }

    /**
     * Get all configuration settings for a currency specified by given currency id
     *
     * @param int $currencyid the currency id
     * @return null|array returns null in case of an error otherwise the configuration values
     */
    private static function getCurrencySettingsById($currencyid)
    {
        return self::SQLCall(
            "SELECT * FROM tblcurrencies WHERE id=:currencyid LIMIT 1",
            [
                ":currencyid" => $currencyid
            ]
        );
    }

    /**
     * Adds the reseller markup to the given price
     *
     * @param string $price A price
     * @return string The markup'ed price
     */
    public static function addResellerMarkup($price)
    {
        return $price + ($price * Premium::markupForCost($price) / 100);
    }

    /**
     * Returns the price for a premiumdomain registration.
     * NOTE: (Sometimes we are getting rounding problems (1 cent), not exactly the same price than with the standard lookup.)
     *
     * @param string $registrarprice The domain registration price (at registrar)
     * @param string $currencysettings WHMCS currency settings for the registrar price
     * @return string The not formatted price
     */
    public static function getPremiumRegistrationPrice($registrarprice, $currencysettings)
    {
        return self::convertPriceToSelectedCurrency($registrarprice, $currencysettings, "register");
    }
}
