<?php
use WHMCS\Database\Capsule;
use ISPAPI\I18n;

require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","i18n.class.php")));

add_hook('ClientAreaPage', 1, function ($templateVariables) {
    $i18n = new I18n();
    return array("_LANG" => $i18n->getTranslations());
});
