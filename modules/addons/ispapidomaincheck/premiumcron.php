<?php
#TODO : TESTING

use WHMCS\Database\Capsule;
if(preg_match('/premiumcron.php/',$_SERVER["SCRIPT_FILENAME"]) ){
	die("This file cannot be accessed directly");
}

require_once(dirname(__FILE__)."/../../servers/ispapipremium/ispapipremium.php");

$content = "<b>PREMIUM CRON REPORTS</b><br><br>";
$content .=  "<table><tr><th style='width:250px;text-align:left;'>Domain</th><th style='width:300px;text-align:left;'>Class</th><th style='width:500px;text-align:left;'>Response</th></tr> ";

try{
	$pdo = Capsule::connection()->getPdo();

	$stmt = $pdo->prepare("SELECT * FROM tblhosting WHERE domainstatus = 'Active'");
	$stmt->execute();
	$hosting = $stmt->fetchAll(PDO::FETCH_ASSOC);

	foreach ($hosting as $key => $value) {
		$ispremium = false;
		$params = array("pid" => $value["packageid"], "serviceid" => $value["id"] );

		$stmt = $pdo->prepare("SELECT * FROM tblproducts where id =?");
		$stmt->execute(array($params["pid"]));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

			if(preg_match('/NAMEMEDIA/',$data["description"])){
				$domain = $data["name"];
				$class = $data["description"];
				$ispremium = true;
			}elseif(preg_match('/PREMIUM_/',$data["name"])){
				$domain = $value["domain"];
				$class = $data["name"];
				$ispremium = true;
			}
			if($ispremium){
				$response = ispapipremium_finalizeprocess($params);
				$content .= "<tr><td>".$domain."</td><td>".$class."</td><td>".$response."</td></tr>";
			}
	}

} catch (Exception $e) {
	die($e->getMessage());
}

$content .= "</table>";

// $headers = "Content-Type: text/html; charset=\"iso-8859-1\"";
// mail("anthonys@hexonet.net","Cron Reports",$content,$headers);
// echo $content;

?>
