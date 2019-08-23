<?php
use ISPAPI\DCHelper;

$root_path = $_SERVER["DOCUMENT_ROOT"];
$script_path = preg_replace("/.modules.addons..+$/", "", dirname($_SERVER["SCRIPT_NAME"]));
if (!empty($script_path)) {
    $root_path .= $script_path;
}
$init_path = implode(DIRECTORY_SEPARATOR, array($root_path,"init.php"));
if (isset($GLOBALS["customadminpath"])) {
    $init_path = preg_replace("/(\/|\\\)" . $GLOBALS["customadminpath"] . "(\/|\\\)init.php$/", DIRECTORY_SEPARATOR . "init.php", $init_path);
}
if (file_exists($init_path)) {
    require_once($init_path);
} else {
    exit("cannot find init.php");
}

require_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"includes","registrarfunctions.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__), "modules", "addons", "ispapidomaincheck", "lib","Common","DCHelper.class.php")));


$idn = strtolower($_REQUEST["idn"]);
$pc = strtolower($_REQUEST["pc"]);

//get the sld and tld
if (strpos($idn, ".")===false) {
    die("Domain is incorrect");
}
$tldidn = preg_replace("/^[^.]+/", "", $idn);

//Get the WHOIS
$registrar = false;
$extension = DCHelper::SQLCall("SELECT autoreg FROM tbldomainpricing WHERE extension=?", array($tldidn), "fetch");
if (isset($extension["autoreg"]) && preg_match("/^ispapi$/i", $extension["autoreg"])) {
    //use API
    $response = DCHelper::APICall($extension["autoreg"], array(
        "COMMAND" => "QueryDomainWhoisInfo",
        "DOMAIN" => $pc
    ));
    if ($response["CODE"] == 200 && !preg_match("/you have exceeded this limit/i", urldecode($response["PROPERTY"]["WHOISDATA"][0]))) {
        $registrar=true;
    }
}
//Fallback to WHMCS's lookup for any issue with API or whois query limit exceeded
if (!$registrar) {
    //use WHOIS
    $check = localAPI("domainwhois", array("domain" => $idn));
    $whois = urldecode($check["whois"]);
}

?>
<!doctype html>
<html>
<head>
<meta charset="UTF-8">
<title>ISPAPI - WHOIS Results</title>
</head>
<body bgcolor="#F9F9F9">
<?php
if ($registrar) {
    for ($i = count($response["PROPERTY"]["WHOISDATA"])-1; $i >= 0; $i--) {?>
        <fieldset>
            <legend>
            <?php echo htmlspecialchars($response["PROPERTY"]["WHOISSERVER"][$i]." @ ".$response["PROPERTY"]["WHOISDATE"][$i]." UTC");?>
          </legend>
          <tt><small><?php echo nl2br(htmlentities(urldecode($response["PROPERTY"]["WHOISDATA"][$i])));?></small></tt>
        </fieldset><?php
    }
} else {
    if (empty($whois)) {
        $whois = "No data returned.";
    }?>
    <fieldset>
        <tt><small><?php echo $whois;?></small></tt>
    </fieldset><?php
}?>
</body>
</html>
