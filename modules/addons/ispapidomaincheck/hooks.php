<?php
use WHMCS\Database\Capsule;
use ISPAPI\I18n;

require_once(dirname(__FILE__)."/lib/i18n.class.php");

add_hook('ClientAreaPage', 1, function ($templateVariables) {
    $i18n = new I18n();
    $translations = $i18n->getTranslations();
    return array("_LANG" => $translations);
});
