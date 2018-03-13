<?php
use ISPAPI\LoadRegistrars;
use ISPAPI\Helper;
use ISPAPI\DomainCheck;
use ISPAPI\i18n;

require_once(dirname(__FILE__)."/../../../init.php");
require_once(dirname(__FILE__)."/../../../includes/domainfunctions.php");
require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");

require_once(dirname(__FILE__)."/lib/DomainCheck.class.php");
require_once(dirname(__FILE__)."/lib/LoadRegistrars.class.php");
require_once(dirname(__FILE__)."/lib/Helper.class.php");
require_once(dirname(__FILE__)."/lib/i18n.class.php");

//include ISPAPI backorder module if existing
$backorder_module = dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php";
if(file_exists($backorder_module)){
	require_once $backorder_module;
}

/*
 * Returns the selected currency
 */
function getSelectedCurrency(){
	//first take the currency from the URL or from the session
	$currency = isset($_REQUEST["currency"]) ? $_REQUEST["currency"] : $_SESSION["currency"];

	//if customer logged in, set the configured currency.
	$ca = new WHMCS_ClientArea();
	if ($ca->isLoggedIn()) {
		$user = Helper::SQLCall("SELECT currency FROM tblclients WHERE id=?", array($ca->getUserID()));
		$currency = $user["currency"];
	}

	//not logged in, no currency in the URL and no currency in the SESSION
	if(empty($currency)){
		$default = Helper::SQLCall("SELECT id FROM tblcurrencies WHERE `default`=1", array());
		$currency = $default["id"];
	}
	return $currency;
}

//load all the ISPAPI registrars
$_SESSION["ispapi_registrar"] = (new LoadRegistrars)->getLoadedRegistars();

//take the action from the URL
$action = isset($_REQUEST["action"]) ? $_REQUEST["action"] : "";

//get the selected currency
$currency = getSelectedCurrency();

$domains = (isset($_REQUEST["domains"])) ? $_REQUEST["domains"] : "";

//instantiate the DomainCheck class and send the request
$domaincheck = new DomainCheck( $_REQUEST["domain"],
								$domains,
								$_REQUEST["tldgroup"],
								$action,
								$_SESSION["ispapi_registrar"],
								$currency);
$domaincheck->send();

?>
