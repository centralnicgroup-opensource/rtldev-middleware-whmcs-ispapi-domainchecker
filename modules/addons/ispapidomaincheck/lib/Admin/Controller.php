<?php

namespace WHMCS\Module\Addon\ispapidomaincheck\Admin;

use WHMCS\Module\Addon\ispapidomaincheck\DCHelper;

/**
 * Admin Area Controller
 */
class Controller
{

    /**
     * Index action.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return string page content
     */
    public function index($vars, $smarty)
    {
        $smarty->assign("modulelink", $vars['modulelink']);
        //get all categories with tlds for displaying
        $categories = DCHelper::SQLCall("SELECT * FROM ispapi_tblcategories", null, "fetchall");
        foreach ($categories as &$cat) {
            $cat["tlds"] = explode(" ", preg_replace("/\s\s+/", " ", trim($cat["tlds"])));
        }
        $smarty->assign("categories", $categories);
        return $smarty->fetch('index.tpl');
    }

    /**
     * action savetakendomains.
     * save configuration value for setting `ispapiDomaincheckTakenDomain`
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function savetakendomains($vars, $smary)
    {
        $key = "ispapiDomaincheckTakenDomains";
        $val = $_REQUEST['takenDomains'];
        return DCHelper::saveSetting($key, $val);
    }

    /**
     * action savepremiumdomains.
     * save configuration value for setting `PremiumDomains`
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function savepremiumdomains($vars, $smary)
    {
        $key = "PremiumDomains";
        $val = $_REQUEST['premiumDomains'];
        return DCHelper::saveSetting($key, $val);
    }

    /**
     * action savedefaultcategories.
     * save configuration value for setting `ispapiDomaincheckDefaultCategories`
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function savedefaultcategories($vars, $smarty)
    {
        $key = "ispapiDomaincheckDefaultCategories";
        $val = implode(",", $_REQUEST['categories']);
        return DCHelper::saveSetting($key, $val);
    }

    /**
     * action loadconfiguration.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @param array [$data] possibility to provide DCHelper::loadfullcurrencydata() response to avoid multiple loads
     * @return array operation result in error case otherwise configuration object
     */
    public function loadconfiguration($vars, $smarty, $data = null)
    {
        //load default categories using GetCurrencies / GetTLDPricing;
        if (!$data) {
            $data = DCHelper::loadfullcurrencydata();
            if (!$data) {
                return array("success" => false, "msg" => "Failed to load configuration.");
            }
        }

        // collect current configuration data
        // and build list of tlds in use by this configuration
        $categories = DCHelper::SQLCall("Select * from ispapi_tblcategories ORDER BY name ASC", null, "fetchall");

        $alltldsinuse = array();
        $defcats = array();
        foreach ($categories as &$cat) {
            $cat["tlds"] = trim($cat["tlds"]);
            if (empty($cat["tlds"])) {
                $cat["tlds"] = array();
            } else {
                $cat["tlds"] = explode(" ", preg_replace("/\s\s+/", " ", $cat["tlds"]));
            }
            $cat["id"] = (int)$cat["id"];//for php5
            $defcats[] = $cat["id"];
            $alltldsinuse = array_merge($alltldsinuse, $cat["tlds"]);
        }
        $alltldsinuse = array_values(array_unique($alltldsinuse));

        // build list of tlds configured in WHMCS (so available for use)
        $alltlds = array();
        foreach ($data as $d) {
            $alltlds = array_merge($alltlds, array_keys($d["pricing"]));
        }
        $alltlds = array_values(array_unique($alltlds));

        // build list of tlds configured in WHMCS, but not in use by the configuration
        $tldsnotassigned = array_values(array_diff($alltlds, $alltldsinuse));

        // default active categories
        $setting = \WHMCS\Config\Setting::getValue("ispapiDomaincheckDefaultCategories");
        if ($setting != null && trim($setting) != "") {
            $defcats = explode(",", $setting);
            foreach ($defcats as &$cat) {
                $cat = (int)$cat;
            }
        }

        //build response format
        return array(
            //all configured tlds
            "alltlds" => $alltlds,
            //not-assigned tlds
            "notassignedtlds" => array_values(array_diff($alltlds, $alltldsinuse)),
            //load categories + tlds + prices
            "categories" => $categories,
            //lookup registrar
            "lookupRegistrar" => \WHMCS\Config\Setting::getValue('domainLookupRegistrar'),
            //check if suggestion engine is active or not
            "suggestionsOn" => (DCHelper::getDomaincheckerMode() == "on") ? 1 : 0,
            //default active Categories
            "defaultActiveCategories" => $defcats,
            //premium domains availability
            "premiumDomains" => (int)\WHMCS\Config\Setting::getValue('PremiumDomains'),
            //taken domains availability
            "takenDomains" => (int)\WHMCS\Config\Setting::getValue('ispapiDomaincheckTakenDomains')
        );
    }

    /**
     * action addcategory.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function addcategory($vars, $smarty)
    {
        if (isset($_REQUEST["category"])) {
            DCHelper::SQLCall(
                "INSERT INTO ispapi_tblcategories ({{KEYS}}) VALUES ({{VALUES}})",
                array(
                    ":name" => $_REQUEST["category"],
                    ":tlds" => isset($_REQUEST["tlds"]) ? implode(" ", $_REQUEST["tlds"]) : ""
                ),
                "execute"
            );
            $cat = DCHelper::SQLCall("SELECT * FROM ispapi_tblcategories ORDER BY id DESC LIMIT 1", null, "fetch");
            if (!empty($cat)) {
                $cat["tlds"] = trim($cat["tlds"]);
                if (empty($cat["tlds"])) {
                    $cat["tlds"] = array();
                } else {
                    $cat["tlds"] = explode(" ", preg_replace("/\s\s+/", " ", $cat["tlds"]));
                }
                return array("success" => true, "msg" => "Category added.", "category" => $cat);
            }
        }
        return array("success" => false, "msg" => "Adding Category failed.");
    }

    /**
     * action updatecategory.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function updatecategory($vars, $smarty)
    {
        if (isset($_REQUEST["category"])) {
            DCHelper::SQLCall("UPDATE ispapi_tblcategories set tlds=:tlds WHERE id=:id", array(
                ":id" => (int)$_REQUEST["category"],
                ":tlds" => isset($_REQUEST["tlds"]) ? implode(" ", $_REQUEST["tlds"]) : ""//jquery removes empty arrays
            ), "execute");
            return array("success" => true, "msg" => "Category update processed.");
        }
        return array("success" => false, "msg" => "Category update failed.");
    }

    /**
     * action deletecategory.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result
     */
    public function deletecategory($vars, $smarty)
    {
        if (isset($_REQUEST["category"])) {
            DCHelper::SQLCall(
                "DELETE FROM ispapi_tblcategories WHERE id=:id",
                array(
                    ":id" => $_REQUEST["category"]
                ),
                "execute"
            );
            return array("success" => true, "msg" => "Category deletion processed.");
        }
        return array("success" => false, "msg" => "Category deletion failed.");
    }

    /**
     * action importdefaults.
     *
     * @param array $vars Module configuration parameters
     * @param Smarty $smarty smarty instance
     * @return array operation result or configuration object
     */
    public function importdefaults($vars, $smarty)
    {
        //load default categories using GetCurrencies / GetTLDPricing;
        $data = DCHelper::loadfullcurrencydata();
        if (!$data) {
            return array("success" => false, "msg" => "Failed to load configuration.");
        }

        //import default categories
        $categories = array();
        foreach ($data as $d) {
            foreach ($d["pricing"] as $tld => $row) {
                foreach ($row["categories"] as $cat) {
                    if (!isset($categories[$cat])) {
                        $categories[$cat] = array();
                    }
                    if (!in_array($tld, $categories[$cat])) {
                        $categories[$cat][] = $tld;
                    }
                }
            }
        }
        ksort($categories);
        DCHelper::SQLCall("DELETE FROM ispapi_tblcategories", null, "execute");
        DCHelper::SQLCall("ALTER TABLE ispapi_tblcategories AUTO_INCREMENT = 1", null, "execute");
        foreach ($categories as $category => &$tlds) {
            DCHelper::SQLCall(
                "INSERT INTO ispapi_tblcategories ({{KEYS}}) VALUES ({{VALUES}})",
                array(
                    ":name" => $category,
                    ":tlds" => implode(" ", $tlds)
                ),
                "execute"
            );
        }
        return $this->loadconfiguration($vars, $smarty, $data);
    }
}
