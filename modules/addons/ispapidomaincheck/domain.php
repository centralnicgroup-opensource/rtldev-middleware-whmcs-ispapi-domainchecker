<?php
use ISPAPI\LoadRegistrars;
use ISPAPI\DCHelper;
use ISPAPI\DomainCheck;
use ISPAPI\i18n;

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
require_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"includes","domainfunctions.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"includes","registrarfunctions.php")));
$path = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","registrars","ispapi","lib","LoadRegistrars.class.php"));
if (file_exist($path)) {
    require_once($path);
} else {
    die('Please install our <a href="https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip">ISPAPI Registrar Module</a> >= v1.7.1');
}
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","DCHelper.class.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","DomainCheck.class.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","i18n.class.php")));

//load all the ISPAPI registrars
$ispapi_registrars = new LoadRegistrars();
$_SESSION["ispapi_registrar"] = $ispapi_registrars->getLoadedRegistars();

//instantiate the DomainCheck class and send the request
$domaincheck = new DomainCheck(
    $_REQUEST["domain"],
    $_REQUEST["domains"],
    $_REQUEST["tldgroup"],
    $_REQUEST["action"],
    $_SESSION["ispapi_registrar"],
    DCHelper::getCustomerCurrency()
);
$domaincheck->send();
