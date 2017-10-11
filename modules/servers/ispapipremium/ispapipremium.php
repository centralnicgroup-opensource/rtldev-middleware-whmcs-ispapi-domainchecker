<?php
/*
 * Get the selected registrar for this domain.
 *
 * @params $domain
 */
use WHMCS\Database\Capsule;

function getRegistrar($domain){
	try{
		$pdo = Capsule::connection()->getPdo();

		$tmp = explode(".", $domain, 2);
		$tld = $tmp[1];

		//get the registrar
		$stmt = $pdo->prepare("SELECT autoreg FROM tbldomainpricing WHERE extension =?");
		$stmt->execute(array(".".$tld));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

		return $data["autoreg"];

	} catch (Exception $e) {
		die($e->getMessage());
	}
	//get domain extension

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
	try{
		$pdo = Capsule::connection()->getPdo();

		$stmt = $pdo->prepare("SELECT * FROM tblproducts where id=?");
		$stmt->execute(array($params['pid']));
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

		foreach ($data as $key => $value) {
			if(preg_match('/NAMEMEDIA/',$value["description"])){
				$domain = $value["name"];
				$class = $value["description"];
			}else{
				$domain = $params["domain"];
				$class = $value["name"];
			}
		}

		if( preg_match('/NAMEMEDIA/',$class) ){
			//get price in USD
			$stmt = $pdo->prepare("SELECT * FROM tblpricing where type = 'product' and currency = 1 and relid=?");
			$stmt->execute(array($params['pid']));
			$data = $stmt->fetch(PDO::FETCH_ASSOC);
			$price = $data['monthly'];

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

	} catch (Exception $e) {
		die($e->getMessage());
	}

}

/*
 * This function will be invoked automatically every year by WHMCS if the customer has enough credit
 * or manually by an admin user each time a renewal invoice for a the premium product is paid.
 */
function ispapipremium_Renew($params) {
	try{
		$pdo = Capsule::connection()->getPdo();

		$stmt = $pdo->prepare("SELECT * FROM tblproducts where id =?");
		$stmt->execute(array($params["pid"]));
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

		foreach ($data as $key => $value) {
			if(preg_match('/NAMEMEDIA/',$value["description"])){
				$domain = $value["name"];
				$class = $value["description"];
			}else{
				$domain = $params["domain"];
				$class = $value["name"];
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

	} catch (Exception $e) {
		die($e->getMessage());
	}

}

/*
 * Add a custom field ans his value to the product.
 *
 * @params $fieldname
 * @params $fieldvalue
 * @params $params
 */
function addCustomField($fieldname,$fieldvalue,$params){ # TODO : Could not test. This is function is not called because I could not buy
	// premium domain. It always gives the description: credit limit exceeded
	try{
		$pdo = Capsule::connection()->getPdo();

		//get field id if exists
		$stmt = $pdo->prepare("SELECT * FROM tblcustomfields WHERE fieldname =? and relid =? limit 1");
		$stmt->execute(array($fieldname, $params["pid"]));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);
		if(!empty($data)){
			$fieldid = $data["id"];
		}else{
			//insert field for this product
			$insert_stmt = $pdo->prepare("INSERT INTO tblcustomfields (type, relid, fieldname, fieldtype, adminonly) VALUES ('product', ?, ?, 'text', 'on')");
			$insert_stmt->execute(array($params["pid"], $fieldname));
		}

		//insert/replace field value for this product
		$stmt = $pdo->prepare("SELECT * FROM tblcustomfieldsvalues WHERE fieldid =? and relid =? limit 1");
		$stmt->execute(array($fieldid, $params["serviceid"]));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);
		if(!empty($data)){
			$delete_stmt = $pdo->prepare("DELETE FROM tblcustomfieldsvalues where fieldid =? and relid =?");
			$delete_stmt->execute(array($data["fieldid"], $data["relid"]));
		}
		$insert_stmt = $pdo->prepare("INSERT INTO tblcustomfieldsvalues (fieldid, relid, value) VALUES ( ?, ?, ?)");
		$insert_stmt->execute(array($fieldid, $params["serviceid"], $fieldvalue));

	} catch (Exception $e) {
		die($e->getMessage());
	}

}

/*
 * This function will display information about the status of the application in the product area.
 */
function ispapipremium_ClientArea($params) { #TODO: Testing. what is product area
	$applicationid = getCustomFieldValue("applicationid",$params);

	try{
		$pdo = Capsule::connection()->getPdo();

		//get domain name
		$stmt = $pdo->prepare("SELECT * FROM tblproducts WHERE id =?");
		$stmt->execute(array($params["pid"]));
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

		foreach ($data as $key => $value) {
			if(preg_match('/NAMEMEDIA/',$value["description"])){
				$domain = $value["name"];
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
					$stmt = $pdo->prepare("SELECT * FROM tbldomains WHERE domain =? LIMIT 1");
					$stmt->execute(array($domain));
					$data = $stmt->fetch(PDO::FETCH_ASSOC);
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

	} catch (Exception $e) {
		die($e->getMessage());
	}

}

/*
 * Get the value of a product custom field.
 *
 * @params $fieldname
 * @params $params
 */
 // TODO:from here : Testing
function getCustomFieldValue($fieldname,$params){
	try{
		$pdo = Capsule::connection()->getPdo();

		$value = false;
		$stmt = $pdo->prepare("SELECT * FROM tblcustomfields cf, tblcustomfieldsvalues cfv where cf.fieldname =? and  cf.relid =? and cf.id = cfv.fieldid;");
		$stmt->execute(array($fieldname, $params["pid"]));
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);

		foreach ($data as $key => $val) {
			$value = $val["value"];
		}
		return $value;
	} catch (Exception $e) {
		die($e->getMessage());
	}

}

/*
 * Once the “Domain Application” status (displayed in the product) is set to “ACTIVE”
 * the domain will be created in the domain list. This action is
 * realized automatically when the customer opens the respective product and will
 * also be done per cron job once per day.
 */
function ispapipremium_finalizeprocess($params) {
	try{
		$pdo = Capsule::connection()->getPdo();

		//get some vars from premium product (hostingid, orderid, userid, firstpaymentamount)
		$stmt = $pdo->prepare("SELECT * FROM tblhosting WHERE id =?");
		$stmt->execute(array($params["serviceid"]));
		$hosting = $stmt->fetch(PDO::FETCH_ASSOC);

		$hostingid = $hosting["id"];
		$orderid = $hosting["orderid"];
		$userid = $hosting["userid"];
		$firstpaymentamount = $hosting["firstpaymentamount"];

		//get domain name and class
		$stmt = $pdo->prepare("SELECT * FROM tblproducts WHERE id =?");
		$stmt->execute(array($params["pid"]));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

		if(preg_match('/NAMEMEDIA/',$data["description"])){
			$domain = $data["name"];
			$class = $data["description"];
			//get the extension
			$tmp = explode(".", $domain, 2);
			$tld = $tmp[1];
			//get the renewal price for this extension
			$stmt = $pdo->prepare("SELECT tdp.extension, tp.type, msetupfee year1
			FROM tbldomainpricing tdp, tblpricing tp
			WHERE tp.relid = tdp.id
			AND tp.currency = 1 AND tp.type='domainrenew' AND tdp.extension =? limit 1");
			$stmt->execute(array(".".$tld));
			$data = $stmt->fetch(PDO::FETCH_ASSOC);
			$recurringamount = $data['year1'];
		}else{
			$domain = $hosting["domain"];
			$class = $data["name"];
			$recurringamount = 0;
			$firstpaymentamount = 0;
		}
		//check if the domain name has already been added as a domain
		$domainexists = false;
		$stmt = $pdo->prepare("SELECT * FROM tbldomains WHERE domain =?");
		$stmt->execute(array($domain));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);
		if(!empty($data)){
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
				// TODO: Testing-Yinsert query
				$insert_stmt = $pdo->prepare("INSERT INTO tbldomains (userid, orderid, type, registrationdate,
					 domain, firstpaymentamount, recurringamount, registrar, registrationperiod, expirydate, status, donotrenew, nextduedate, paymentmethod) VALUES (?, ?, 'Register', ?, ?, ?, ?, ?, '1', ?, ?, 'on', 'banktransfer')");
				$insert_stmt->execute(array($userid, $orderid, $regdate, $domain, $firstpaymentamount, $recurringamount, $registrar, $nextduedate, $status, $nextduedate));

				$result = "Domain has been finalized";
			}else{

				$result = "Domain is not ready";
			}


		}else{
			$result = "Domain already finalized";
		}
		return $result;

	} catch (Exception $e) {
		die($e->getMessage());
	}

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
