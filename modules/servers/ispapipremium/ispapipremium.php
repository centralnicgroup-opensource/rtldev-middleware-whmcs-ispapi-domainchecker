<?php

/*
 * Get the selected registrar for this domain.
 * 
 * @params $domain
 */
function getRegistrar($domain){
	//get domain extension
	$tmp = explode(".", $domain, 2);
	$tld = $tmp[1];

	//get the registrar
	$result = select_query("tbldomainpricing","autoreg", array("extension" => ".".$tld));
	$data = mysql_fetch_array($result);
	return $data["autoreg"];
}

/*
 * Send the command to the API and returns the results.
 *
 * @params $domain
 * @params $command
 */
function apicall($domain, $command){
	include_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");
	$registrar = getRegistrar($domain);
	$registrarconfigoptions = getregistrarconfigoptions($registrar);
	$ispapi_config = ispapi_config($registrarconfigoptions);
	return ispapi_call($command, $ispapi_config);
}

/*
 * Configoption for premium domains.
 * We don't need configoptions for a premium domain.
 */
function ispapipremium_ConfigOptions() {
	$configarray = array();
	return $configarray;
}

/*
 * This function is called when a premium domain is ordered. 
 * This will be invoked automatically by WHMCS if the customer has enough credit, 
 * or manually by an admin user from the Products/Services tab under a clients profile within the admin area. 
 */ 
function ispapipremium_CreateAccount($params) {
	$sql = "SELECT * FROM tblproducts where id = ".$params["pid"];
	$result = mysql_query($sql);
	while($data = mysql_fetch_array($result)){
		if(preg_match('/NAMEMEDIA/',$data["description"])){
			$domain = $data["name"];
			$class = $data["description"];
		}else{
			$domain = $params["domain"];
			$class = $data["name"];
		}
	}
	
	if( preg_match('/NAMEMEDIA/',$class) ){
	
		//get price in USD
		$sql = "SELECT * FROM tblpricing where type = 'product' and currency = 1 and relid = ".$params["pid"];
		$result = mysql_query($sql);
		while($data = mysql_fetch_array($result)){
			$price = $data["monthly"];
		}
		
		$command = array(
				"command" => "adddomainapplication",
				"domain" => $domain,
				"class" => $class,
				"currency" => "USD",
				"price" => $price
		);
		$application = apicall($domain, $command);
	}
	elseif( preg_match('/DONUTS/',$class) ){
		$registrant = array(
				"FIRSTNAME" => $params["clientsdetails"]["firstname"],
				"LASTNAME" => $params["clientsdetails"]["lastname"],
				"ORGANIZATION" => $params["clientsdetails"]["companyname"],
				"STREET" => $params["clientsdetails"]["address1"],
				"CITY" => $params["clientsdetails"]["city"],
				"STATE" => $params["clientsdetails"]["state"],
				"ZIP" => $params["clientsdetails"]["postcode"],
				"COUNTRY" => $params["clientsdetails"]["country"],
				"PHONE" => $params["clientsdetails"]["phonenumber"],
				"EMAIL" => $params["clientsdetails"]["email"]
		);
		
		$command = array(
				"command" => "adddomainapplication",
				"domain" => $domain,
				"class" => $class,
				"period" => 1,
				"OWNERCONTACT0" => $registrant,
				"ADMINCONTACT0" => $registrant,
				"TECHCONTACT0" => $registrant,
				"BILLINGCONTACT0" => $registrant
		);
		$application = apicall($domain, $command);
	}
	logModuleCall("domaincheck_addon",$command["command"],$command,$application);
	
	if($application["CODE"] == "200"){
		addCustomField("applicationid",$application["PROPERTY"]["APPLICATION"][0],$params);
		
		$result = "success";
	}else{
		$result = $application["DESCRIPTION"];
	}
	return $result;
}

/*
 * This function will be invoked automatically every year by WHMCS if the customer has enough credit
 * or manually by an admin user each time a renewal invoice for a the premium product is paid. 
 */ 
function ispapipremium_Renew($params) {
	$sql = "SELECT * FROM tblproducts where id = ".$params["pid"];
	$result = mysql_query($sql);
	while($data = mysql_fetch_array($result)){
		if(preg_match('/NAMEMEDIA/',$data["description"])){
			$domain = $data["name"];
			$class = $data["description"];
		}else{
			$domain = $params["domain"];
			$class = $data["name"];
		}
	}

	if( preg_match('/DONUTS/',$class) ){

		$command = array(
				"command" => "renewdomain",
				"domain" => $domain,
				"class" => $class
		);
		$application = apicall($domain, $command);
		logModuleCall("domaincheck_addon",$command["command"],$command,$application);

		if($application["CODE"] == "200"){
			$result = "success";
		}else{
			$result = $application["DESCRIPTION"];
		}

	}else{
		$result = "Not a Premium Domain";
	}
	return $result;
}

/*
 * Add a custom field ans his value to the product.
 * 
 * @params $fieldname
 * @params $fieldvalue
 * @params $params
 */ 
function addCustomField($fieldname,$fieldvalue,$params){
	//get field id if exists
	$result = mysql_query("SELECT * FROM tblcustomfields WHERE fieldname = '".$fieldname."' and relid = ".$params["pid"]." limit 1");
	$data = mysql_fetch_array($result);
	if(!empty($data)){
		$fieldid = $data["id"];
	}else{
		//insert field for this product
		$fieldid = insert_query("tblcustomfields", array("type" => "product","relid" => $params["pid"],"fieldname" => $fieldname,"fieldtype" => "text","adminonly" => "on"));
	}

	//insert/replace field value for this product
	$result = mysql_query("SELECT * FROM tblcustomfieldsvalues WHERE fieldid = ".$fieldid." and relid = ".$params["serviceid"]." limit 1");
	$data = mysql_fetch_array($result);
	if(!empty($data)){
		mysql_query("DELETE FROM tblcustomfieldsvalues where fieldid = ".$data["fieldid"]." and relid = ".$data["relid"]);
	}
	insert_query("tblcustomfieldsvalues", array("fieldid" => $fieldid,"relid" => $params["serviceid"],"value" => $fieldvalue));	
}

/*
 * This function will display information about the status of the application in the product area.
 */ 
function ispapipremium_ClientArea($params) {
	$applicationid = getCustomFieldValue("applicationid",$params);
	
	//get domain name
	$sql = "SELECT * FROM tblproducts where id = ".$params["pid"];
	$result = mysql_query($sql);
	while($data = mysql_fetch_array($result)){
		if(preg_match('/NAMEMEDIA/',$data["description"])){
			$domain = $data["name"];
		}else{
			$domain = $params["domain"];
		}
	}
	
	if(empty($applicationid)){
		return "Application ID not found";
	}
	
	$command = array(
			"command" => "statusdomainapplication",
			"application" => $applicationid
	);
	$application = apicall($domain, $command);

	if($application["CODE"] == "200"){
		$result = "<h3>Realtime information</h3>";
		$result .= "Creation date: ".$application["PROPERTY"]["CREATEDDATE"][0]."<br>";
		$result .= "Status: <b>".$application["PROPERTY"]["STATUS"][0]."</b><br>";	
	}else{
		$command = array(
				"command" => "statusdomain",
				"domain" => $domain
		);
		$application = apicall($domain, $command);
		
		if($application["CODE"] == "200"){
			$result = "<h3>Realtime information</h3>";
			$result .= "Creation date: ".$application["PROPERTY"]["CREATEDDATE"][0]."<br>";
			$result .= "Status: <b>".$application["PROPERTY"]["STATUS"][0]."</b><br><br>";
			
			if($application["PROPERTY"]["STATUS"][0]=="ACTIVE"){
				//test if domain exists in the list
				$res = mysql_query("SELECT * FROM tbldomains WHERE domain = '".$domain."' LIMIT 1");
				$data = mysql_fetch_array($res);
				if(empty($data)){
					//finilize process
					ispapipremium_finalizeprocess($params);
					$result .= "<b style='color:#46A546;'>Your domain is now available in your domain list.</b>";
				}else{
					$result .= "<b style='color:#46A546;'>Your domain is available in your domain list.</b>";
				}
			}
		}else{
			$result = $application["DESCRIPTION"];
		}
	}
	return $result;
}

/*
 * Get the value of a product custom field.
 *
 * @params $fieldname
 * @params $params
 */
function getCustomFieldValue($fieldname,$params){
	$value = false;
	$sql = "SELECT * FROM tblcustomfields cf, tblcustomfieldsvalues cfv where cf.fieldname = '".$fieldname."' and  cf.relid = ".$params["pid"]." and cf.id = cfv.fieldid;";
	$result = mysql_query($sql);
	while($data = mysql_fetch_array($result)){
		$value = $data["value"];
	}
	return $value;
}

/*
 * Once the “Domain Application” status (displayed in the product) is set to “ACTIVE” 
 * the domain will be created in the domain list. This action is
 * realized automatically when the customer opens the respective product and will
 * also be done per cron job once per day.
 */
function ispapipremium_finalizeprocess($params) {
	//get some vars from premium product (hostingid, orderid, userid, firstpaymentamount)
	$sql = "SELECT * FROM tblhosting WHERE id = ".$params["serviceid"];
	$result = mysql_query($sql);
	$hosting = mysql_fetch_array($result);
	
	$hostingid = $hosting["id"];
	$orderid = $hosting["orderid"];
	$userid = $hosting["userid"];
	$firstpaymentamount = $hosting["firstpaymentamount"];
	
	//get domain name and class
	$sql = "SELECT * FROM tblproducts WHERE id = ".$params["pid"];
	$result = mysql_query($sql);
	$data = mysql_fetch_array($result);

	if(preg_match('/NAMEMEDIA/',$data["description"])){
		$domain = $data["name"];
		$class = $data["description"];
		
		//get the extension
		$tmp = explode(".", $domain, 2);
		$tld = $tmp[1];
		
		//get the renewal price for this extension
		$sql = "SELECT tdp.extension, tp.type, msetupfee year1
		FROM tbldomainpricing tdp, tblpricing tp
		WHERE tp.relid = tdp.id
		AND tp.currency = 1 AND tp.type='domainrenew' AND tdp.extension = '.".$tld."' limit 1";
		
		$result = mysql_query($sql);
		$data = mysql_fetch_array($result);
		$recurringamount = $data['year1'];
		
	}else{
		$domain = $hosting["domain"];
		$class = $data["name"];
		$recurringamount = 0;
		$firstpaymentamount = 0;
	}
	
	//check if the domain name has already been added as a domain
	$domainexists = false;
	$sql = "SELECT * FROM tbldomains WHERE domain = '".$domain."'";
	$result = mysql_query($sql);
	while($data = mysql_fetch_array($result)){
		$domainexists = true;
	}
	
	if(!$domainexists){
		$command = array(
				"command" => "statusdomain",
				"domain" => $domain,
		);
		$response = apicall($domain, $command);
		
		if($response["CODE"] == "200"){
			$registrar = getRegistrar($domain);
			$status = $response["PROPERTY"]["STATUS"][0];
			$nextduedate = $response["PROPERTY"]["ACCOUNTINGDATE"][0];
			$nextduedate = preg_replace('/ .*/', '', $nextduedate);
			$regdate = $response["PROPERTY"]["CREATEDDATE"][0];
			$regdate = preg_replace('/ .*/', '', $regdate);
				
			insert_query("tbldomains", array("userid"=>$userid, 
											 "orderid"=>$orderid, 
											 "type"=>"Register", 
					 						 "registrationdate"=>$regdate,
											 "domain"=>$domain,
											 "firstpaymentamount"=>$firstpaymentamount,
											 "recurringamount"=>$recurringamount,
											 "registrar"=>$registrar,
											 "registrationperiod"=>"1",
											 "expirydate"=>$nextduedate,
											 "status"=>$status,
											 "donotrenew" => "on",
											 "nextduedate"=>$nextduedate,
											 "paymentmethod"=>"banktransfer"));
			
			$result = "Domain has been finalized";
		}else{
			
			$result = "Domain is not ready";
		}
		
	
	}else{
		$result = "Domain already finalized";
	}
	return $result;
}

/*
 * This function can be used to display different buttons for the admin in the admin area of the product
 */
function ispapipremium_AdminCustomButtonArray() {
    $buttonarray = array(); /*array(
	 "Finalize domain process (PREMIUM PRODUCT -> DOMAIN)" => "finalizeprocess"
	);*/
	return $buttonarray;
}

?>