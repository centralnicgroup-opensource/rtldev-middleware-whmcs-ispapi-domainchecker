<?php
//require_once(dirname(__FILE__)."/FirePHP.class.php");
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

//WORKARROUND: Get a list of all Hexonet registrar modules and include the registrar files
//For some users we need this hack. This is normally done in the ispapidomaincheck file.
//###########################################################################################
if(!isset($_SESSION["ispapi_registrar"]) || empty($_SESSION["ispapi_registrar"])){
	$result = select_query("tbldomainpricing","extension,autoreg");
	$modulelist = array();
	$registrar = array();
	while($data = mysql_fetch_array($result)){
		echo "<pre>domain.php ==> "; print_r($data); echo "</pre>";
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

//DEBUGGING TOOL
//$f = FirePHP::getInstance(true);
//$f->fb("debug");


/**
 * PHP Class for the WHMCS checkdomain feature
 *
 * @copyright  2014 1API GmbH
 * @license
 * @version    1.0
 */
class DomainCheck
{

	private $domain;
    private $tldgroup;
    private $action;
    private $registrar;
	private $cached_data;
	private $response;


    /*
     *  Constructor
     *
     *  @param string $domain The searched domain
     *  @param string $tldgroup The searched tldgroup
     *  @param string $action The action
     *  @param array $registrar The configured registrar (can be more than one)
     *  @param int $cached_data if 1 returns the cached data
     */
    public function __construct($domain, $tldgroup, $action, $registrar, $cached_data, $adminuser){
    	$this->domain = $domain;
		$this->tldgroup = $tldgroup;
		$this->action = $action;
		$this->registrar = $registrar;
		$this->cached_data = $cached_data;
		$this->adminuser = $adminuser;

		$this->doDomainCheck();
    }

    /*
     * This function is called on each instantiation
     * Call the right method for an given action
     *
     * Allowed actions:
     *  - getList: returns the complete list of domains
     *  - getSuggestions: returns a list of premium suggestions.
     *  - if empty -> startDomainCheck
     */
    private function doDomainCheck(){
    	if(isset($this->action) && ($this->action == "getList")){
    		$this->getDomainList();
    	}elseif(isset($this->action) && ($this->action == "getSortedList")){
    		$this->getSortedDomainList();
    	}elseif(isset($this->action) && ($this->action == "getSuggestions")){
    		$this->getPremiumDomainSuggestions();
    	}else{
    		$this->startDomainCheck();
    	}
    	$this->send();
    }

    /*
     * Split the tld list to start with our extensions first
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
     * Returns a combination of all domains of the current group and all domains configured in WHMCS
     * If a domain isn't configured in WHMCS and is in the current group, this won't be displayed.
     * First our domains and then the others.
     */
    private function getDomainList(){

    	//if session lost after a few minutes, display a message:  Session expired, please reload page!
    	/*if(empty($_SESSION["ispapi_registrar"])){
    		$response_array = array("data" => "", "feedback" => array("status" => false, "message" => "An error occurred!<br><span style='font-size:12px'>Session lost, please reload the page.</span>"));
    		$this->response = json_encode($response_array);
    		return;
    	}*/

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

    	//if the data has been cached, return cached data
    	$cache = $this->getCache("list");
    	if(!empty($cache)){
    		$this->response = json_encode($cache);
    		$_SESSION["domainlist"] = $cache["data"];
    		return;
    	}

    	$feedback = array();
    	$do_not_search = false;
    	$domainlist = array();


    	$domains = $this->sortTLDs();
		// print_r($domains);
    	$tldgroups = $this->getTLDGroups();
		// print_r($tldgroups);

    	$searched_label = $this->getDomainLabel($this->domain);
    	$searched_tld = $this->getDomainExtension($this->domain);

    	foreach($tldgroups as $tld){
    		//add the domain in the list if the searched TLD isn't in the TLD group
    		//If the searched TLD is in the TLD group, this will be put at the first place of the list later
    		if($tld != $searched_tld){
    			if( (in_array(".".$tld, $domains["ispapi"]) || in_array(".".$tld, $domains["no_ispapi"])) && !in_array($searched_label.".".$tld, $domainlist) ){
    				array_push($domainlist, $searched_label.".".$tld);
    			}
    		}
    	}

    	//if searched domain contains " " -> show message
    	if (preg_match('/\s/',$this->domain) || strlen($searched_label) > 63){
    		$feedback = array("status" => false, "message" => "The domain you entered is not valid !");
    		$do_not_search = true;
    	}else{

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

    		//add the domain at the top of the list even if he's not in the current group, but just when he's configured in WHMCS
    		$result = select_query("tbldomainpricing","autoreg",array("extension"=>".".$searched_tld));
    		$data = mysql_fetch_array($result);
    		if(!empty($data)){
    			if(!in_array($this->domain, $domainlist))
    				$domainlist = array_merge(array($this->domain), $domainlist);
    		}else{
    			//if $searched_tld not empty display the message
    			if(!empty($searched_tld)){
    				$feedback = array("status" => false, "message" => "Sorry, the extension <b>.$searched_tld</b> is not supported !");
    			}
   			}
   		}

    	//if error -> delete de list
    	if($do_not_search){
    		$domainlist = array();
    	}


		$response_array = array("data" => $domainlist, "feedback" => $feedback);
		//save the list in the session for the premium domains.
		$_SESSION["domainlist"] = $domainlist;

		//Save the data in the cache
		$this->setCache($response_array, "list");

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
     *  Returns the converted price well formated
     *
     *  @param int $price The price in USD (always USD in this case)
     *  @param int $curencyid The DB id of the selected currency
     */
    private function getConvertedPrice($price, $currencyid){

		//load the selected currency
		$selected_currency = mysql_fetch_array(select_query("tblcurrencies","*",array("id" => $currencyid),"","","1"));

		//check if the default currency is USD in WHMCS
    	$default_currency = mysql_fetch_array(select_query("tblcurrencies","*",array("default" => 1 ),"","","1"));
		if(preg_match("/^USD$/i", $default_currency["code"])){
			//default currency in WHMCS is USD
			$p = round($price * $selected_currency["rate"], 2);
		}else{
			//default currency in WHMCS in not USD, use the rate from domainchecker
			if(preg_match("/^USD$/i", $selected_currency["code"])){
				//if selected currency is USD => display the price directly
				$p = round($price, 2);
			}else{
				$modulecur = mysql_fetch_array(select_query("ispapi_tblaftermarketcurrencies","*",array("currency" => $selected_currency["code"]),"","","1"));
				if(!empty($modulecur) && $modulecur["rate"] != 0){
					//use the rate from domainchecker to convert the price in another currency
					$p = round($price * $modulecur["rate"], 2);
				}else{
					//no currency rate configured in the domainchecker => display no pricing found
					$p = -1;
				}
			}
		}
		$p = $this->formatPrice($p, $selected_currency);
    	return $p;
    }

    /*
     * Returns TRUE if aftermarket premiums have to be displayed
     */
    private function showAftermarketPremium(){
    	$result = select_query("ispapi_tblsettings", "*", array("id" => 1));
    	$data = mysql_fetch_array($result);

    	if(isset($data) && $data["aftermarket_premium"] == 1){
    		return true;
    	}else{
    		return false;
    	}
    }

    /*
     * Get a list of premium domain suggestions
     */
    private function getPremiumDomainSuggestions(){
    	if(!isset($_SESSION["domainlist"]))
    		return;

    	$domainlist = array();
    	$feedback = array();
    	$response = array();

    	$domains = $this->sortTLDs();

    	//for ispapi_domain_list (domains that use our registrar module)
    	$extendeddomainlist = $this->getExtendedDomainlist($domains["ispapi"]);

    	$limit = count($_SESSION["domainlist"]);

    	//get all ispapi extension
    	$all_premium_extension = array();
    	foreach($domains["ispapi"] as $domain){
    		array_push($all_premium_extension, substr($domain, 1));
    	}

    	foreach($extendeddomainlist as $list){
    		$command = array(
    				"COMMAND" => "QueryDomainSuggestionList",
    				"KEYWORD" => $this->convertIDN($this->domain, $list["registrar"]),
    				"LIMIT" => $limit,
    				"SOURCE" => "CP_PREMIUM",
    				"ZONE" => $all_premium_extension
    		);

    		$registrarconfigoptions = getregistrarconfigoptions($list["registrar"]);
    		$ispapi_config = ispapi_config($registrarconfigoptions);
    		$suggestionList = ispapi_call($command, $ispapi_config);

    		if($suggestionList["CODE"]=="200"){
    			if(isset($suggestionList["PROPERTY"]["DOMAIN"])){
    				$i = 0;
    				foreach($suggestionList["PROPERTY"]["DOMAIN"] as $domain){

    					$price = $this->getConvertedPrice($suggestionList["PROPERTY"]["PRICE"][$i], $_SESSION["currency"]);

    					$domainprices["domainregister"][1] = $price;
    					array_push($response, array("id" => $domain, "price" => $domainprices, "class" => "PREMIUM_NAMEMEDIA"));
    					$i++;
    				}
    			}
    		}
    		//just one time for the first ispapi registrar
    		break;
    	}


    	$response_array = array("data" => $response, "feedback" => "");

    	$this->response = json_encode($response_array);
    }

    /*
     * Start the domain check procedure.
     * Handle the check domain with the configured ispapi registrar account configured in WHMCS
     * return a JSON list of all domains with the availability
     */
	 function ispapi_getRegistryPremiumDomainRenewalPrice($priceclass){

		$date = new DateTime();
		if((!isset($_SESSION["ISPAPICACHE"])) || ($_SESSION["ISPAPICACHE"]["TIMESTAMP"] + 600 < $date->getTimestamp() )){

			$command["COMMAND"] = "StatusUser";

			$registrarconfigoptions = getregistrarconfigoptions($_SESSION['ispapi_registrar'][0]);
			$ispapi_config = ispapi_config($registrarconfigoptions);
			$response = ispapi_call($command, $ispapi_config);

			if ($response["CODE"] == 200) {
				$_SESSION["ISPAPICACHE"] = array("TIMESTAMP" => $date->getTimestamp() , "RELATIONS" => $response["PROPERTY"]);

				foreach($_SESSION["ISPAPICACHE"]["RELATIONS"] as $key => $relationtype) {
					foreach ($relationtype as $ky => $relation) {
						if($relation == "PRICE_CLASS_DOMAIN_".$priceclass."_ANNUAL"){
							$renewalprice = $_SESSION["ISPAPICACHE"]["RELATIONS"]["RELATIONVALUE"][$ky];
						}else{
						}
					}
				}
				return $renewalprice;
			}else{
				return false;
			}
		}else{
			// mail("tseelamkurthi@hexonet.net", "relationtypes", print_r($_SESSION["ISPAPICACHE"]["RELATIONS"], true));
			foreach($_SESSION["ISPAPICACHE"]["RELATIONS"] as $key => $relationtype) {
				foreach ($relationtype as $ky => $relation) {
					if($relation == "PRICE_CLASS_DOMAIN_".$priceclass."_ANNUAL"){
						$renewalprice = $_SESSION["ISPAPICACHE"]["RELATIONS"]["RELATIONVALUE"][$ky];
					}else{
					}
				}
			}
			return $renewalprice;
		}
	}

    private function startDomainCheck(){


    	//return the cached data only if $this->cached_data = 1
    	if($this->cached_data){
    		$cache = $this->getCache("response");
    		if(!empty($cache["data"])){
    			//call handleBackorderButton to get the cache updated for backorder related informations
				$cache["data"] = $this->handleBackorderButton($cache["data"]);
				$this->response = json_encode($cache);
    			return;
    		}
    	}

    	$showAftermarketPremium = $this->showAftermarketPremium();

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

    	$showpremium = false;

		$result = mysql_query("SELECT * FROM ispapi_tblsettings LIMIT 1");
    	$data = mysql_fetch_array($result);
    	if(isset($data) && $data["registry_premium"] == 0 && $data["aftermarket_premium"] == 1 ){
    		$premiumchannels = "NAMEMEDIA";
    	}elseif(isset($data) && $data["registry_premium"] == 1 ){
    		$premiumchannels = "*";
    	}else{
    		$premiumchannels = "";
    	}

    	$response = array();
    	foreach($extendeddomainlist as $item){
    		//IDN convert before sending to checkdomain
    		$converted_domains = $this->convertIDN($item["domain"], $item["registrar"]);

			// echo "<pre>"; print_r($converted_domains); echo "</pre>";


    		$command = array(
    				"COMMAND" => "checkDomains",
    				"PREMIUMCHANNELS" => $premiumchannels,
    				"DOMAIN" => $converted_domains
    		);

    		$registrarconfigoptions = getregistrarconfigoptions($item["registrar"]);
    		$ispapi_config = ispapi_config($registrarconfigoptions);
    		$check = ispapi_call($command, $ispapi_config);

			// echo "<pre> check ----> "; print_r($check); echo "<----- </pre>";

    		$index = 0;
    		foreach($item["domain"] as $item){

				// echo "<pre> item ----> "; print_r($item); echo "<----- </pre>";

    			$tmp = explode(" ", $check["PROPERTY"]["DOMAINCHECK"][$index]);

				// echo "<pre> tmp ----> "; print_r($tmp); echo "<----- </pre>";

    			$price = array();
    			if($tmp[0] == "210"){
    				//get the price for this domain
    				$tld = $this->getDomainExtension($item);

    				$price = $this->getTLDprice($tld);

    			}else{

    				if($check["PROPERTY"]["PREMIUMCHANNEL"][$index] == "NAMEMEDIA" && $showAftermarketPremium){
    						//get the NAMEMEDIA price
    						$p = $this->getConvertedPrice($check["PROPERTY"]["PRICE"][$index], $_SESSION["currency"]);
    						$price["domainregister"][1] = $p;
    						//override class
    						$check["PROPERTY"]["CLASS"][$index] = "PREMIUM_NAMEMEDIA";
					}else{

						if(isset($check["PROPERTY"]["CLASS"][$index]) && !empty($check["PROPERTY"]["CLASS"][$index])) {
							//get the premium price
							$result = select_query("tblcurrencies","*",array("id" => $_SESSION["currency"]),"","","1");
							$cur = mysql_fetch_array($result);

							$command = array(
									"COMMAND" => "checkDomains",
									"DOMAIN0" => $item,
									"PREMIUMCHANNELS" => $premiumchannels
							);

							$premiumdomainprice = ispapi_call($command, $ispapi_config);

							if(isset($premiumdomainprice["PROPERTY"]["PRICE"]) && !empty($premiumdomainprice["PROPERTY"]["PRICE"])){
								$renewalprice = $this->ispapi_getRegistryPremiumDomainRenewalPrice($check["PROPERTY"]["CLASS"][$index]);

								$pricet = $premiumdomainprice["PROPERTY"]["PRICE"][0];
								if((!empty($pricet)) && ($pricet != 0) && ($pricet != -1)){
									$pricet = $this->formatPrice($pricet, $cur);
									$renewalprice = $this->formatPrice($renewalprice, $cur);
								}else{
									$renewalprice = -1;
									$pricet = -1;
								}
								$price["domainregister"][1] = $pricet;
								$price["domainrenew"][1] = $renewalprice;

							}
							// else{
							// 	$price = $this->getPremiumClassPrice($check["PROPERTY"]["CLASS"][$index], $item);
							// }
						}
					}
    			}
				//if no price configured or price = 0 display as taken...
    			if($price["domainregister"][1] == -1){
    				$price = "";
    			}

    			array_push($response, array("id" => $item, "checkover" => "api", "availability" => $check["PROPERTY"]["DOMAINCHECK"][$index], "code" => $tmp[0], "class" => $check["PROPERTY"]["CLASS"][$index], "premiumchannel" => $check["PROPERTY"]["PREMIUMCHANNEL"][$index], "price" => $price, "cart" => $_SESSION["cart"]));

    			// Feedback for the template
    			if(isset($_SESSION["domain"]) && $_SESSION["domain"]==$item){
    				if(preg_match('/210/',$check["PROPERTY"]["DOMAINCHECK"][$index])){
    					$feedback = array("status" => true, "message" => "Congratulations! <b>$item</b> is available!");
    				}elseif(preg_match('/211 Premium/',$check["PROPERTY"]["DOMAINCHECK"][$index]) && !empty($price)){
    					$feedback = array("status" => true, "message" => "Congratulations! <b>$item</b> is available for registration as a premium-domain!");
    				}elseif(preg_match('/541/',$check["PROPERTY"]["DOMAINCHECK"][$index])){
    					$feedback = array("status" => false, "message" => "Sorry! <b>$item</b> is an invalid domain name!");
    				}elseif(preg_match('/549/',$check["PROPERTY"]["DOMAINCHECK"][$index])){
    					$feedback = array("status" => false, "message" => "Sorry! <b>$item</b> is not supported!");
    				}else{
    					if($check["PROPERTY"]["PREMIUMCHANNEL"][$index] == "NAMEMEDIA" && $showAftermarketPremium){
    						$feedback = array("status" => true, "message" => "Congratulations! <b>$item</b> is available for registration as a premium-domain!");
    					}else{
    						$feedback = array("status" => false, "message" => "Sorry! <b>$item</b> is already taken!");
    					}
    				}
    			}

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

		    $check = localAPI($command,$values, $this->adminuser); 	//$check = "";//lookupDomain($label, ".".$tld);
    		if($check["status"] == "available"){
    			$code = "210";
	    		//get the price for this domain
	    		$tld = $this->getDomainExtension($item);
	    		$price = $this->getTLDprice($tld);
    		}else{
    			$code = "211";
    		}
    		array_push($response, array("id" => $item, "checkover" => "whois", "availability" => $check["result"], "code" => $code, "class" => "", "premiumchannel" => "", "price" => $price));
    	}

		//Handle the displaying of the backorder button in the search response
		$response = $this->handleBackorderButton($response);
		//Handle backorder feedback
		// $backorder_feedback = "";
		// if(isset($_SESSION["domain"])){
		// 	foreach($response as $item){
		// 		if($_SESSION["domain"]==$item["id"] && $item["backorder_available"] && $item["backordered"] == 0 ){
		// 			$backorder_feedback = "<p><b>You can backorder this domain name.</b></p>";
		// 		}
		// 		if($_SESSION["domain"]==$item["id"] && $item["backorder_available"] && $item["backordered"] == 1 ){
		// 			$backorder_feedback = "<p><b>You backordered this domain name.</b></p>";
		// 		}
		// 	}
		// }
		// if(!empty($backorder_feedback)){
		// 	$feedback["message"] .= " ".$backorder_feedback;
		// }

    	$response_array = array("data" => $response, "feedback" => $feedback);

		//Save the data in the cache
    	$this->setCache($response_array, "response");

    	$this->response = json_encode($response_array);
    }

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
			$tmp["backorder_installed"] = $tmp["backorder_available"] = $tmp["backordered"] = 0;
			if($item["code"]==211){
				//In this case, backorder module is installed so, set to 1
				$tmp["backorder_installed"] = 1;
				//Check if pricing set for this TLD
				$tmp["backorder_available"] = (preg_match('/^([a-z0-9](\-*[a-z0-9])*)\\'.$tld_list.'$/i', $item["id"])) ? 1 : 0;
				//Check if backorder set in the backorder module
				$tmp["backordered"] = (in_array($item["id"], $ownbackorders["PROPERTY"]["DOMAIN"])) ? 1 : 0;
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
						//$domainprices[$data['extension']][$data['type']][$i] = $this->formatPrice($data['year'.$i],$cur);
						$domainprices[$data['type']][$i] = $this->formatPrice($data['year'.$i],$cur);
					}
				}
			}
		}
		// $data = mysql_fetch_array($result);

		return $domainprices;
	}

    /*
     * Returns the price for a given class
     * If class not found, returns the registry price
     *
     * @param string $class The priceclass
     * @param string $domain The domain
     * @return $price The formated price
     *
     */
	private function getPremiumClassPrice($class, $domain) {

		// $_SESSION["currency"] is 1  (USD)

		$result = select_query("tblcurrencies","*",array("id" => $_SESSION["currency"]),"","","1");
		$cur = mysql_fetch_array($result);

		$price = "";
		$sql = "SELECT
					pp.annually
				FROM
					tblpricing pp, tblproducts p
				WHERE
					p.name = '".$class."'
				AND
					p.id = pp.relid
				AND
					pp.tsetupfee = 0
				AND
					pp.type = 'product'
				AND
					pp.currency = ".$_SESSION["currency"]."
				LIMIT 1";

		$result = mysql_query($sql);
		$data = mysql_fetch_array($result);

		$price = $data["annually"];

		// echo "price is --> $price <--";

		if((!empty($price)) && ($price != 0) && ($price != -1)){
			$price = $this->formatPrice($price,$cur);
		}else{
			$price = -1;
		}

		$domainprices["domainregister"][1] = $price;

		return $domainprices;
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
		if ($number <= 0){
			return -1;
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

    	//create an array with each extension and his autoreg (the configured resgistrar for this extension)
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
    	//$_SESSION["ispapi_registrar_object"] = $ispapiobject[$registrar];

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
		try{
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

		} catch (Exception $e) {
			die($e->getMessage());
		}

	}

    // private function getTLDGroups(){
    // 	$result = select_query("ispapi_tblcategories","id,name,tlds", array("id"=>$this->tldgroup));
    // 	$data = mysql_fetch_array($result);
	// 	if(isset($data["tlds"])){
	// 		return explode(" ", $data["tlds"]);
	// 	}else{
	// 		array();
	// 	}
    // }

    /*
     * Convert the domain into an IDN code
     *
     * @param string|array $domain The domain name or an array of domains
     * @param IspApiConnection object $ispapi The IspApiConnection object to send API Requests
     * @return string|array IDN code of the domain name or array of IDN codes (saarbrücken.de => xn--saarbrcken-feb.de )
     */
    private function convertIDN($domain, $registrar){
    	$registrarconfigoptions = getregistrarconfigoptions($registrar);
    	$ispapi_config = ispapi_config($registrarconfigoptions);

		if(!is_array($domain)){
	    	$command = array(
	    			"COMMAND" => "convertIDN",
	    			"DOMAIN" => $domain
	    	);
	    	$response = ispapi_call($command, $ispapi_config);
	    	return $response["PROPERTY"]["ACE"][0];
		}else{
			$command = array(
					"COMMAND" => "convertIDN",
					"DOMAIN" => $domain
			);
			$response = ispapi_call($command, $ispapi_config);
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
     * Cache the result in a SESSION
     *
     * @param array $res The array to cache
     * @param string $type The type of data (list OR response)
     */
    private function setCache($res, $type){
    	$searched_domain = $_SESSION["domain"];

    	if($type == "list"){
    		$_SESSION["cache"][$this->tldgroup][$searched_domain]["list"] = $res;
    	}else{
    		//wenn leer -> initialisieren
    		if(!isset($_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["data"])){
    			$_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["data"] = array();
    		}
    		//merge the data with the existing data
    		$result = array_merge($_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["data"], $res["data"]);
    		$_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["data"] = $result;

    		//if feedback isn't set, set it
    		if(!isset($_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["data"])){
    			$_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["feedback"] = $res["feedback"];
    		}
    		//if feedback is not empty, replace the old session value
    		if(!empty($res["feedback"])){
    			$_SESSION["cache"][$this->tldgroup][$searched_domain]["response"]["feedback"] = $res["feedback"];
    		}
    	}
    }

    /*
     * Get the cached result if available (returns an empty array if no data cached)
     *
     * @param string $type Type of data cached: list OR response
     * @return array The cached data
     */
    private function getCache($type){
    	$searched_domain = $_SESSION["domain"];

    	if(isset($_SESSION["cache"][$this->tldgroup][$searched_domain][$type])){
    		$_SESSION["cache"][$this->tldgroup][$searched_domain][$type]["cache"] = true;
    		return $_SESSION["cache"][$this->tldgroup][$searched_domain][$type];
    	}else{
    		return array();
    	}
    }

    /*
     * Send the JSON response back to the template
     */
    public function send(){
		echo $this->response;
		die();
    }
}

/*new*/
$action = (isset($_REQUEST["action"])) ? $_REQUEST["action"] : "";
$cached_data =  (isset($_REQUEST["cache"])) ? $_REQUEST["cache"] : "";

//Problem with sessions handling...
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
								$_SESSION["ispapi_registrar"],
								$cached_data,
								$_SESSION["adminuser"]);

$domaincheck->send();
/*new*/

?>
