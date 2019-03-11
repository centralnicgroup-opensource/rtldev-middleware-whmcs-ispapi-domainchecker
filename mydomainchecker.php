<?php
// Handle "Transfer" button from the WHMCS default Homepage
if (isset($_POST["transfer"])) {
    header("Location: cart.php?a=add&domain=transfer&query=".$_POST["domain"]);
}

define("CLIENTAREA", true);
use ISPAPI\Helper;

// Find the correct path of the init.php file, based on the way we are integrating the module (via symlinks or copy/paste), the path is different.
$root_path = $_SERVER["DOCUMENT_ROOT"];
$script_path = preg_replace("/.modules.addons..+$/", "", dirname($_SERVER["SCRIPT_NAME"]));
if (!empty($script_path)) {
    $root_path .= $script_path;
}
$init_path = implode(DIRECTORY_SEPARATOR, array($root_path,"init.php"));
if (file_exists($init_path)) {
    require_once($init_path);
} else {
    exit("cannot find init.php");
}
$helperclass_path = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapidomaincheck","lib","Helper.class.php"));
require_once($helperclass_path);


$ca = new WHMCS_ClientArea();
$ca->setPageTitle($_LANG["domaintitle"]);
$ca->addToBreadCrumb('index.php', $whmcs->get_lang('globalsystemname'));
$ca->addToBreadCrumb('mydomainchecker.php', $_LANG["domaintitle"]);
$ca->initPage();

// Include module file
$modulepath = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapidomaincheck","ispapidomaincheck.php"));
if (!file_exists($modulepath)) {
    exit($modulepath. " not found");
}
require $modulepath;

// Get module variables
$modulevars = array();
foreach (Helper::SQLCall("SELECT * FROM tbladdonmodules WHERE module = 'ispapidomaincheck'", array(), "fetchall") as $var) {
    $modulevars[$var["setting"]] = $var["value"];
}

// Call clientarea function
$results = call_user_func("ispapidomaincheck_clientarea", $modulevars);
if (is_array($results["vars"])) {
    foreach ($results["vars"] as $k => $v) {
        $smartyvalues[$k] = $v;
    }
}

$ca->setTemplate("/modules/addons/ispapidomaincheck/ispapidomaincheck.tpl");
$ca->output();
