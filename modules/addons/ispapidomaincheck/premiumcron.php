<?php 

if(preg_match('/premiumcron.php/',$_SERVER["SCRIPT_FILENAME"]) ){
	die("This file cannot be accessed directly");
}

require_once(dirname(__FILE__)."/../../servers/ispapipremium/ispapipremium.php");

$content = "<b>PREMIUM CRON REPORTS</b><br><br>";
$content .=  "<table><tr><th style='width:250px;text-align:left;'>Domain</th><th style='width:300px;text-align:left;'>Class</th><th style='width:500px;text-align:left;'>Response</th></tr> ";

$sql = "SELECT * FROM tblhosting WHERE domainstatus = 'Active'";
$res = mysql_query($sql);
while($hosting = mysql_fetch_array($res)){
	$ispremium = false;
	$params = array("pid" => $hosting["packageid"], "serviceid" => $hosting["id"] );
	
	$sql = "SELECT * FROM tblproducts where id = ".$params["pid"];
	$result = mysql_query($sql);
	$data = mysql_fetch_array($result);
	if(preg_match('/NAMEMEDIA/',$data["description"])){
		$domain = $data["name"];
		$class = $data["description"];
		$ispremium = true;
	}elseif(preg_match('/PREMIUM_/',$data["name"])){
		$domain = $hosting["domain"];
		$class = $data["name"];
		$ispremium = true;
	}
	if($ispremium){
		$response = ispapipremium_finalizeprocess($params);
		$content .= "<tr><td>".$domain."</td><td>".$class."</td><td>".$response."</td></tr>";	
	}
}
$content .= "</table>";

//$headers = "Content-Type: text/html; charset=\"iso-8859-1\"";
//mail("anthonys@hexonet.net","Cron Reports",$content,$headers);
//echo $content;

?>

