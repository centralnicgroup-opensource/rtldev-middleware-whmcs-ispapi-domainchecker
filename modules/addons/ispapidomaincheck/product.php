<?php
require_once(dirname(__FILE__)."/../../../init.php");
use WHMCS\Database\Capsule;
// TODO:testing
/*
 * Get the selected registrar for this domain.
 *
 * @params $domain
 */
function getRegistrar($domain){
	//TODO: NOT TESTED
	try{
		$pdo = Capsule::connection()->getPdo();
		//get domain extension
		$tmp = explode(".", $domain, 2);
		$tld = $tmp[1];

		//get the registrar
		$stmt = $pdo->prepare("SELECT autoreg FROM tbldomainpricing WHERE extension=?");
		$stmt->execute(array(".".$tld));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

		return $data["autoreg"];

	} catch (Exception $e) {
		die($e->getMessage());
	}

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
			try{
				#TODO : TESTING
				$pdo = Capsule::connection()->getPdo();
				$stmt = $pdo->prepare("SELECT * FROM tblproductgroups WHERE name='PREMIUM DOMAIN' LIMIT 1");
				$stmt->execute();
				$data = $stmt->fetch(PDO::FETCH_ASSOC);

				if(!empty($data)){
					$productgroupid = $data["id"];
				}else{
					$insert_stmt = $pdo->prepare("INSERT INTO tblproductgroups (name, hidden) VALUES ('PREMIUM DOMAIN', 'on')");
					$insert_stmt->execute();
					if($insert_stmt->rowCount()){
						$stmt2 = $pdo->prepare("SELECT id FROM tblproductgroups WHERE name='PREMIUM DOMAIN'");
						$stmt2->execute();
						$productgroupid = $stmt2->fetch(PDO::FETCH_ASSOC);
					}
				}

				//Delete product and pricing if exists and not in use
				$existingproductid = "";
				$stmt = $pdo->prepare("SELECT id FROM tblproducts WHERE name =?");
				$stmt->execute(array($_REQUEST["domain"]));
				$data = $stmt->fetch(PDO::FETCH_ASSOC);
				$existingproductid = $data["id"];

				if(!empty($existingproductid)){

					//Check if product in use and if in use dont touch
					$product_in_use = 0;
					$stmt = $pdo->prepare("SELECT id FROM tblhosting WHERE packageid =?");
					$stmt->execute(array($existingproductid));
					$data = $stmt->fetch(PDO::FETCH_ASSOC);
					if($data){
						$product_in_use = 1;
					}

					if(isset($product_in_use) && $product_in_use == 1){
						echo '{"status": "error","errortext":"Product in use"}';
						break;
					}

					//Delete product and pricing
					$stmt = $pdo->prepare("DELETE FROM tblproducts WHERE id =?");
					$stmt->execute(array($existingproductid));

					$stmt = $pdo->prepare("DELETE FROM tblpricing WHERE relid =? AND type = 'product'");
					$stmt->execute(array($existingproductid));

				}

				//Insert product and pricing for USD
				$insert_stmt = $pdo->prepare("INSERT INTO tblproducts (type,gid,name,description,autosetup,hidden,servertype,paytype,retired) VALUES ('other', ?, ?, ?, 'payment', 'on', 'ispapipremium' ,'onetime',0);");
				$insert_stmt->execute(array($productgroupid, $_REQUEST["domain"], $_REQUEST["class"]));

				//Get the new inserted ID
				$newproductid = "";
				$stmt = $pdo->prepare("SELECT id FROM tblproducts WHERE name =? ");
				$stmt->execute(array($_REQUEST["domain"]));
				$data = $stmt->fetch(PDO::FETCH_ASSOC);
				if($data){
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
								$stmt = $pdo->prepare("SELECT * FROM tblcurrencies");
								$stmt->execute();
								$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
								foreach ($data as $key => $value) {
									$p = round( $price * $value["rate"], 2 );
									$currency = $value["id"];

									$insert_stmt = $pdo->prepare("INSERT INTO tblpricing (type,currency,relid,monthly,quarterly,semiannually,annually,biennially,triennially) VALUES ('product', ?, ? , ?,-1,-1,-1,-1,-1)");
									$insert_stmt->execute(array($currency, $newproductid, $p));
								}
							}
						}
					}

				}

			} catch (Exception $e) {
				die($e->getMessage());
			}

			echo '{"status":"ok","productid":"'.$newproductid.'"}';
			break;
	}//END SWITCH
}//END IF


?>
