<?php
require(dirname(__FILE__)."/init.php");
require(dirname(__FILE__)."/includes/functions.php");
require(dirname(__FILE__)."/includes/clientareafunctions.php");
require(dirname(__FILE__)."/includes/registrarfunctions.php");

//get the sld and tld
if (strpos( $_REQUEST["domain"], "." )) {
	$domainparts = explode( ".", $_REQUEST["domain"], 2 );
	$sld = $domainparts[0];
	$tld = "." . $domainparts[1];
}else{
	die("Domain is incorrect");
}


//get the registrar
$result = select_query("tbldomainpricing","extension,autoreg", array("extension" => $tld));
$registrar = "";
while($data = mysql_fetch_array($result)){
	$file = $data["autoreg"];
	if(!empty($file)){
		require_once(dirname(__FILE__)."/modules/registrars/".$file."/".$file.".php");
		if(function_exists($file.'_GetISPAPIModuleVersion')){
			$registrar = $file;
		}
	}
}

//if ISPAPI registrar use API Whois, else WHOIS
if(!$registrar){
	//require("includes/whoisfunctions.php");
	//$result = lookupDomain($sld, $tld);
	$command = "domainwhois";
	$values["domain"] = $_REQUEST["domain"];
	$check = localAPI($command, $values, $_SESSION["adminuser"]);
	$whois = urldecode($check["whois"]);
}else{
	$ispapi_config = ispapi_config(getregistrarconfigoptions($registrar));
	$command = array(
			"COMMAND" => "QueryDomainWhoisInfo",
			"DOMAIN" => $_REQUEST["domain"]
	);
	$response = ispapi_call($command, $ispapi_config);
}

?>
<html>
<head>
<title>ISPAPI - WHOIS Results</title>
</head>
<body bgcolor="#F9F9F9">
<?php
if($registrar){
	for ( $i = count($response["PROPERTY"]["WHOISDATA"])-1; $i >= 0; $i-- ) {
		echo "<fieldset>";
		echo "<legend>";
		echo htmlspecialchars($response["PROPERTY"]["WHOISSERVER"][$i]." @ ".$response["PROPERTY"]["WHOISDATE"][$i]." UTC");
		echo "</legend>";
		echo "<tt><small>";

		$whois = urldecode($response["PROPERTY"]["WHOISDATA"][$i]);
		$whois = preg_replace('/\&/', "&amp;", $whois);
		$whois = preg_replace('/\</', "&lt;", $whois);
		$whois = preg_replace('/\>/', "&gt;", $whois);
		//$whois = preg_replace('/ /', "&nbsp;", $whois);
		$whois = preg_replace('/\r?\n/', "<br />\n", $whois);
		echo $whois;

		echo "</small></tt>";
		echo "</fieldset>";
	}
}else{
	echo "<fieldset>";
	echo "<tt><small>";
	echo $whois;
	echo "</small></tt>";
	echo "</fieldset>";
}

?>
</body>
</html>
