<?php
use WHMCS\Database\Capsule;

add_hook('ClientAreaPage', 1, function($templateVariables)
{
    $modulename = $templateVariables["modulename"];
    $language = (!empty($templateVariables["language"])) ? $templateVariables["language"] : "english";

    $module_language_file = getcwd()."/modules/addons/".$modulename."/lang/".$language.".php";
    if(file_exists($module_language_file)){
		include($module_language_file);
        return array("LANG" => $_LANG);
	}
});

?>
