<?php
namespace ISPAPI;

use WHMCS\Database\Capsule;
use WHMCS\Domains\Pricing\Premium;
use WHMCS\Config\Setting;
use PDO;

/**
 * PHP Class for the HP DomainCheck feature
 *
 * @copyright  2018 HEXONET GmbH
 */
class DomainCheck
{
    private $domain;
    private $domains;
    private $tldgroup;
    private $action;
    private $registrars;
    private $currency;
    private $response;
    private $i18n;

    /**
     *  Constructor
     *
     *  @param string $domain The searched domain
     *  @param string $domains The list of domains to check
     *  @param string $tldgroup Restrict the search to the given tldgroups
     *  @param string $action The action
     *  @param array $registrars The configured registrars (can be more than one)
     *  @param array $currency The selected currency
     */
    public function __construct($domain, $domains, $tldgroup, $action, $registrars, $currency)
    {
        $this->domain = $domain;
        $this->domains = $domains;
        $this->tldgroup = $tldgroup;
        $this->action = $action;
        $this->registrars = $registrars;
        $this->currency = $currency;
        $this->i18n = new I18n();

        $this->doDomainCheck();
    }

    /**
     * This function is called on each instantiation and calls the right method for a given action
     */
    private function doDomainCheck()
    {
        switch ($this->action) {
            case "getList":
                $this->getDomainList();
                break;
            case "removeFromCart":
                $this->removeFromCart();
                break;
            case "addPremiumToCart":
                $this->addPremiumToCart();
                break;
            default:
                $this->startDomainCheck();
                break;
        }
        $this->send();
    }

    /**
     * Removes the domain from the cart
     */
    private function removeFromCart()
    {
        $response = array();
        if (isset($this->domain)) {
            foreach ($_SESSION["cart"]["domains"] as $index => &$domain) {
                if (in_array($this->domain, $domain)) {
                     unset($_SESSION["cart"]["domains"][$index]);
                     $response["feedback"] = $this->i18n->getText("remove_from_cart");
                }
            }
        }
        $this->response = json_encode($response);
    }

    /**
     * Adds the Premium domain to the cart
     */
    private function addPremiumToCart()
    {
        $response = array();
        if (isset($this->domain)) {
            //get the registrarCostPrice, registrarRenewalCostPrice and registrarCurrency of the domain name
            //calculate the customer price and compare with the price we get from $_REQUEST, if they match, add to the cart
            $registrar = self::getRegistrarForDomain($this->domain);
            if (isset($registrar)) {
                $check = DCHelper::APICall($registrar, array(
                    "COMMAND" => "CheckDomains",
                    "PREMIUMCHANNELS" => "*",
                    "DOMAIN" => array($this->domain)
                ));
                if (!empty($check["PROPERTY"]["PREMIUMCHANNEL"][0])) {
                    $registrarprice = $check["PROPERTY"]["PRICE"][0];
                    $registrarpriceCurrency = $check["PROPERTY"]["CURRENCY"][0];

                    $register_price = $this->getPremiumRegistrationPrice($registrarprice, $registrarpriceCurrency);
                    $renew_price = $this->getPremiumRenewPrice($registrar, $check["PROPERTY"]["CLASS"][0], $registrarpriceCurrency, $this->domain);

                    //if the registration price we get from $_REQUEST is the same than the one we calculated, then we can add the dommain to the cart
                    if (abs($_REQUEST['registerprice'] - $register_price) < 0.1) { //due to roundings, we are not comparing with simple =
                        //get the domain currency id
                        $domain_currency_id = self::getCurrencyIDByCode($registrarpriceCurrency);
                        if (!is_array($_SESSION["cart"]["domains"])) {
                            $_SESSION["cart"]["domains"] = array();
                        }
                        
                        $_SESSION["cart"]["domains"][] = array(
                            "type" => "register",
                            "domain" => $this->domain,
                            "regperiod" => "1",
                            "isPremium" => "1",
                            "domainpriceoverride" => $register_price,
                            "registrarCostPrice" => $registrarprice,
                            "registrarCurrency" => $domain_currency_id,
                            "domainrenewoverride" =>  $renew_price,
                            //"registrarRenewalCostPrice" => //NOT REQUIRED
                        );
                        $response["feedback"] = $this->i18n->getText("add_to_cart");
                    }
                }
            }
        }
        $this->response = json_encode($response);
    }

    /**
     * Set the response to the list of domains that have to be checked.
     */
    private function getDomainList()
    {
        //delete HTTP:// or HTTPS:// if domain's starting with it
        $this->domain = preg_replace("/^https?:\/\//i", "", $this->domain);
        //delete WWW. if domain's starting with it
        $this->domain = preg_replace("/^www\./i", "", $this->domain);
        //remove all white spaces
        $this->domain = strtolower(preg_replace("/\s+/", "", $this->domain));

        $feedback = array();
        $do_not_search = false;
        $domainlist = array();

        $tldgroups = self::getTLDGroups($this->tldgroup);
        $searched_label = self::getDomainLabel($this->domain);
        $searched_tld = self::getDomainExtension($this->domain);

        if (!empty($this->registrars) && self::getDomaincheckerMode() == "on") {
            //SUGGESTIONS MODE
            //use the first ispapi registrar to query the suggestion list
            $registrar = $this->registrars[0];
            //first convert the search from IDN to Punycode as this is requested by QueryDomainSuggestionList command.
            //WRONG! Read FTASKS-2442, therefore switched to to convertToIDN
            $searched_label = self::convertToIDN($searched_label, $registrar);
            $suggestions = DCHelper::APICall($registrar, array(
                "COMMAND" => "QueryDomainSuggestionList",
                "KEYWORD" => $searched_label,
                "ZONE" => $tldgroups,
                "SOURCE" => "ISPAPI-SUGGESTIONS",
                "LIMIT" => "60"
            ));
            //convert the domainlist to IDN as it is returned in punycode
            $domainlist = self::convertToIDN($suggestions['PROPERTY']['DOMAIN'], $registrar);
        } else {
            //REGULAR MODE
            foreach ($tldgroups as &$tld) {
                $domainlist[] = $searched_label.".".$tld;
            }
        }

        //check if the searched keyword contains a configured TLD
        //example: thebestshop -> thebest.shop should be at the top
        $extensions = self::getConfiguredExtensions(true);
        foreach ($extensions as &$extension) {
            if (preg_match('/'.$extension.'$/i', $searched_label)) {
                $tmp = explode($extension, $searched_label);
                //add to the domain to the list if not empty
                if (!empty($tmp[0])) {
                    $domainlist[] = $tmp[0].".".$extension;
                }
            }
        }

        //remove duplicate entries in the domainlist and change the keys to keep them consecutive. (array_values)
        $domainlist = array_values(array_unique($domainlist));

        //add the domain at the top of the list even if he's not in the current group, but just when he's configured in WHMCS
        $item = self::getRegistrarForDomainExtension($searched_tld);
        if (!empty($item)) {
            //put the searched domain at the first place of the domain list
            self::deleteElement($this->domain, $domainlist);
            array_unshift($domainlist, $this->domain);
        } else {
            //if $searched_tld not empty display feedback message
            if (!empty($searched_tld)) {
                $feedback = array(
                    "f_type" => "error",
                    "f_message" => $this->i18n->getText("domain_not_supported_feedback"),
                    "id" => $this->domain
                );
                $do_not_search = true;
            }
        }

        //TODO checkorder with the order of the category editor?
        //$this->getSortedDomainList($domainlist);
        //removed; now we are checking all TLDs with API even if not configured with ISPAPI.
        $domainlist_checkorder = $domainlist;

        //if there is an issue with the search, do not start checking
        if ($do_not_search) {
            $domainlist = array();
            $domainlist_checkorder = array();
        }

        $this->response = json_encode(array(
            "listorder" => $domainlist,
            "checkorder" => $domainlist_checkorder,
            "feedback" => $feedback
        ));
    }

   /**
    * Returns the domainchecker mode. (Suggestions or Regular)
    *
    * @return string The domainchecker mode
    */
    private static function getDomaincheckerMode()
    {
        $registrar = Setting::getValue('domainLookupRegistrar');
        if ($registrar == "ispapi") {
            $dc_setting = self::getLookupConfigurationValue($registrar, 'suggestions');
            if (!empty($dc_setting)) {
                return $dc_setting;
            }
        }
        return "";
    }

   /**
    * Loads the backorder API, returns false if backorder module not installed.
    *
    * @return boolean true if backorder API has been loaded
    */
    private function loadBackorderAPI()
    {
        $r = self::getAddOnConfigurationValue('ispapibackorder', 'access');
        if (isset($r["value"])) {
            $path = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapibackorder","backend","api.php"));
            if (file_exists($path)) {
                require_once($path);
                return true;
            }
        }
        return false;
    }

    /**
     * Starts the domain check procedure.
     * Handle the check domain with the configured ispapi registrar account configured in WHMCS
     * Sets the response to a JSON list of all domains with the availability
     */
    private function startDomainCheck()
    {
        // In the past we had 2 different lists:
        // 1: $ispapi_domain_list  domains that use our registrar module
        // 2: $no_ispapi_domain_list  domains that don't use our registrar module
        // Since we are now allowing all registrar to use our API for checks, we will put all the domains in $ispapi_domain_list.
        // If we are not supporting this TLD, we will add the domain to the $no_ispapi_domain_list after we got an error from the checkdomain. (549)
        $feedback = array();
        $extendeddomainlist = self::getExtendedDomainlist($this->domains, $this->registrars);
        $no_ispapi_domain_list = array();
        $response = array();

        //get the selected currency
        $selected_currency_array = self::getCurrencySettingsById($this->currency);

        foreach ($extendeddomainlist as &$listitem) {
            //use WHOIS to do the checks
            if ($listitem["registrar"]=="whois") {
                $no_ispapi_domain_list = array_merge($no_ispapi_domain_list, $listitem["domain"]);
            } else {
                $command = array(
                    "COMMAND"   => "CheckDomains",
                    "DOMAIN"    => self::convertToPunycode($listitem["domain"], $listitem["registrar"])
                );
                //set PREMIUMCHANNELS=* if premium domains should be displayed
                if ($listitem["show_premium"] == 1) {
                    $command["PREMIUMCHANNELS"] = "*";
                }
                $check = DCHelper::APICall($listitem["registrar"], $command);
                foreach ($listitem["domain"] as $index => &$item) {
                    $availability = $check["PROPERTY"]["DOMAINCHECK"][$index];
                    $tmp = explode(" ", $availability);
                    $code = $tmp[0];
                    $class = $check["PROPERTY"]["CLASS"][$index];
                    $premiumchannel = $check["PROPERTY"]["PREMIUMCHANNEL"][$index];
                    $status = $premiumtype = $register_price_unformatted = $renew_price_unformatted = $register_price = $renew_price = "";

                    if ($code == "549") {
                        //TLD NOT SUPPORTED AT HEXONET USE A FALLBACK TO THE WHOIS LOOKUP
                        //add the domain to the $no_ispapi_domain_list so it will be automatically checked by the WHOIS LOOKUP in the next step
                        $no_ispapi_domain_list[] = $item;
                    } elseif ($code == "210") {
                        //DOMAIN AVAILABLE
                        $whmcspricearray = self::getTLDprice(self::getDomainExtension($item), $this->currency);
                        $register_price_unformatted = $whmcspricearray["domainregister"][1];
                        $renew_price_unformatted = $whmcspricearray["domainrenew"][1];
                        $register_price = self::formatPrice($register_price_unformatted, $selected_currency_array);
                        $renew_price = self::formatPrice($renew_price_unformatted, $selected_currency_array);
                        $status = "available";
                    } elseif (!empty($premiumchannel)) {
                        //PREMIUM DOMAIN - DISPLAY AVAILABLE + PRICE
                        $registrarCurrency = $check["PROPERTY"]["CURRENCY"][$index];
                        $register_price_unformatted = $this->getPremiumRegistrationPrice(
                            $check["PROPERTY"]["PRICE"][$index],
                            $registrarCurrency
                        );
                        $renew_price_unformatted = $this->getPremiumRenewPrice(
                            $listitem["registrar"],
                            $class,
                            $registrarCurrency,
                            $item
                        );
                        $register_price = self::formatPrice(
                            $register_price_unformatted,
                            $selected_currency_array
                        );
                        //TODO: check what format price is doing; is the registrarCurrency still considered?
                        $renew_price = self::formatPrice($renew_price_unformatted, $selected_currency_array);
                        $premiumtype = (stripos($class, $premiumchannel) === false) ? $premiumchannel :"PREMIUM";
                        $status = "available";
                    } else {
                        //DOMAIN TAKEN
                        $status = "taken";
                    }
                    
                    //for security reasons, if one of the prices is not set, then display the domain as taken
                    if (empty($register_price) || empty($renew_price)) {
                        $status = "taken";
                        $register_price = $renew_price = "";
                    }

                    $response[] = array(
                        "id" => $item,
                        "checkover" => "api",
                        "registrar" => $listitem["registrar"],
                        "code" => $code,
                        "availability" => $availability,
                        "class" => $class,
                        "premiumchannel" => $premiumchannel,
                        "premiumtype" => $premiumtype,
                        "registerprice" => $register_price,
                        "renewprice" => $renew_price,
                        "registerprice_unformatted" => $register_price_unformatted,
                        "renewprice_unformatted" => $renew_price_unformatted,
                        "status" => $status,
                        "cart" => $_SESSION["cart"]
                    );
                }
            }
        }


        //for no_ispapi_domain_list (domains that we were not able to check via API)
        foreach ($no_ispapi_domain_list as &$item) {
            $price = array();
            $check = localAPI("domainwhois", array("domain"=>$item));

            if ($check["status"] == "available") {
                $code = "210";
                //get the price for this domain
                $whmcspricearray = self::getTLDprice(self::getDomainExtension($item), $this->currency);
                $register_price_unformatted = $whmcspricearray["domainregister"][1];
                $renew_price_unformatted = $whmcspricearray["domainrenew"][1];
                $register_price = self::formatPrice($register_price_unformatted, $selected_currency_array);
                $renew_price = self::formatPrice($renew_price_unformatted, $selected_currency_array);
                $status = "available";
            } else {
                $code = "211";
                $status = "taken";
            }

            //TODO move the below lines into function for reuse (see previous method)
            if (empty($register_price) || empty($renew_price)) {
                $status = "taken";
                $register_price = $renew_price = "";
            }

            $response[] = array(
                "id" => $item,
                "checkover" => "whois",
                "code" => $code,
                "availability" => $check["message"],
                "class" => "",
                "premiumchannel" => "",
                "premiumtype" => "",
                "registerprice" => $register_price,
                "renewprice" => $renew_price,
                "registerprice_unformatted" => $register_price_unformatted,
                "renewprice_unformatted" => $renew_price_unformatted,
                "status" => $status,
                "cart" => $_SESSION["cart"]
            );
        }

        //handle the displaying of the backorder button in the search response
        $response = $this->handleBackorderButton($response);

        //feedback for the template
        $searched_domain_object = array();
        foreach ($response as $item) {
            if ($item["id"] == $this->domain) {
                $searched_domain_object = $item;
                continue;
            }
        }
        if (isset($this->domain) && $this->domain == $searched_domain_object["id"]) {
            if ($searched_domain_object["status"] == "taken" && $searched_domain_object["backorder_available"] == 1) {
                $feedback = array_merge(array("f_type" => "backorder", "f_message" => $this->i18n->getText("backorder_available_feedback")), $searched_domain_object);
            } elseif ($searched_domain_object["status"] == "taken") {
                $feedback = array_merge(array("f_type" => "taken", "f_message" => $this->i18n->getText("domain_taken_feedback")), $searched_domain_object);
            } elseif ($searched_domain_object["status"] == "available") {
                $feedback = array_merge(array("f_type" => "available", "f_message" => $this->i18n->getText("domain_available_feedback")), $searched_domain_object);
            }
        }

        $response_array = array("data" => $response, "feedback" => $feedback);

        $this->response = json_encode($response_array);
    }

    /**
     * Add the backorder functionality when ISPAPI Backorder module installed.
     */
    private function handleBackorderButton($response)
    {
        if (!self::loadBackorderAPI()) {
            return $response;
        }
        $newresponse = array();

        //get all domains that have already been backordered by the user. If not logged in, array will be empty, this is perfect.
        $ownbackorders = backorder_api_call(array(
            "COMMAND" => "QueryBackorderList"
        ));

        //get the list of all TLDs available in the backorder module
        $backorder_tlds = self::getConfiguredBackorderExtensions($this->currency);
        $tlds = "." . implode("|.", $backorder_tlds);

        //iterate all responses and add the backorder information
        foreach ($response as $item) {
            $tmp = $item;
            $tmp["backorder_available"] = $tmp["backordered"] = 0;
            if ($item["code"]==211 && empty($item["premiumchannel"])) {
                //we are not supporting premium backorders, so we don't add them here.
                //in this case, backorder module is installed

                //check if pricing set for this TLD
                $tmp["backorder_available"] = (preg_match('/^([a-z0-9](\-*[a-z0-9])*)\\'.$tld_list.'$/i', $item["id"])) ? 1 : 0;

                //check if backorder set in the backorder module
                $tmp["backordered"] = (in_array($item["id"], $ownbackorders["PROPERTY"]["DOMAIN"])) ? 1 : 0;

                if ($tmp["backorder_available"]) {
                    $tmp["backorderprice"] = self::getBackorderPrice($item["id"], $this->currency);
                    //if no price set for the currency, then do not display the backorder
                    if (empty($tmp["backorderprice"])) {
                        $tmp["backorder_available"] = 0;
                    }
                }
            }
            $newresponse[] = $tmp;
        }

        return $newresponse;
    }

    /**
     * Returns the registration price for a given tld
     *
     * @param string $tld The domain extension
     * @param string $currency The currency
     * @return array An array with price for 1 to 10 years
     */
    private static function getTLDprice($tld, $currency)
    {
        $domainprices = array();

        //get the selected currency
        $selected_currency_array = self::getCurrencySettingsById($currency);

        $sql = "SELECT tdp.extension, tp.type, msetupfee year1, qsetupfee year2, ssetupfee year3, asetupfee year4, bsetupfee year5, monthly year6, quarterly year7, semiannually year8, annually year9, biennially year10
				FROM tbldomainpricing tdp, tblpricing tp
				WHERE tp.relid = tdp.id
				AND tp.tsetupfee = 0
				AND tp.currency = :currency
				AND tp.type IN ('domainregister', 'domainrenew')
				AND tdp.extension = :tdpext";
        $list = DCHelper::SQLCall($sql, array(":currency" => $currency, ":tdpext" => ".".$tld), "fetchall");

        foreach ($list as &$item) {
            if (!empty($item)) {
                for ($i = 1; $i <= 10; $i++) {
                    $key = "year" . $i;
                    if (($item[$key] > 0)) {
                        $domainprices[$item['type']][$i] = round($item[$key], 2);
                        //self::formatPrice($item['year'.$i], $selected_currency_array);
                    }
                }
            }
        }
        return $domainprices;
    }

    /**
     * Returns the backorder price for a domain
     *
     * @param string $domain The domain
     * @param string $currency The currency
     * @return string The backorder price well formatted in the selected currency
     */
    private static function getBackorderPrice($domain, $currency)
    {
        //get the selected currency
        $selected_currency_array = self::getCurrencySettingsById($currency);

        //get backorder price of the domain
        $price = DCHelper::SQLCall(
            "SELECT fullprice FROM backorder_pricing WHERE extension=:ext AND currency_id=:currencyid LIMIT 1",
            array(
                ":currencyid" => self::getDomainExtension($domain),
                ":ext" => $currency
            )
        );
        $backorderprice = isset($price) ? $price["fullprice"] : "";
        return self::formatPrice($backorderprice, $selected_currency_array);
    }

    /**
     * Returns the price for a premiumdomain registration.
     * NOTE: (Sometimes we are getting rounding problems (1 cent), not exactly the same price than with the standard lookup.)
     *
     * @param string $registrarprice The domain registration price asked by the registrar
     * @param string $registrarpriceCurrency The currency of this price
     * @return string The price well formatted
     */
    private function getPremiumRegistrationPrice($registrarprice, $registrarpriceCurrency)
    {
        return $this->convertPriceToSelectedCurrency($registrarprice, $registrarpriceCurrency);
    }

    /**
     * Adds the reseller markup to the given price
     *
     * @param string $price A price
     * @return string The markup'ed price
     */
    private static function addResellerMarkup($price)
    {
        return $price + ($price * Premium::markupForCost($price) / 100);
    }

    /**
     * Converts the price in the selected currency and add the markup.
     * Selected currency is taken from the session.
     *
     * @param string $price A price
     * @param string $currency A currency
     * @return string The price converted BUT NOT FORMATTED
     */
    private function convertPriceToSelectedCurrency($price, $currency)
    {
        //get the selected currency
        $selected_currency_array = self::getCurrencySettingsById($this->currency);
        $selected_currency_code = $selected_currency_array["code"];

        //check if the registrarpriceCurrency is available in WHMCS
        $domain_currency_array = self::getCurrencySettingsByCode($currency);

        if ($domain_currency_array) {
            //WE ARE ABLE TO CALCULATE THE PRICE
            $domain_currency_code = $domain_currency_array["code"];
            if ($selected_currency_code == $domain_currency_code) {
                return round(self::addResellerMarkup($price), 2);
            } else {
                if ($domain_currency_array["default"] == 1) {
                    //CONVERT THE PRICE IN THE SELECTED CURRENCY
                    $convertedprice = $price * $selected_currency_array["rate"];
                    return round(self::addResellerMarkup($convertedprice), 2);
                } else {
                    //FIRST CONVERT THE PRICE TO THE DEFAULT CURRENCY AND
                    //THEN CONVERT THE PRICE IN THE SELECTED CURRENCY

                    //get the price in the default currency
                    $price_default_currency = $price * ( 1 / $domain_currency_array["rate"] );

                    //get the price in the selected currency
                    $price_selected_currency = $price_default_currency * $selected_currency_array["rate"];

                    return round(self::addResellerMarkup($price_selected_currency), 2);
                }
            }
        }
        return "";
    }

    /**
     * Returns the price for a premiumdomain renewal.
     *
     * @param string $registrarprice The domain registration price asked by the registrar
     * @param string $registrarpriceCurrency The currency of this price
     * @return string The price well formatted
     */
    private function getPremiumRenewPrice($registrar, $class, $registrarPriceCurrency, $domain)
    {
        $registrarPriceCurrency = strtoupper($registrarPriceCurrency);

        //get the domain currency id
        $domain_currency_array = self::getCurrencySettingsByCode($registrarPriceCurrency);
        $domain_currency_id = $domain_currency_array["id"];

        //get domain extension
        $tld = self::getDomainExtension($domain);

        //here we are calling the getRenewPrice from the respective registar module
        $registrarRenewPrice = call_user_func(
            $registrar."_getRenewPrice",
            getregistrarconfigoptions($registrar),
            $class,
            $domain_currency_id,
            $tld
        );

        //the renew price has to be converted to the selected currency
        return $this->convertPriceToSelectedCurrency($registrarRenewPrice, $registrarPriceCurrency);
    }

    /**
     * Returns the formatted price (e.g. 10.00 -> $10.00 USD)
     *
     * @param integer $number The price
     * @param array $cur The currency array
     * @return string The formatted price with the right unit at the right place
     */
    private static function formatPrice($number, $cur)
    {
        //TODO: use whmcs build in number format (localAPI)
        //$number = round($number, 3, PHP_ROUND_HALF_UP);
        if (empty($number) || $number <= 0) {
            return "";
        }
        $format = $cur["format"];
        if ($format == 1) {
            $number = number_format($number, 2, '.', '');
        }
        if ($format == 2) {
            $number = number_format($number, 2, '.', ',');
        }
        if ($format == 3) {
            $number = number_format($number, 2, ',', '.');
        }
        if ($format == 4) {
            $number = preg_replace('/\.?0+$/', '', number_format($number, 2, '.', ','));
        }

        $price = $cur["prefix"].$number.$cur["suffix"];

        if (function_exists('mb_detect_encoding')) {
            if (mb_detect_encoding($price, 'UTF-8, ISO-8859-1') === 'UTF-8') {
                return $price;
            } else {
                return utf8_encode($price);
            }
        } else {
            return $price;
        }
    }

    /**
     * Returns an extended domain list with all the required information to do the checks
     *
     * @param list $domainlist the initial domain list (like: array(mydomain1.tld, mydomain2.tld, ...) )
     * @param list $registrars the list of registrars
     * @return list Returns the extended domain list with for each domains the extension, the registrar and if premium domains should be displayed or not.
     */
    private static function getExtendedDomainlist($domainlist, $registrars)
    {
        $whmcsdomainlist = array(
            "extension" => array(),
            "autoreg" => array()
        );
    
        //check if premium domains are activated in WHMCS
        $premium_settings = Setting::getValue('PremiumDomains');
        $premiumEnabled = ($premium_settings == 1);

        //get the configured domain lookup registrar
        $domainlookupregistrar = "";
        $reg_settings = Setting::getValue('domainLookupRegistrar');
        if (!is_null($premium_settings)) {
            $domainlookupregistrar = $reg_settings;
        }

        //create an array with extension and autoreg (autoreg = the configured registrar for this extension)
        $list = self::getConfiguredExtensionsInclRegistrar();
        $whmcsdomainlist["extension"] = array_keys($list);
        $whmcsdomainlist["autoreg"] = array_values($list);

        $extendeddomainlist = array();
        $ispapiobject = array();
        foreach ($domainlist as &$domain) {
            $tld = ".".self::getDomainExtension($domain);
            $index = array_search($tld, $whmcsdomainlist["extension"]);

            //set the proper registrar that should be used
            if (in_array($whmcsdomainlist["autoreg"][$index], $registrars)) {
                $reg = $whmcsdomainlist["autoreg"][$index];
            } else {
                //select the registrar which will be set to replace all the third party/empty(none) registrars.
                //this order is important
                if (in_array($domainlookupregistrar, $registrars)) {
                    $reg = $domainlookupregistrar;
                } elseif (in_array("ispapi", $registrars)) {
                    $reg = "ispapi";
                } elseif (in_array("hexonet", $registrars)) {
                    $reg = "hexonet";
                } else {
                    $reg = "whois";
                }
            }

            $extendeddomainlist[] = array(
                "domain"        =>  $domain,
                "extension"     =>  $whmcsdomainlist["extension"][$index],
                "autoreg"       =>  $reg, //!empty($whmcsdomainlist["autoreg"][$index]) ? $whmcsdomainlist["autoreg"][$index] : "none" ,
                "show_premium"  =>  ($whmcsdomainlist["autoreg"][$index] == $domainlookupregistrar && $premiumEnabled) ? 1 : 0
            );
        }

        //reorganize the information
        $newlist = array();
        foreach ($extendeddomainlist as &$item) {
            if ($item["show_premium"] == 0) {
                $item["autoreg"] = $item["autoreg"]."-nopremium";
            }
            if (!isset($newlist[$item["autoreg"]])) {
                $newlist[$item["autoreg"]]["domain"] = array();
                if (preg_match("/(.*)-nopremium$/", $item["autoreg"], $matches)) {
                    $newlist[$item["autoreg"]]["registrar"] = $matches[1];
                } else {
                    $newlist[$item["autoreg"]]["registrar"] = $item["autoreg"];
                }
                $newlist[$item["autoreg"]]["show_premium"] = $item["show_premium"];
            }
            $newlist[$item["autoreg"]]["domain"][] = $item["domain"];
        }

        return $newlist;
    }

    /**
     * Get all domains of the selected categories if they are configured in WHMCS
     * If not categorie selected, then returns all the categories.
     *
     * @return array An array with all TLDs of the selected categories.
     */
    private static function getTLDGroups($tldgroup)
    {
        //get all the tlds configured in WHMCS
        $tlds_configured_in_whmcs = self::getConfiguredExtensions(true);

        //if $this->tldgroup empty, it means no category selected, so return all the caterogies
        if (empty($tldgroup)) {
            $groups = self::getConfiguredCategories();
        } else {
            $groups = explode(',', $tldgroup);
        }

        $tlds = array();
        foreach ($groups as &$group) {
            $tlds_of_the_group = self::getConfiguredCategoryExtensions($group);
            //remove all tlds which are not configured in WHMCS
            foreach ($tlds_of_the_group as &$tld) {
                if (in_array($tld, $tlds_configured_in_whmcs)) {
                    $tlds[] = $tld;
                }
            }
        }
        return $tlds;
    }

    /**
     * Convert the domain name into both IDN and punycode and return the desired data by given property name
     *
     * @param string|array $domain The domain name or an array of domains
     * @param IspApiConnection object $ispapi The IspApiConnection object to send API Requests
     * @param string $key the property name to return data from
     * @return string|array convert result for the given property name
     */
    private static function convert($domain, $registrar, $key)
    {
        return DCHelper::APICall($registrar, array(
            "COMMAND" => "ConvertIDN",
            "DOMAIN" => $domain
        ));
        if (is_array($domain)) {
            return $r["PROPERTY"][$key];
        }
        return $r["PROPERTY"][$key][0];
    }

    /**
     * Convert the domain from IDN to Punycode (müller.com => xn--mller-kva.com)
     *
     * @param string|array $domain The domain name or an array of domains
     * @param IspApiConnection object $ispapi The IspApiConnection object to send API Requests
     * @return string|array Punycode of the domain name or array of Punycodes
     */
    private static function convertToPunycode($domain, $registrar)
    {
        return self::convert($domain, $registrar, "ACE");
    }

    /**
     * Convert the domain from Punycode to IDN (xn--mller-kva.com => müller.com)
     *
     * @param string|array $domain The domain name or an array of domains
     * @param IspApiConnection object $ispapi The IspApiConnection object to send API Requests
     * @return string|array IDN of the domain name or array of IDNs.
     */
    private static function convertToIDN($domain, $registrar)
    {
        return self::convert($domain, $registrar, "IDN");
    }

    /**
     * Helper to delete an element from an array.
     *
     * @param string $element The element to delete
     * @param array &$array The array
     */
    public static function deleteElement($element, &$array)
    {
        $index = array_search($element, $array);
        if ($index !== false) {
            unset($array[$index]);
        }
    }

    /**
     * Get the domain label. (e.g. testdomain.net => testdomain)
     *
     * @param string $domain The domain name
     * @return string The domain label
     */
    private static function getDomainLabel($domain)
    {
        $tmp = explode(".", $domain);
        return $tmp[0];
    }

    /**
     * Get the domain extension (e.g. testdomain.net => net)
     *
     * @param string $domain The domain name
     * @return string The domain extension (without ".")
     */
    private static function getDomainExtension($domain)
    {
        $tmp = explode(".", $domain, 2);
        return $tmp[1];
    }

    /**
     * Get the id list of configured search categories
     *
     * @return array id list of configured search categories
     */
    private static function getConfiguredCategories()
    {
        $r = DCHelper::SQLCall("SELECT id FROM ispapi_tblcategories", null, "fetchall");
        $categories = array();
        foreach ($r as &$row) {
            $categories[] = $row["id"];
        }
        return $categories;
    }

    /**
     * Get the configured Extension for the given search category
     *
     * @param int $categoryid id of the search category
     * @return array list of extensions
     */
    private static function getConfiguredCategoryExtensions($categoryid)
    {
        $r = DCHelper::SQLCall("SELECT tlds FROM ispapi_tblcategories WHERE id = :id LIMIT 1", array(":id" => $categoryid), "fetch");
        $extensions = array();
        if (isset($r["tlds"])) {
            $tlds = trim($r["tlds"]);
            $tlds = preg_replace("/\s\s+/", " ", $tlds);
            $extensions = explode(" ", $tlds);
        }
        return $extensions;
    }

    /**
     * Get the configured registrar for the extension of the given domain name
     *
     * @param string $domain domain name
     * @return string the registrar
     */
    private static function getRegistrarForDomain($domain)
    {
        return self::getRegistrarForDomainExtension(self::getDomainExtension($domain));
    }

    /**
     * Get the configured registrar for the given domain extension
     *
     * @param string $ext domain extension
     * @return string the registrar
     */
    private static function getRegistrarForDomainExtension($ext)
    {
        $r = DCHelper::SQLCall(
            "SELECT autoreg FROM tbldomainpricing where extension=:ext",
            array(
                ":ext" => ".".$ext
            )
        );
        return isset($r["autoreg"]) ? $r["autoreg"] : null;
    }

    /**
     * Get the currency id by given currency code
     *
     * @param string $code currency code
     * @return string currency id
     */
    private static function getCurrencyIDByCode($code)
    {
        $r = DCHelper::SQLCall(
            "SELECT id FROM tblcurrencies WHERE code=:code LIMIT 1",
            array(
                ":code" => $registrarpriceCurrency
            )
        );
        return isset($r["id"]) ? $r["id"] : null;
    }

    /**
     * Get list of price-configured domain extensions
     *
     * @param bool $removeLeadingDot flag to auto-remove the leading dot character in extension string
     * @return array list of configured extensions
     */
    private static function getConfiguredExtensions($removeLeadingDot = false)
    {
        $r = DCHelper::SQLCall("SELECT extension FROM tbldomainpricing", null, "fetchall");
        $extensions = array();
        foreach ($r as &$row) {
            $extensions[] = $removeLeadingDot ? substr($row["extension"], 1) : $row["extension"];
        }
        return $extensions;
    }

    /**
     * Get list of price-configured domain extensions mapped to the assigned registrar
     *
     * @return list list of extensions e.g. array(".com" => "ispapi", ....)
     */
    private static function getConfiguredExtensionsInclRegistrar()
    {
        $r = DCHelper::SQLCall("SELECT extension,autoreg FROM tbldomainpricing", null, "fetchall");
        $map = array();
        foreach ($r as $row) {
            $map[$row["extension"]] = $row["autoreg"];
        }
        return $map;
    }

    /**
     * Get lookup provider configuration value for given registrar and setting
     *
     * @param string $registrar the registrar
     * @param string $setting the setting
     * @return null|string returns null in case of an error otherwise the configuration value
     */
    private static function getLookupConfigurationValue($registrar, $setting)
    {
        $r = DCHelper::SQLCall(
            "SELECT value FROM tbldomain_lookup_configuration WHERE registrar = :registrar AND setting = :setting LIMIT 1",
            array(
                ":registrar" => $registrar,
                ":setting" => $setting
            )
        );
        return isset($r["value"]) ? $r["value"] : null;
    }

    /**
     * Get configuration value for given addon module and setting
     *
     * @param string $module the addon name
     * @param string $setting the setting
     * @return null|string returns null in case of an error otherwise the configuration value
     */
    private static function getAddOnConfigurationValue($module, $setting)
    {
        $r = DCHelper::SQLCall(
            "SELECT value FROM tbladdonmodules WHERE module=:module  AND setting=:setting LIMIT 1",
            array(
                ":module" => $module,
                ":setting" => $setting
            )
        );
        return isset($r["value"]) ? $r["value"] : null;
    }

    /**
     * Get all configuration settings for a currency specified by given currency id
     *
     * @param int $currencyid the currency id
     * @return null|array returns null in case of an error otherwise the configuration values
     */
    private static function getCurrencySettingsById($currencyid)
    {
        return DCHelper::SQLCall(
            "SELECT * FROM tblcurrencies WHERE id=:currencyid LIMIT 1",
            array(
                ":currencyid" => $currencyid
            )
        );
    }

    /**
     * Get all configuration settings for a currency specified by given currency code
     *
     * @param int $code the currency code
     * @return null|array returns null in case of an error otherwise the configuration values
     */
    private static function getCurrencySettingsByCode($code)
    {
        return DCHelper::SQLCall(
            "SELECT * FROM tblcurrencies WHERE code=:code LIMIT 1",
            array(
                ":code" => strtoupper($code)
            )
        );
    }

    /**
     * Get all price-configured backorderable domain extensions for given currency spefified by currency id
     *
     * @param int $currencyid the currency id
     * @return array the list of backorderable domain extensions
     */
    private static function getConfiguredBackorderExtensions($currencyid)
    {
        //TODO: column currency_id should be better named id to follow WHMCS standards
        //TODO: rename table backorder_pricing to have ispapi_ prefix
        $r = DCHelper::SQLCall(
            "SELECT extension FROM backorder_pricing WHERE currency_id=:currencyid",
            array(
                ":currencyid" => $currencyid
            ),
            "fetchall"
        );
        $extensions = array();
        foreach ($r as &$row) {
            $extensions[] = $row["extension"];
        }
        return $extensions;
    }

    /*
     * Send the JSON response back to the template
     */
    public function send()
    {
        die($this->response);
    }
}
