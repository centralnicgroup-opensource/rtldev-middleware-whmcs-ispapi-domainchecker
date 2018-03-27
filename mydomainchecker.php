<?php
define("CLIENTAREA", true);
use ISPAPI\Helper;

require_once(dirname(__FILE__)."/init.php");
require_once(dirname(__FILE__)."/modules/addons/ispapidomaincheck/lib/Helper.class.php");

$ca = new WHMCS_ClientArea();
$ca->setPageTitle($_LANG["domaintitle"]);
$ca->addToBreadCrumb('index.php', $whmcs->get_lang('globalsystemname'));
$ca->addToBreadCrumb('mydomainchecker.php', $_LANG["domaintitle"]);
$ca->initPage();

//include module file
$modulepath = ROOTDIR . "/modules/addons/ispapidomaincheck/ispapidomaincheck.php";
if (!file_exists( $modulepath )) {
	exit($modulepath. " not found");
}
require $modulepath;

//get module variables
$modulevars = array();
foreach (Helper::SQLCall("SELECT * FROM tbladdonmodules WHERE module = 'ispapidomaincheck'", array(), "fetchall") as $var) {
	$modulevars[$var["setting"]] = $var["value"];
}

//call clientarea function
$results = call_user_func("ispapidomaincheck_clientarea", $modulevars);
if (is_array( $results["vars"] )) {
	foreach ($results["vars"] as $k => $v) {
		$smartyvalues[$k] = $v;
	}
}

$ca->setTemplate("/modules/addons/ispapidomaincheck/ispapidomaincheck.tpl");
$ca->output();
?>
