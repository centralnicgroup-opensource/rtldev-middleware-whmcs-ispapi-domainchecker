<?php
use ISPAPI\LoadRegistrars;
use ISPAPI\Helper;
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

require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","DomainCheck.class.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","LoadRegistrars.class.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","Helper.class.php")));
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
    Helper::getCustomerCurrency()
);
$domaincheck->send();
