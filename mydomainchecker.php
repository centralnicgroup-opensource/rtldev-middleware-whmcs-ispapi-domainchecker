<?php

use WHMCS\Module\Addon\ispapidomaincheck\DCHelper;

error_reporting(E_ALL);
ini_set("display_errors", 1);

// Handle "Transfer" button from the WHMCS default Homepage
if (!empty($_POST["transfer"])) {
    header("Location: cart.php?a=add&domain=transfer&query=" . $_POST["domain"]);
    exit();
}

global $perf;

define("CLIENTAREA", true);

$perf = [
    "script" => [
        "start" => microtime(true),
    ]
];

// Find the correct path of the init.php file, based on the way we are integrating the module
// (via symlinks or copy/paste), the path is different.
$perf["init.php"] = ["start" => microtime(true)];
$isXHR = (
    isset($_REQUEST["action"])
    || (
        isset($_REQUEST["nodata"])
        && $_REQUEST["nodata"] == 1
    )
);
require "init.php";

$perf["init.php"]["end"] = microtime(true);
$perf["init.php"]["rt"] = $perf["init.php"]["end"] - $perf["init.php"]["start"];

// load DCHelper class
require_once(implode(DIRECTORY_SEPARATOR, [ROOTDIR, "modules", "addons", "ispapidomaincheck", "lib", "Common", "DCHelper.class.php"]));

// Include module file
$modulepath = implode(DIRECTORY_SEPARATOR, [ROOTDIR,"modules","addons","ispapidomaincheck","ispapidomaincheck.php"]);
if (!file_exists($modulepath)) {
    exit($modulepath . " not found");
}
require $modulepath;

// Call clientarea function
$modulevars = DCHelper::getAddOnConfigurationValue('ispapidomaincheck');
$language = (isset($_SESSION["Language"]) ? $_SESSION["Language"] : "english");
$langpath = implode(DIRECTORY_SEPARATOR, [ROOTDIR, "modules", "addons", "ispapidomaincheck", "lang", ""]);
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

//respond XHR Requests in JSON
if ($isXHR) {
    header('Cache-Control: no-cache, must-revalidate'); // HTTP/1.1
    header('Expires: Mon, 26 Jul 1997 05:00:00 GMT'); // Date in the past
    header('Content-type: application/json; charset=utf-8');
    echo $results;
    exit();
}

$ca = new WHMCS_ClientArea();
$ca->setPageTitle(Lang::trans("domaintitle"));
$ca->addToBreadCrumb('index.php', Lang::trans('globalsystemname'));
$ca->addToBreadCrumb('mydomainchecker.php', Lang::trans("domaintitle"));
$ca->initPage();
if (is_array($results["vars"])) {
    foreach ($results["vars"] as $k => $v) {
        $smartyvalues[$k] = $v;
    }
}
$tplpath = implode(DIRECTORY_SEPARATOR, ["", "modules", "addons", "ispapidomaincheck", "lib", "Client", "templates", ""]);
$ca->setTemplate($tplpath . ($smartyvalues["error"] ? "error" : "index") . ".tpl");
$ca->output();
