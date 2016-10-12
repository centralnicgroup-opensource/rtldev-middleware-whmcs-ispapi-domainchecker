<?php
define("CLIENTAREA", true);
require("init.php");
$ca = new WHMCS_ClientArea();
$pagetitle = $_LANG["domaintitle"];
$ca->setPageTitle($pagetitle);
$ca->addToBreadCrumb('index.php', $whmcs->get_lang('globalsystemname'));
$ca->addToBreadCrumb('mydomainchecker.php', $pagetitle);
$ca->initPage();

$module = "ispapidomaincheck";
$modulepath = ROOTDIR . "/modules/addons/" . $module . "/" . $module . ".php";

if (!file_exists( $modulepath )) {
	exit($modulepath. " not found");
}
require $modulepath;

$modulevars = array();
$result = select_query( "tbladdonmodules", "", array( "module" => $module ) );
while ($data = mysql_fetch_array( $result )) {
	$modulevars[$data["setting"]] = $data["value"];
}
$results = call_user_func( $module . "_clientarea", $modulevars );

$templatefile = "/modules/addons/" . $module . "/" . $results["templatefile"] . ".tpl";

if (is_array( $results["vars"] )) {
	foreach ($results["vars"] as $k => $v) {
		$smartyvalues[$k] = $v;
	}
}

$ca->setTemplate($templatefile);
$ca->output();
?>