<?php

require_once(dirname(__FILE__)."/../../../init.php");
require_once(dirname(__FILE__)."/../../../includes/domainfunctions.php");
require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");

//include ISPAPI registrar module if installed
if(file_exists(dirname(__FILE__)."/../../../modules/registrars/ispapi/ispapi.php")){
	require_once(dirname(__FILE__)."/../../../modules/registrars/ispapi/ispapi.php");
}
//include ISPAPI backorder module if installed
if(file_exists(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php")){
	require_once dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php";
}

use WHMCS\Database\Capsule;
use WHMCS\Domains\Pricing\Premium;


//WORKARROUND: Get a list of all Hexonet registrar modules and include the registrar files
//For some users we need this hack. This is normally done in the ispapidomaincheck file.
//###########################################################################################
if(!isset($_SESSION["ispapi_registrar"]) || empty($_SESSION["ispapi_registrar"])){
	$result = select_query("tbldomainpricing","extension,autoreg");
	$modulelist = array();
	$registrar = array();
	while($data = mysql_fetch_array($result)){
		if(!empty($data["autoreg"])){
			if(!in_array($data["autoreg"], $modulelist)){
				array_push($modulelist, $data["autoreg"]);
			}
		}
	}
	foreach($modulelist as $file){
		require_once(dirname(__FILE__)."/../../../modules/registrars/".$file."/".$file.".php");
		if(function_exists($file.'_GetISPAPIModuleVersion')){
			array_push($registrar, $file);
		}
	}
	//for the domain.php file
	$_SESSION["ispapi_registrar"] = $registrar;
}
//###########################################################################################


/**
 * PHP Class for the WHMCS checkdomain feature
 *
 * @copyright  2018 1API GmbH
 */
class DomainCheck
{
	private $domain;
    private $tldgroup;
    private $action;
    private $registrar;
	private $response;

    /*
     *  Constructor
     *
     *  @param string $domain The searched domain
     *  @param string $tldgroup The searched tldgroup
     *  @param string $action The action
     *  @param array $registrar The configured registrar (can be more than one)
     */
    public function __construct($domain, $tldgroup, $action, $registrar){
    	$this->domain = $domain;
		$this->tldgroup = $tldgroup;
		$this->action = $action;
		$this->registrar = $registrar;
		$this->doDomainCheck();
    }

    /*
     * This function is called on each instantiation
     * Call the right method for an given action
     *
     * Allowed actions:
     *  - getList: returns the complete list of domains
     *  - if empty -> startDomainCheck
     */
    private function doDomainCheck(){
    	if(isset($this->action) && ($this->action == "getList")){
    		$this->getDomainList();
    	}else{
    		$this->startDomainCheck();
    	}
    	$this->send();
    }

    /*
     * Split the TLD list in 2 lists, the first one with the TLDs configured with HEXONET, the second one with all others.
     *
     * @return array an array with 2 keys
     * - ispapi
     * - no_ispapi
     */
    private function sortTLDs(){
    	$domains = array();
    	$domains["ispapi"] = array();
    	$domains["no_ispapi"] = array();

    	//For ISPAPI domains -> ispapi_domains
    	//For other domains -> no_ispapi_domains
    	$result = select_query("tbldomainpricing","extension,autoreg");
    	while ($data = mysql_fetch_array($result)) {
    		if(in_array($data["autoreg"], $this->registrar)){
    			array_push($domains["ispapi"], $data["extension"]);
    		}else{
    			array_push($domains["no_ispapi"], $data["extension"]);
    		}
    	}
    	return $domains;
    }

	/*
     * Helper to delete an element from an array.
     */
	public static function deleteElement($element, &$array){
	    $index = array_search($element, $array);
	    if($index !== false){
	        unset($array[$index]);
	    }
	}

	/*
     * Send an API command to the registrar and returns the response
     */
	private function sendAPICommand($registrar, $command){
		$registrarconfigoptions = getregistrarconfigoptions($registrar);
		$ispapi_config = ispapi_config($registrarconfigoptions);
		return ispapi_call($command, $ispapi_config);
	}

    /*
     * Returns a combination of all domains of the current group and all domains configured in WHMCS
     * If a domain isn't configured in WHMCS and is in the current group, this won't be displayed.
     * First our domains and then the others.
     */
    private function getDomainList(){

    	//delete HTTP:// if domain's starting with it
    	if (preg_match('/^http\:\/\//i', $this->domain)) {
    		$this->domain = substr($this->domain, 7);
    	}
    	//delete HTTPS:// if domain's starting with it
    	if (preg_match('/^https\:\/\//i', $this->domain)) {
    		$this->domain = substr($this->domain, 8);
    	}
    	//delete WWW. if domain's starting with it
    	if (preg_match('/^www[\.]/i', $this->domain)) {
    		$this->domain = substr($this->domain, 4);
    	}

    	$this->domain = strtolower($this->domain);

    	$_SESSION["domain"] = $this->domain;

    	$feedback = array();
    	$do_not_search = false;
    	$domainlist = array();

		$suggestiondomainlist = array();

    	$domains = $this->sortTLDs();
    	$tldgroups = $this->getTLDGroups();
    	$searched_label = $this->getDomainLabel($this->domain);
		$searched_tld = $this->getDomainExtension($this->domain);

		//SUGGESTIONS MODE
		if( $this->domainSuggestionModeActivated() ){

			//TODO: check for third level domains and skip them is needed? why?
			$command = array(
				"COMMAND" => "QueryDomainSuggestionList",
				"KEYWORD" => $searched_label,
				"ZONE" => $tldgroups,
				"SOURCE" => "ISPAPI-SUGGESTIONS",
			);
			//use the first ispapi registrar to query the suggestion list
			$suggestions = $this->sendAPICommand($this->registrar[0], $command);

			array_push($suggestiondomainlist, $suggestions['PROPERTY']['DOMAIN']);
			$domainlist = $suggestiondomainlist[0];

			#TODO: check if we need to add the TLDs which we are not supporting at hexonet to the list also...
		}
		//REGULAR MODE
		else{
			foreach($tldgroups as $tld){
				//add the domain in the list if the searched TLD isn't in the TLD group
				//If the searched TLD is in the TLD group, this will be put at the first place of the list later
				if($tld != $searched_tld){
					if( (in_array(".".$tld, $domains["ispapi"]) || in_array(".".$tld, $domains["no_ispapi"])) && !in_array($searched_label.".".$tld, $domainlist) ){
						array_push($domainlist, $searched_label.".".$tld);
					}
				}
			}
		}

		//check if the searched keyword contains an configured TLD
		//example: thebestshop -> thebest.shop should be at the top
		$result = select_query("tbldomainpricing","extension");
		while($data = mysql_fetch_array($result)){
			$tld = substr($data["extension"],1);
			if (preg_match('/'.$tld.'$/i', $searched_label)) {
				$tmp = explode($tld, $searched_label);
				$thedomain = $tmp[0].".".$tld;
				//add to the domain list if not empty
				if(!empty($tmp[0]))
					$domainlist = array_merge(array($thedomain), $domainlist);
			}
		}

		//THIS NEED TO BE REFACTORED. getDomainList AND getSortedDomainList needs to be merged together.
		//This is saving us 1 ajax call in the frontend.
		$this->getSortedDomainList();


		//add the domain at the top of the list even if he's not in the current group, but just when he's configured in WHMCS
		$result = select_query("tbldomainpricing","autoreg",array("extension"=>".".$searched_tld));
		$data = mysql_fetch_array($result);
		if(!empty($data)){
			DomainCheck::deleteElement($this->domain, $domainlist);
			array_unshift($domainlist, $this->domain);
		}else{
			//if $searched_tld not empty display the message
			if(!empty($searched_tld)){
				$feedback = array("type" => "error", "message" => "Extension .$searched_tld not supported !");
				$do_not_search = true;
			}
		}

		//if there is an issue with the search, do not start checking
		if($do_not_search){
			$domainlist = array();
		}

		$response_array = array("data" => $domainlist, "feedback" => $feedback);

		//save the list in the session for the premium domains. TODO check if still required...
		$_SESSION["domainlist"] = $domainlist;

    	$this->response = json_encode($response_array);
    }

    /*
     *  Returns a json response with the sorted domain list.
     *  ispapi domain list first, then no ispapi domain list
     *  Needed for the check order.
     *  Displaying of the list stay unchanged.
     */
    private function getSortedDomainList(){
    	$domains = $this->sortTLDs();
    	$ispapi_domain_list = array();
    	$no_ispapi_domain_list = array();

    	foreach($_SESSION["domainlist"] as $item){
    		$tld = $this->getDomainExtension($item);
    		if( in_array(".".$tld, $domains["ispapi"]) ){
    			array_push($ispapi_domain_list, $item);
    		}else{
    			array_push($no_ispapi_domain_list, $item);
    		}
    	}

    	$sortedDomainlist = array();
    	$sortedDomainlist = array_merge($ispapi_domain_list,$no_ispapi_domain_list);
    	$response_array = array("data" => $sortedDomainlist);

    	$this->response = json_encode($response_array);
    }

   /*
	* Returns TRUE if the "suggestion" mode is activated in the domainchecker configuration
	*/
	private function domainSuggestionModeActivated() {
		$result = select_query("ispapi_tblsettings", "*", array("id" => 1));
		$data = mysql_fetch_array($result);
		if(isset($data) && $data["suggestion_mode"] == 1){
			return true;
		}else{
			return false;
		}
	}

	/*
     * Start the domain check procedure.
     * Handle the check domain with the configured ispapi registrar account configured in WHMCS
     * return a JSON list of all domains with the availability
     */
    private function startDomainCheck(){
    	$feedback = array();
    	$domains = $this->sortTLDs();

    	// create 2 domain lists
    	// 1: domains that use our registrar module
    	// 2: domains that don't use our registrar module
    	$ispapi_domain_list = array();
    	$no_ispapi_domain_list = array();
    	foreach($this->domain as $item){
    		$tld = $this->getDomainExtension($item);
    		if( in_array(".".$tld, $domains["ispapi"]) ){
    			array_push($ispapi_domain_list, $item);
    		}else{
				//array_push($ispapi_domain_list, $item);
    			array_push($no_ispapi_domain_list, $item);
    		}
    	}

    	//for ispapi_domain_list (domains that use our registrar module)
    	$extendeddomainlist = $this->getExtendedDomainlist($ispapi_domain_list);

		//check if premium domains are activated in WHMCS
		$premiumEnabled = false;

		$pdo = Capsule::connection()->getPdo();
		$stmt = $pdo->prepare("select * from tblconfiguration where setting='PremiumDomains'");
		$stmt->execute();
		$premiumdomains = $stmt->fetch(PDO::FETCH_ASSOC);
		if($premiumdomains["value"] == 1){
			$premiumEnabled = true;
		}

    	$response = array();

    	foreach($extendeddomainlist as $listitem){
    		//IDN convert before sending to checkdomain
    		$converted_domains = $this->convertIDN($listitem["domain"], $listitem["registrar"]);

    		$command = array(
    				"COMMAND" => "checkDomains",
    				"PREMIUMCHANNELS" => "*",
    				"DOMAIN" => $converted_domains
    		);
			$check = $this->sendAPICommand($listitem["registrar"], $command);

    		$index = 0;
    		foreach($listitem["domain"] as $item){
    			$tmp = explode(" ", $check["PROPERTY"]["DOMAINCHECK"][$index]);
				$code = $tmp[0];
				$availability = $check["PROPERTY"]["DOMAINCHECK"][$index];
				$class = $check["PROPERTY"]["CLASS"][$index];
				$premiumchannel = $check["PROPERTY"]["PREMIUMCHANNEL"][$index];
				$status="";
				$premiumtype="";
				$register_price = "";
				$renew_price = "";

				if(preg_match('/549/', $check["PROPERTY"]["DOMAINCHECK"][$index])){
					//TLD NOT SUPPORTED AT HEXONET USE A FALLBACK TO THE WHOIS LOOKUP.
					//Add the domain to the $no_ispapi_domain_list so it will be automatically checked by the WHOIS LOOKUP in the next step.
					array_push($no_ispapi_domain_list, $item);
				}
				elseif(preg_match('/210/', $check["PROPERTY"]["DOMAINCHECK"][$index])){
					//DOMAIN AVAILABLE
					$whmcspricearray = $this->getTLDprice($this->getDomainExtension($item));
	    			$register_price = $whmcspricearray["domainregister"][1];
				 	$renew_price = $whmcspricearray["domainrenew"][1];

					$status = "available";
				}
				elseif(!empty($check["PROPERTY"]["PREMIUMCHANNEL"][$index])){ //IT IS A PREMIUMDOMAIN // || !empty($check["PROPERTY"]["CLASS"][$index])
					if($premiumEnabled){
						//IF PREMIUM DOMAIN ENABLED IN WHMCS - DISPLAY AVAILABLE + PRICE

						$registrarprice = $check["PROPERTY"]["PRICE"][$index];
						$registrarpriceCurrency = $check["PROPERTY"]["CURRENCY"][$index];

						$register_price = $this->getPremiumRegistrationPrice($registrarprice, $registrarpriceCurrency);
						$renew_price = $this->getPremiumRenewPrice($listitem["registrar"], $check["PROPERTY"]["CLASS"][$index], $registrarpriceCurrency, $item);


						if (strpos($check["PROPERTY"]["CLASS"][$index], $check["PROPERTY"]["PREMIUMCHANNEL"][$index]) !== false){
							$premiumtype = "PREMIUM";
						}else{
							$premiumtype = $check["PROPERTY"]["PREMIUMCHANNEL"][$index];
						}

						$status = "available";
					}else{
						//PREMIUM DOMAIN NOT ENABLED IN WHMCS -> DISPLAY THE DOMAIN AS TAKEN
						$status = "taken";
					}
				}
				else{
					//DOMAIN TAKEN
					$status = "taken";
				}

				//for security reasons, if one of the prices is not set, then display the domain as taken
				if(empty($register_price) || empty($renew_price)){
					$status = "taken";
					$register_price = "";
					$renew_price = "";
				}

    			array_push($response, array("id" => $item,
											"checkover" => "api",
											"code" => $code,
											"availability" => $availability,
											"class" => $class,
											"premiumchannel" => $premiumchannel,
											"premiumtype" => $premiumtype,
											"registerprice" => $register_price,
											"renewprice" => $renew_price,
											"status" => $status,
											"cart" => $_SESSION["cart"]));

    			$index++;
    		}
    	}

    	//for no_ispapi_domain_list (domains that don't use our registrar module)
    	foreach($no_ispapi_domain_list as $item){
    		$label = $this->getDomainLabel($item);
    		$tld = $this->getDomainExtension($item);
    		$price = array();

			$command = "domainwhois";
		    $values["domain"] = $label.".".$tld;

		    $check = localAPI($command,$values); 	//$check = "";//lookupDomain($label, ".".$tld);
    		if($check["status"] == "available"){
    			$code = "210";
	    		//get the price for this domain
				$whmcspricearray = $this->getTLDprice($this->getDomainExtension($item));
				$register_price = $whmcspricearray["domainregister"][1];
				$renew_price = $whmcspricearray["domainrenew"][1];
				$status = "available";
    		}else{
    			$code = "211";
				$status = "taken";
    		}

			if(empty($register_price) || empty($renew_price)){
				$status = "taken";
				$register_price = "";
				$renew_price = "";
			}

			array_push($response, array("id" => $item,
										"checkover" => "whois",
										"code" => $code,
										"availability" => $check["result"],
										"class" => "",
										"premiumchannel" => "",
										"premiumtype" => "",
										"registerprice" => $register_price,
										"renewprice" => $renew_price,
										"status" => $status,
										"cart" => $_SESSION["cart"]));


    	}

		//Handle the displaying of the backorder button in the search response TODO: rewrite that
		$response = $this->handleBackorderButton($response);

		// Feedback for the template
		$searched_domain_object = array();
		foreach($response as $item){
			if($item["id"] == $_SESSION["domain"]){
				$searched_domain_object = $item;
				continue;
			}
		}
		if(isset($_SESSION["domain"]) && $_SESSION["domain"] == $searched_domain_object["id"]){
			if($searched_domain_object["status"] == "taken" && $searched_domain_object["backorder_available"] == 1 && $searched_domain_object["backordered"] == 0 ){
				$feedback = array("type" => "backorder", "message" => "Backorder Available!");
			}
			elseif($searched_domain_object["status"] == "taken"){
				$feedback = array("type" => "taken", "message" => "Domain already taken!");
			}
			elseif($searched_domain_object["status"] == "available"){
				$feedback = array("type" => "available", "message" => "Your domain is available!");
			}
		}
    	$response_array = array("data" => $response, "feedback" => $feedback);


    	$this->response = json_encode($response_array);
    }

	/*
     * Add the backorder functionality ẃhen module installed.
     */
	private function handleBackorderButton($response){
		//Check if backorder module is installed
		$backorder_mod_installed = (file_exists(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php")) ? true : false;
		if(!$backorder_mod_installed)
			return $response;

		$newresponse = array();

		//Get all domains that have already been backordered by the user. If not logged in, array will be empty, this is perfect.
		$queryBackorderList = array(
				"COMMAND" => "QueryBackorderList"
		);
		$ownbackorders = backorder_api_call($queryBackorderList);

		//Get the list of all TLDs available in the backorder module
		$tlds = "";
		$result = select_query('backorder_pricing','extension',array("currency_id" => $_SESSION["currency"] ));
		while ($data = mysql_fetch_array($result)) {
			$tlds .= "|.".$data["extension"];
		}
		$tld_list = substr($tlds, 1);

		//Iterate all responses and add the backorder information
		foreach($response as $item){
			$tmp = $item;
			$tmp["backorder_available"] = $tmp["backordered"] = 0;
			if($item["code"]==211){
				//In this case, backorder module is installed so, set to 1
				//$tmp["backorder_installed"] = 1;
				//Check if pricing set for this TLD
				$tmp["backorder_available"] = (preg_match('/^([a-z0-9](\-*[a-z0-9])*)\\'.$tld_list.'$/i', $item["id"])) ? 1 : 0;
				//Check if backorder set in the backorder module
				$tmp["backordered"] = (in_array($item["id"], $ownbackorders["PROPERTY"]["DOMAIN"])) ? 1 : 0;

				//TODO ANTHONY rewrite this section
				if($tmp["backorder_available"]){
					$tmp["backorderprice"] = $this->getBackorderprice($item["id"]);
				}

			}
			$newresponse[] = $tmp;
		}

		return $newresponse;
	}

    /*
     * Returns the price for a given tld for registration
     *
     * @param string $tld The domain extension
     * @return array An array with price for 1 to 10 years
     *
     */
	private function getTLDprice($tld) {
		$result = select_query("tblcurrencies","*",array("id" => $_SESSION["currency"]),"","","1");
		$cur = mysql_fetch_array($result);

		$sql = "SELECT tdp.extension, tp.type, msetupfee year1, qsetupfee year2, ssetupfee year3, asetupfee year4, bsetupfee year5, monthly year6, quarterly year7, semiannually year8, annually year9, biennially year10
				FROM tbldomainpricing tdp, tblpricing tp
				WHERE tp.relid = tdp.id
				AND tp.tsetupfee = 0
				AND tp.currency = ".$cur["id"]."
				AND tp.type IN ('domainregister', 'domainrenew')
				AND tdp.extension = '.".mysql_real_escape_string($tld)."'
				";

		$result = mysql_query($sql);
		$domainprices = array();
		while ($data = mysql_fetch_array($result)) {
			if(!empty($data)){
				for ( $i = 1; $i <= 10; $i++ ) {
					if (($data['year'.$i] > 0)){
						$domainprices[$data['type']][$i] = $this->formatPrice($data['year'.$i],$cur);
					}
				}
			}
		}
		return $domainprices;
	}

	private function getBackorderprice($domain) {
		$result = select_query("tblcurrencies","*",array("id" => $_SESSION["currency"]),"","","1");
		$cur = mysql_fetch_array($result);
		return $this->formatPrice(100,$cur);
	}

	/*
     * Returns the price for a premiumdomain registration.
     *
     * @param string $registrarprice The domain registration price asked by the registrar
     * @param string $registrarpriceCurrency The currency of this price
     * @return string The price well formatted
	 *
	 * TODO: Sometimes we are getting rounding problems (1 cent), not exactly the same price than with the standard lookup.
     * TODO: check if markup is done at the beginning or at the end in the standard lookup
	 *
     */
	private function getPremiumRegistrationPrice($registrarprice, $registrarpriceCurrency) {
		return $this->convertPriceToSelectedCurrency($registrarprice, $registrarpriceCurrency);
	}


	/*
	 * Convert the price in the selected currency and add the markup.
	 * Selected currency is taken from the session.
	 */
	private function convertPriceToSelectedCurrency($price, $currency) {
		//get the markup from the WHMCS backend and add it to the registrar price
		$markupToAdd = Premium::markupForCost($price, $currency);
		$markupedprice = $price + ($price * $markupToAdd / 100);

		//get the selected currency
		$result = select_query("tblcurrencies","*",array("id" => $_SESSION["currency"]),"","","1");
		$selected_currency_array = mysql_fetch_array($result);
		$selected_currency_code = $selected_currency_array["code"];

		//check if the registrarpriceCurrency is available in WHMCS
		$result = select_query("tblcurrencies","*",array("code" => strtoupper($currency)),"","","1");
		$domain_currency_array = mysql_fetch_array($result);

		if($domain_currency_array){
			//WE ARE ABLE TO CALCULATE THE PRICE
			$domain_currency_code = $domain_currency_array["code"];
			if($selected_currency_code == $domain_currency_code){
				return $this->formatPrice($markupedprice, $selected_currency_array);
			}else{
				if($domain_currency_array["default"] == 1){
					//CONVERT THE PRICE IN THE SELECTED CURRENCY
					$convertedprice = $markupedprice * $selected_currency_array["rate"];
					return $this->formatPrice($convertedprice, $selected_currency_array);
				}else{
					//FIRST CONVERT THE PRICE TO THE DEFAULT CURRENCY AND THEN CONVERT THE PRICE IN THE SELECTED CURRENCY

					//get the default currency set in WHMCS
					$result = select_query("tblcurrencies", "*", array("default" => "1","","","1"));
					$default_currency_array = mysql_fetch_array($result);
					$default_currency_code = $default_currency_array["code"];

					//get the price in the default currency
					$price_default_currency = $markupedprice * ( 1 / $domain_currency_array["rate"] );

					//get the price in the selected currency
					$price_selected_currency = $price_default_currency * $selected_currency_array["rate"];

					return $this->formatPrice($price_selected_currency, $selected_currency_array);
				}
			}
		}
		return "";
	}




	/*
     * Returns the price for a premiumdomain renewal. (This function adds the markup)
     *
     * @param string $registrarprice The domain registration price asked by the registrar
     * @param string $registrarpriceCurrency The currency of this price
     * @return string The price well formatted
	 *
     */
	private function getPremiumRenewPrice($registrar, $class, $registrarPriceCurrency, $domain) {
		$registrarPriceCurrency = strtoupper($registrarPriceCurrency);

		//get the domain currency id
		$result = select_query("tblcurrencies","*",array("code" => $registrarPriceCurrency),"","","1");
		$domain_currency_array = mysql_fetch_array($result);
		$domain_currency_id = $domain_currency_array["id"];

		//get domain extension
		$tld = $this->getDomainExtension($domain);

		//here we reuse the code from the registrar module
		$params = getregistrarconfigoptions($registrar);

		//echo "$class $domain_currency_id $tld";
		// print_r($params);
		$registrarRenewPrice = ispapi_getRenewPrice($params, $class, $domain_currency_id, $tld);
		//echo "<".$registrarRenewPrice.">";

		//the renew price has to be converted to the selected currency
		return $this->convertPriceToSelectedCurrency($registrarRenewPrice, $registrarPriceCurrency);
	}



	/*
	 * Returns the formated price
	 * (10.00 -> $10.00 USD)
	 *
	 * @param integer $number The price
	 * @param array $cur The currency array
	 *
	 * @return string The formated price with the right unit at the right place
	 *
	 */
	private function formatPrice($number, $cur) {
		//$number = round($number, 3, PHP_ROUND_HALF_UP);
		//mail("anthonys@hexonet.net", "formatprice2", $number );

		if ($number <= 0){
			return "";
		}
		$format = $cur["format"];
		if ( $format == 1 ) {
			$number = number_format($number, 2, '.', '');
		}
		if ( $format == 2 ) {
			$number = number_format($number, 2, '.', ',');
		}
		if ( $format == 3 ) {
			$number = number_format($number, 2, ',', '.');
		}
		if ( $format == 4 ) {
			$number = preg_replace('/\.?0+$/', '', number_format($number, 2, '.', ','));
		}

		$price = $cur["prefix"].$number.$cur["suffix"];

		if (function_exists('mb_detect_encoding')) {
			if(mb_detect_encoding($price, 'UTF-8, ISO-8859-1') === 'UTF-8'){
				return $price;
			}else{
				return utf8_encode($price);
			}
		}else{
			return $price;
		}
	}

    /*
     *  Returns an extended domain list
     *
     *  @param list $domainlist the initial domain list (like: array(mydomain1.tld, mydomain2.tld, ...) )
     *  @return list Returns the extended domain list with for each domains the extension, the registrar and the ispapi connection object to handle further api calls.
     */
    private function getExtendedDomainlist($domainlist){
    	$whmcsdomainlist = array();
    	$whmcsdomainlist["extension"] = array();
    	$whmcsdomainlist["autoreg"] = array();

    	//create an array with extension and autoreg (autoreg = the configured resgistrar for this extension)
    	$result = select_query("tbldomainpricing","extension,autoreg");
    	while ($data = mysql_fetch_array($result)) {
    		if(!empty($data["autoreg"])){
    			array_push($whmcsdomainlist["extension"], $data["extension"]);
    			array_push($whmcsdomainlist["autoreg"],$data["autoreg"]);
    		}
    	}

		$extendeddomainlist = array();
		$ispapiobject = array();

    	foreach($domainlist as $domain){
    		$tld = ".".$this->getDomainExtension($domain);
    		$index = array_search($tld, $whmcsdomainlist["extension"]);
    		array_push($extendeddomainlist, array("domain"=>$domain,
    											   "extension" => $whmcsdomainlist["extension"][$index],
    											   "autoreg" => $whmcsdomainlist["autoreg"][$index]));
    	}

    	//reorganize the information
    	$newlist = array();
    	foreach($extendeddomainlist as $item){
    		if(!isset($newlist[$item["autoreg"]])){
    			$newlist[$item["autoreg"]]["domain"] = array();
    			$newlist[$item["autoreg"]]["registrar"] = $item["autoreg"];
    		}
    		array_push($newlist[$item["autoreg"]]["domain"], $item["domain"]);
    	}

    	return $newlist;
    }

    /*
     * Get all domains of a TLD group
     *
     * @return array An array with all TLDs of the current group.
     */
	 private function getTLDGroups(){
		$this->tldgroup = explode(',', $this->tldgroup);
		$data["tlds"] = [];
		$data2 = [];
		$pdo = Capsule::connection()->getPdo();
		foreach ($this->tldgroup as $key => $id) {
			$stmt = $pdo->prepare("SELECT id, name, tlds FROM ispapi_tblcategories WHERE id=?");
			$stmt->execute(array($id));
			$result = $stmt->fetch(PDO::FETCH_ASSOC);
			array_push($data2, $result["tlds"]);
		}
		$data3 = [];
		foreach ($data2 as $key => $value) {
			array_push($data3, explode(' ', $value));
		}
		foreach ($data3 as $key => $value) {
			foreach ($value as $ky => $tld) {
				if(in_array($tld, $data["tlds"])){

				}else{
					array_push($data["tlds"], $tld);
				}
			}
		}

		if(isset($data["tlds"])){
			return $data["tlds"];
		}else{
			array();
		}
	}

    /*
     * Convert the domain into an IDN code
     *
     * @param string|array $domain The domain name or an array of domains
     * @param IspApiConnection object $ispapi The IspApiConnection object to send API Requests
     * @return string|array IDN code of the domain name or array of IDN codes (saarbrücken.de => xn--saarbrcken-feb.de )
     */
    private function convertIDN($domain, $registrar){
		$command = array(
				"COMMAND" => "convertIDN",
				"DOMAIN" => $domain
		);
		$response = $this->sendAPICommand($registrar, $command);

		if(!is_array($domain)){
	    	return $response["PROPERTY"]["ACE"][0];
		}else{
			return $response["PROPERTY"]["ACE"];
		}
    }

    /*
     * Get the domain label.
     * (testdomain.net => testdomain)
     *
     * @param string $domain The domain name
     * @return string The domain label
     */
    private function getDomainLabel($domain){
    	$tmp = explode(".", $domain);
    	return $tmp[0];
    }

    /*
     * Get the domain extension
     * (testdomain.net => net)
     *
     * @param string $domain The domain name
     * @return string The domain extension (without ".")
     */
    private function getDomainExtension($domain){
    	$tmp = explode(".", $domain, 2);
    	return $tmp[1];
    }

    /*
     * Send the JSON response back to the template
     */
    public function send(){
		echo $this->response;
		die();
    }
}


$action = (isset($_REQUEST["action"])) ? $_REQUEST["action"] : "";


//Currency session will be send on the first ajax call
if(isset($_REQUEST["currency"])){
	$_SESSION["currency"] = $_REQUEST["currency"];

	//if customer logged in, check the configured currency.
	$ca = new WHMCS_ClientArea();
	$ca->initPage();
	if ($ca->isLoggedIn()) {
		$result = mysql_query("SELECT currency FROM tblclients WHERE id=".$ca->getUserID());
		$data = mysql_fetch_array($result);
		$_SESSION["currency"] = $data["currency"];
		$_SESSION["userid"] = $ca->getUserID();
	}
}

//Instanciate .the DomainCheck class and send the request
$domaincheck = new DomainCheck( $_REQUEST["domain"],
								$_REQUEST["tldgroup"],
								$action,
								$_SESSION["ispapi_registrar"]);
$domaincheck->send();

?>
