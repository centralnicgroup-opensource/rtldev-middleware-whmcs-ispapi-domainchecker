<?php
use ISPAPI\Helper;

$root_path = $_SERVER["DOCUMENT_ROOT"];
$script_path = preg_replace("/.modules.addons..+$/", "", dirname($_SERVER["SCRIPT_NAME"]));
if (!empty($script_path)) {
    $root_path .= $script_path;
}
$init_path = implode(DIRECTORY_SEPARATOR, array($root_path,"init.php"));
if (file_exists($init_path)) {
    require_once($init_path);
} else {
    exit("cannot fiund init.php");
}
require_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"includes","registrarfunctions.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapidomaincheck","lib","Helper.class.php")));

function WHMCS_LookupDomain($domain)
{
    $values["domain"] = $domain;
    $check = localAPI("domainwhois", $values);
    return urldecode($check["whois"]);
}

$registrar = false;

//get the sld and tld
if (strpos($_REQUEST["domain"], ".")) {
    $domainparts = explode(".", strtolower($_REQUEST["domain"]), 2);
    $sld = $domainparts[0];
    $tld = ".".$domainparts[1];
} else {
    die("Domain is incorrect");
}

//Get the WHOIS
$extension = Helper::SQLCall("SELECT autoreg FROM tbldomainpricing WHERE extension = ?", array($tld), "fetch");
if (in_array($extension["autoreg"], $_SESSION["ispapi_registrar"])) {
    //use API
    $registrar=true;
    $command = array(
            "COMMAND" => "QueryDomainWhoisInfo",
            "DOMAIN" => $_REQUEST["domain"]
    );
    $response = Helper::APICall($extension["autoreg"], $command);
}

//Fallback to WHMCS's lookup for .ch and .li domains and for issues with API
if ((in_array($tld, array(".ch", ".li")) && ($response["CODE"] != 200)) || preg_match("/you have exceeded this limit/i", urldecode($response["PROPERTY"]["WHOISDATA"][0])) || !$registrar) {
    //use WHOIS
    $registrar = false;
    $whois = WHMCS_LookupDomain($_REQUEST["domain"]);
}

?>
<html>
<head>
<title>ISPAPI - WHOIS Results</title>
</head>
<body bgcolor="#F9F9F9">
<?php
if ($registrar) {
    for ($i = count($response["PROPERTY"]["WHOISDATA"])-1; $i >= 0; $i--) {
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
} else {
    echo "<fieldset>";
    echo "<tt><small>";
    echo $whois;
    echo "</small></tt>";
    echo "</fieldset>";
}

?>
</body>
</html>
