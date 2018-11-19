<?php
use ISPAPI\LoadRegistrars;
use ISPAPI\Helper;
use ISPAPI\DomainCheck;
use ISPAPI\i18n;

$init_path_symlink = implode(DIRECTORY_SEPARATOR, array($_SERVER["DOCUMENT_ROOT"],"init.php"));
$init_path = implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"init.php"));
if (file_exists($init_path)) {
    require_once($init_path);
} elseif (file_exists($init_path_symlink)) {
    require_once($init_path_symlink);
} else {
    exit("cannot found init.php");
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
