<?php
// Handle "Transfer" button from the WHMCS default Homepage
if (!empty($_POST["transfer"])) {
    header("Location: cart.php?a=add&domain=transfer&query=".$_POST["domain"]);
    exit();
}

define("CLIENTAREA", true);
use ISPAPI\DCHelper;

// Find the correct path of the init.php file, based on the way we are integrating the module
// (via symlinks or copy/paste), the path is different.
require "init.php";
//require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__), "modules", "addons", "ispapidomaincheck", "init.inc.php")));

// load DCHelper class
$path = implode(DIRECTORY_SEPARATOR, array(ROOTDIR, "modules", "addons", "ispapidomaincheck", "lib", "Common", "DCHelper.class.php"));
if (!file_exists($path)) {
    exit('Missing dependency `ISPAPI Registrar Module`. Please download and install it from <a href="https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip">github</a>.');
}
require_once($path);

$ca = new WHMCS_ClientArea();
$ca->setPageTitle(Lang::trans("domaintitle"));
$ca->addToBreadCrumb('index.php', Lang::trans('globalsystemname'));
$ca->addToBreadCrumb('mydomainchecker.php', Lang::trans("domaintitle"));
$ca->initPage();

// Include module file
$modulepath = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapidomaincheck","ispapidomaincheck.php"));
if (!file_exists($modulepath)) {
    exit($modulepath. " not found");
}
require $modulepath;

// Call clientarea function
$modulevars = DCHelper::getAddOnConfigurationValue('ispapidomaincheck');
$language = (isset($_SESSION["Language"]) ? $_SESSION["Language"] : "english");
$langpath = ROOTDIR . DIRECTORY_SEPARATOR . "modules" . DIRECTORY_SEPARATOR . "addons" . DIRECTORY_SEPARATOR . "ispapidomaincheck" . DIRECTORY_SEPARATOR . "lang" . DIRECTORY_SEPARATOR;
$file = $langpath . $language . ".php";
if (file_exists($file)) {
    include($file);
} else {
    include($langpath . "english.php");
}
$modulevars["_lang"] =  $_ADDONLANG;
$results = call_user_func(
    "ispapidomaincheck_clientarea",
    $modulevars
);

if (is_array($results["vars"])) {
    foreach ($results["vars"] as $k => $v) {
        $smartyvalues[$k] = $v;
    }
}
$tplpath = implode(DIRECTORY_SEPARATOR, array("", "modules", "addons", "ispapidomaincheck", "lib", "Client", "templates", ""));
$ca->setTemplate($tplpath . ($smartyvalues["error"] ? "error" : "index") . ".tpl");
$ca->output();
