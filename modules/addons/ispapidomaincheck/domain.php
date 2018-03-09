<?php
use ISPAPI\LoadRegistrars;
use ISPAPI\Helper;
use ISPAPI\DomainCheck;

require_once(dirname(__FILE__)."/../../../init.php");
require_once(dirname(__FILE__)."/../../../includes/domainfunctions.php");
require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");

require_once(dirname(__FILE__)."/lib/DomainCheck.class.php");
require_once(dirname(__FILE__)."/lib/LoadRegistrars.class.php");
require_once(dirname(__FILE__)."/lib/Helper.class.php");

//include ISPAPI backorder module if existing
$backorder_module = dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php";
if(file_exists($backorder_module)){
	require_once $backorder_module;
}

//load all the ISPAPI registrars
$_SESSION["ispapi_registrar"] = (new LoadRegistrars)->getLoadedRegistars();

//take the action from the URL
$action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : "";

//take the currency from the URL or the session
$currency = isset($_REQUEST["currency"]) ? $_REQUEST["currency"] : $_SESSION["currency"];

//if customer logged in, set the configured currency.
$ca = new WHMCS_ClientArea();
if ($ca->isLoggedIn()) {
	$user = Helper::SQLCall("SELECT currency FROM tblclients WHERE id=?", array($ca->getUserID()));
	$currency = $user["currency"];
}

$domains = (isset($_REQUEST["domains"])) ? $_REQUEST["domains"] : "";

//add the module language file if existing
$module_language_file = dirname(__FILE__)."/lang/".$_SESSION["Language"].".php";
if(file_exists($module_language_file)){
	require($module_language_file);
	// $_LANG is now available
}

//Instanciate .the DomainCheck class and send the request
$domaincheck = new DomainCheck( $_REQUEST["domain"],
								$domains,
								$_REQUEST["tldgroup"],
								$action,
								$_SESSION["ispapi_registrar"],
								$currency,
								$_LANG);
$domaincheck->send();

?>
