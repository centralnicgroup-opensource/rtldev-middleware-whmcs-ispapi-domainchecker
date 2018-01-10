<?php

require_once(dirname(__FILE__)."/../../../init.php");

require_once(dirname(__FILE__)."/../../../includes/domainfunctions.php");
require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");


switch ($_REQUEST["action"]) {



	case "addPremiumDomainToCart":

	// echo"<pre>"; print_r($_REQUEST); echo "</pre>";
	if(!is_array($_SESSION["cart"]["domains"])){
		$_SESSION["cart"]["domains"] = array();
	}

	if(isset($_REQUEST["domain"])){
		$premiumdomain = array( "type" => "register",
								"domain" => $_REQUEST["domain"],
								"regperiod" => "1",
								"isPremium" => "1",
								"domainpriceoverride" => $_REQUEST['registerprice'],
								"registrarCostPrice" => $_REQUEST['registerprice'],
								"registrarCurrency" => 1,
								"domainrenewoverride" =>  $_REQUEST['renewalprice'],
								"registrarRenewalCostPrice" => $_REQUEST['renewalprice']
							);
	}

	// echo"<pre>"; print_r($premiumdomain); echo "</pre>";

	array_push($_SESSION["cart"]["domains"], $premiumdomain);

	break;


	case "removeFromCart":
		if(isset($_REQUEST["domain"])){
			foreach ($_SESSION["cart"]["domains"] as $key => $value) {
				if(in_array($_REQUEST["domain"], $value)){
					 unset($_SESSION["cart"]["domains"][$key]);
				}
				else{
				}
			}
		}

    default:
    	break;
}

?>
