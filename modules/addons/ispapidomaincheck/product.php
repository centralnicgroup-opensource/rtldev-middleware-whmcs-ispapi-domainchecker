<?php 
require_once(dirname(__FILE__)."/../../../init.php");

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

//CREATE THE PREMIUM PRODUCT
if(isset($_REQUEST["page"])){
	switch($_REQUEST["page"]){
		case "create":

			//Get the group id or create the "PREMIUM DOMAIN" group if not existing
			//Group name will be "PREMIUM DOMAIN" and should never be modified by the user!
			$result = mysql_query("SELECT * FROM tblproductgroups WHERE name='PREMIUM DOMAIN' LIMIT 1");
			$data = mysql_fetch_array($result);
			if(!empty($data)){
				$productgroupid = $data["id"];
			}else{
				$productgroupid = insert_query("tblproductgroups",array("name" => "PREMIUM DOMAIN", "hidden" => 'on'));
			}
			
			//Delete product and pricing if exists and not in use
			$existingproductid = "";
			$sql = "SELECT id FROM tblproducts WHERE name = '".$_REQUEST["domain"]."'";
			$result = mysql_query($sql);
			while($data = mysql_fetch_array($result)){
				$existingproductid = $data["id"];
			}
			if(!empty($existingproductid)){
				
				//Check if product in use and if in use dont touch
				$product_in_use = 0;
				$sql = "SELECT id FROM tblhosting WHERE packageid = ".$existingproductid;
				$result = mysql_query($sql);
				while($data = mysql_fetch_array($result)){
					$product_in_use = 1;
				}
				if(isset($product_in_use) && $product_in_use == 1){
					echo '{"status": "error","errortext":"Product in use"}';
					break;
				}
				
				//Delete product and pricing
				$sql = "DELETE FROM tblproducts WHERE id = ".$existingproductid;
				$result = mysql_query($sql);
				
				$sql = "DELETE FROM tblpricing WHERE relid = ".$existingproductid." and type = 'product'";
				$result = mysql_query($sql);
			}

			//Insert product and pricing for USD
			$sql = "INSERT INTO tblproducts (type,gid,name,description,autosetup,hidden,servertype,paytype,retired) VALUES ('other', ".$productgroupid.", '".$_REQUEST["domain"]."', '".$_REQUEST["class"]."', 'payment', 'on', 'ispapipremium' ,'onetime',0);";
			$result = mysql_query($sql);
			

			//Get the new inserted ID
			$newproductid = "";
			$sql = "SELECT id FROM tblproducts WHERE name = '".$_REQUEST["domain"]."'";
			$result = mysql_query($sql);
			while($data = mysql_fetch_array($result)){
				$newproductid = $data["id"];
			}
			
			if(!empty($newproductid)){
				
				if( preg_match('/NAMEMEDIA/',$_REQUEST["class"]) ){
					//get TLD
					$tmp = explode(".", $_REQUEST["domain"], 2);
					$tld = strtoupper($tmp[1]);
					
					//Get the price for this NAMEMEDIA premium domain
					$command = array(
							"COMMAND" => "QueryDomainSuggestionList",
							"KEYWORD" => $_REQUEST["domain"],
							"LIMIT" => 1,
							"SOURCE" => "CP_PREMIUM",
							"ZONE0" => $tld
					);
					
					$suggestionList = apicall($_REQUEST["domain"], $command);
					$price = $suggestionList["PROPERTY"]["PRICE"][0];
					$currency = $suggestionList["PROPERTY"]["CURRENCY"][0];
					$domain = $suggestionList["PROPERTY"]["DOMAIN"][0];
					
					if ($domain == $_REQUEST["domain"]){
						if($currency == "USD"){
							$result = select_query("tblcurrencies","*");
							while($data = mysql_fetch_array($result)){
								$p = round( $price * $data["rate"], 2 );
								$currency = $data["id"];
								
								$sql = "INSERT INTO tblpricing (type,currency,relid,monthly,quarterly,semiannually,annually,biennially,triennially) VALUES ('product', ".$currency.", ".$newproductid." , ".$p.",-1,-1,-1,-1,-1);";
								$res = mysql_query($sql);
							}
						}
					}
				}
		
			}
			echo '{"status":"ok","productid":"'.$newproductid.'"}';
			break;
	}//END SWITCH
}//END IF


?>