<?php
define("CLIENTAREA", true);
require("init.php");

use WHMCS\Database\Capsule;

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

try{
	$pdo = Capsule::connection()->getPdo();
	$stmt = $pdo->prepare("SELECT * FROM tbladdonmodules WHERE module=?");
	$stmt->execute(array($module));
	$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
	foreach ($data as $key => $value) {
		$modulevars[$value["setting"]] = $value["value"];
	}
	$results = call_user_func( $module . "_clientarea", $modulevars );

} catch (Exception $e) {
	die($e->getMessage());
}

$templatefile = "/modules/addons/" . $module . "/" . $results["templatefile"] . ".tpl";

if (is_array( $results["vars"] )) {
	foreach ($results["vars"] as $k => $v) {
		$smartyvalues[$k] = $v;
	}
}

$ca->setTemplate($templatefile);
$ca->output();
?>
