<?php
use WHMCS\Database\Capsule;

use ISPAPI\LoadRegistrars;
use ISPAPI\Helper;

require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","LoadRegistrars.class.php")));
require_once(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"lib","Helper.class.php")));

$module_version = "8.2.1";

/*
 * Configuration of the addon module.
 */
function ispapidomaincheck_config()
{
    global $module_version;
    $configarray = array(
        "name" => "ISPAPI HP DomainChecker",
        "description" => "This addon provides a new domainchecker interface with high speed checks, suggestions and premium support.",
        "version" => $module_version,
        "author" => "HEXONET",
        "language" => "english",
    );
    return $configarray;
}

/*
 * This function will be called with the activation of the add-on module.
 */
function ispapidomaincheck_activate()
{
    include(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"categories.php")));

    //if not existing, create ispapi_tblcategories table
    $query = Helper::SQLCall("CREATE TABLE IF NOT EXISTS ispapi_tblcategories (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, name TEXT, tlds TEXT)", array(), "execute");

    //import the default categories when empty
    $data = Helper::SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");
    if (empty($data)) {
        foreach ($categorieslib as $category => $tlds) {
            $insert_stmt = Helper::SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($category, implode(" ", $tlds)), "execute");
        }
    }
    return array('status'=>'success', 'description'=>'The ISPAPI HP DomainChecker was successfully installed.');
}

/*
 * This function will update the database when upgrading.
*/
function ispapidomaincheck_upgrade($vars)
{
    $version = $vars['version'];
    if ($version < 7.3) {
        // 1. DROP ispapi_tblaftermarketcurrencies if exists
        $query = Helper::SQLCall("DROP TABLE IF EXISTS ispapi_tblaftermarketcurrencies", array(), "execute");
        // 2. DROP ispapi_tblsettings if exists
        $query = Helper::SQLCall("DROP TABLE IF EXISTS ispapi_tblsettings", array(), "execute");
        // 3. ALTER ispapi_tblcategories
        $query = Helper::SQLCall("ALTER TABLE ispapi_tblcategories DROP COLUMN parent", array(), "execute");
        // This one deletes the row and does not complain if it can't.
        $query = Helper::SQLCall("DELETE IGNORE FROM ispapi_tblcategories WHERE tlds=''", array(), "execute");
    }
    return array('status'=>'success', 'description'=>'The ISPAPI HP DomainChecker was successfully upgraded.');
}

/*
 * This function will be called with the deactivation of the add-on module.
*/
function ispapidomaincheck_deactivate()
{
    //NOTHING TO DO
    return array('status'=>'success','description'=>'The ISPAPI HP DomainChecker was successfully uninstalled.');
}

/*
 * This function is the startpoint of the add-on module
 * <#WHMCS_URL#>/index.php?m=ispapidomaincheck
 * <#WHMCS_URL#>/mydomainchecker.php
 */
function ispapidomaincheck_clientarea($vars)
{
    //save the language in the session if not already set
    if (!isset($_SESSION["Language"])) {
        $language_array = Helper::SQLCall("SELECT value FROM tblconfiguration WHERE setting='Language'", array(), "fetch");
        $_SESSION["Language"] = strtolower($language_array["value"]);
    }

    return array(
            'pagetitle' => $_LANG['domaintitle'],
            'breadcrumb' => array('index.php?m=ispapidomaincheck'=>$_LANG["domaintitle"]),
            'templatefile' => 'ispapidomaincheck',
            'requirelogin' => false,
            'vars' => array(
                    'categories' => Helper::SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall"),
                    'startsequence' => 4,
                    'modulename' => "ispapidomaincheck",
                    'modulepath' => "modules/addons/ispapidomaincheck/",
                    'backorder_module_installed' => (file_exists(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","addons","ispapibackorder","backend","api.php")))) ? true : false,
                    'backorder_module_path' => "modules/addons/ispapibackorder/",
                    'path_to_domain_file' => "modules/addons/ispapidomaincheck/domain.php",
                    'domain' => isset($_POST["domain"]) ? $_POST["domain"] : "",
                    'currency' => $_SESSION["currency"]
            ),
    );
}


/*
 * Backend module
 */
function ispapidomaincheck_output($vars)
{
    if (!isset($_GET["tab"])) {
        $_GET["tab"] = 0;
    }
    $modulelink = $vars['modulelink'];

    echo'
	<style>

	.tablebg td.fieldlabel {
	    background-color:#FFFFFF;
	    text-align: right;
	}

	.tablebg td.fieldarea {
	    background-color:#F3F3F3;
	    text-align: left;
	}

	.tab-content {
		border-left: 1px solid #ccc;
		border-right: 1px solid #ccc;
		border-bottom: 1px solid #ccc;
		padding:10px;
	}

	div.tablebg {
		margin:0px;
	}

	div.infobox{
		margin:0px;
		margin-bottom:10px;
	}

	</style>

	<div id="tabs">
		<ul class="nav nav-tabs admin-tabs" role="tablist">
			<li id="tab0" class="tab active" data-toggle="tab" role="tab" aria-expanded="true">
				<a href="javascript:;">Category Editor</a>
			</li>
		</ul>
	</div>
	';

    ispapidomaincheck_categoryeditorcontent($modulelink."&tab=0");
}

function ispapidomaincheck_categoryeditorcontent($modulelink)
{

    include(implode(DIRECTORY_SEPARATOR, array(dirname(__FILE__),"categories.php")));

    echo '<div id="tab0box" class="tabbox tab-content">';

    //delete category
    if (isset($_REQUEST["delete"])) {
        $currency_array = Helper::SQLCall("DELETE FROM ispapi_tblcategories WHERE id=? LIMIT 1", array($_REQUEST["delete"]), "execute");
        echo '<div class="infobox"><strong><span class="title">Successfully deleted!</span></strong><br>The category has been deleted.</div>';
    }

    //import default categories
    if (isset($_REQUEST["importdefaultcategories"])) {
        $category_not_found_in_categorieslib = array();
        $data = Helper::SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");
        if (empty($data)) {
            foreach ($categorieslib as $category => $tlds) {
                $insert_stmt = Helper::SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($category, implode(" ", $tlds)), "execute");
            }
        } else {
            foreach ($categorieslib as $key => $value) {
                in_array_r($key, $data) ? '' : $category_not_found_in_categorieslib[$key] = $value;
            }
            if (!empty($category_not_found_in_categorieslib)) {
                foreach ($category_not_found_in_categorieslib as $category => $tlds) {
                    Helper::SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($category, implode(" ", $tlds)), "execute");
                }
            }
        }
        echo '<div class="infobox"><strong><span class="title">Successfully imported!</span></strong><br>The categories have been sucessfully imported.</div>';
    }

    //save changes
    if (isset($_REQUEST["savecategories"])) {
        //update the category and tlds
        foreach ($_POST["CAT"] as $id => $category) {
            Helper::SQLCall("UPDATE ispapi_tblcategories SET name=?, tlds=? WHERE id=?", array($category['NAME'], $category['TLDS'], $id), "execute");
        }
        //insert when added new category
        if ($_POST['NEWCAT']['NAME']) {
            Helper::SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($_POST["NEWCAT"]["NAME"], $_POST["NEWCAT"]["TLDS"]), "execute");
        }
        echo '<div class="infobox"><strong><span class="title">Successfully saved!</span></strong><br>The changes have been saved.</div>';
    }


    //import default categories button
    echo '<form action="'.$modulelink.'" method="post">';
    echo '<input style="margin-top:5px;" class="btn btn-danger" name="importdefaultcategories" type="submit" value="Import Default Categories">';
    echo '</form>';
    echo "<br>";

    ###############################################################################

    //get all categories with tlds for displaying
    $categories = Helper::SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");

    echo '<form action="'.$modulelink.'" method="post">';
    echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%"><tbody>';
    echo '<tr><th>Category Name</th>';
    echo '<th>TLDs <span style="font-weight:100;">(space separated list of TLDs)</span></th>';
    echo '<th width="20"></th></tr>';
    foreach ($categories as $cat) {
        echo '<tr><td width="220" valign="top"><input style="width:210px;font-weight:bold" type="text" name="CAT['.$cat["id"].'][NAME]" value="'.$cat["name"].'"/></td><td><textarea style="width:100%;height:70px;" type="text" name="CAT['.$cat["id"].'][TLDS]" value="'.$cat["tlds"].'">'.$cat["tlds"].'</textarea></td><td width="20"><a href="'.$modulelink."&delete=".$cat["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
    }
    echo '<tr><td><input style="width:210px;" type="text" name="NEWCAT[NAME]" value=""/></td><td><textarea style="width:100%;" type="text" name="NEWCAT[TLDS]" value=""></textarea></td><td></td></tr>';
    echo '</tbody></table></div>';
    echo '<p align="center"><input class="btn" name="savecategories" type="submit" value="Save Changes">';
    // echo '<input style="margin-left:10px;" class="btn" name="importdefaultcategories" type="submit" value="import default categories"></p>';
    echo '</form>';

    echo '</div>';
}

/*
 * Helper to import default categories
 */
function in_array_r($key, $dataarray, $strict = false)
{
    foreach ($dataarray as $item) {
        if (($strict ? $item === $key : $item == $key) || (is_array($item) && in_array_r($key, $item, $strict))) {
            return true;
        }
    }
    return false;
}
