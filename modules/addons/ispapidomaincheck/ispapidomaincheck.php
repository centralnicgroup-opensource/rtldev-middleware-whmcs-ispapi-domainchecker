<?php
use WHMCS\Database\Capsule;
$module_version = "7.3.0";


/*
 * Configuration of the addon module.
 */
function ispapidomaincheck_config() {
	global $module_version;
    $configarray = array(
	    "name" => "ISPAPI HP DomainChecker",
	    "description" => "This addon provides a new domainchecker interface with high speed checks, suggestions and premium support.",
	    "version" => $module_version,
	    "author" => "HEXONET",
	    "language" => "english",
		"fields" => array(
			"domainchecker_mode" => array ("FriendlyName" => "Domainchecker Mode", "Type" => "dropdown", 'Options' => 'Suggestions,Regular')
		),
	);
    return $configarray;
}

/*
 * This function will be called with the activation of the add-on module.
 */
function ispapidomaincheck_activate() {
	try {
	    $pdo = Capsule::connection()->getPdo();

		//IF NOT EXISTS Create ispapi_tblcategories table
		$query = $pdo->prepare("CREATE TABLE IF NOT EXISTS ispapi_tblcategories (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, name TEXT, tlds TEXT)");
		$query->execute();

		//TODO TULSI: import the default categories when empty
		//Insert example categories if table empty (just the first time)
		// $query = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
		// $query->execute();
		// $data = $query->fetchAll(PDO::FETCH_ASSOC);
		//
		// if ( empty($data) ) {
		// 	$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories(name, tlds) VALUES ('Popular', 'com diamonds domains email guru land sexy tattoo singles'), ('Business', 'camera company computer enterprises equipment holdings management solutions support'), ('Europe', 'fr de it nl lu')");
		// 	$insert_stmt->execute();
		// }
	} catch (\Exception $e) {
		return array('status'=>'error', 'description'=>$e->getMessage());
    }
    return array('status'=>'success', 'description'=>'The ISPAPI HP DomainChecker was successfully installed.');
}

/*
 * This function will update the database when upgrading.
*/
function ispapidomaincheck_upgrade($vars) {
	$version = $vars['version'];
	try {
	    $pdo = Capsule::connection()->getPdo();

		//TODO TULSI: $version is = 7.3.0 but you said it is only working with 7.3 so please cut the everything after the last point

		if($version < 7.3) {
			// 1. DROP ispapi_tblaftermarketcurrencies if exists
			$query = $pdo->prepare("DROP TABLE IF EXISTS ispapi_tblaftermarketcurrencies");
		   	$query->execute();
			// 2. DROP ispapi_tblsettings if exists
			$query = $pdo->prepare("DROP TABLE IF EXISTS ispapi_tblsettings");
			$query->execute();
			// 3. ALTER ispapi_tblcategories
			$query = $pdo->prepare("ALTER TABLE ispapi_tblcategories DROP COLUMN parent");
			$query->execute();
			// This one deletes the row and does not complain if it can't.
			$query = $pdo->prepare("DELETE IGNORE FROM ispapi_tblcategories WHERE tlds=''");
			$query->execute();
		}
	} catch (\Exception $e) {
		return array('status'=>'error', 'description'=>$e->getMessage());
    }
    return array('status'=>'success', 'description'=>'The ISPAPI HP DomainChecker was successfully upgraded.');
}

/*
 * This function will be called with the deactivation of the add-on module.
*/
function ispapidomaincheck_deactivate() {
	//NOTHING TO DO
    return array('status'=>'success','description'=>'The ISPAPI HP DomainChecker was successfully uninstalled.');
}

/*
 * This function is the startpoint of the add-on module
 * <#WHMCS_URL#>/index.php?m=ispapidomaincheck
 * <#WHMCS_URL#>/mydomainchecker.php
 */
function ispapidomaincheck_clientarea($vars) {

	//include registrarfunctions file from WHMCS
	require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");

	//save the language in the session if not already set
	if(!isset($_SESSION["Language"])){
		$language_array = SQLCall("SELECT value FROM tblconfiguration WHERE setting='Language'", array());
		$_SESSION["Language"] = strtolower($language_array["value"]);
	}

	// //include the WHMCS language file
	// require(dirname(__FILE__)."/../../../lang/".$_SESSION["Language"].".php");

	// //include the module language files
	// $file_backorder = getcwd()."/modules/addons/ispapidomaincheck/lang/".$_SESSION["Language".".php";
	// if ( file_exists($file_backorder) ) {
	// 	include($file_backorder);
	// }

	//TODO: Anthony: check if we can refactor those checks in an external php classe
	//ISPAPI DomainChecker require the ISPAPI Registrar Module, check if at least one HEXONET Registrar Module available.
	$_SESSION["ispapi_registrar"] = array(); //this needs to be done to reload the registrars in the domain.php
	$registrars = SQLCall("SELECT extension, autoreg FROM tbldomainpricing GROUP BY autoreg", array(), "fetchall");
	foreach($registrars as $registrar){
		addRegistrar($registrar["autoreg"], $_SESSION["ispapi_registrar"]);
	}
	//if no TLD configured with HEXONET then try to add hexonet and ispapi
	if( empty($_SESSION["ispapi_registrar"]) ){
		addRegistrar("hexonet", $_SESSION["ispapi_registrar"]);
		addRegistrar("ispapi", $_SESSION["ispapi_registrar"]);
	}
	if( empty($_SESSION["ispapi_registrar"]) ){
		die("The ISPAPI HP DomainCheck Module requires HEXONET/ISPAPI Registrar Module v1.0.53 or higher!");
	}

	//Set currency session if not set.
	if ( !$_SESSION["currency"] ) {
		$currency_array = SQLCall("SELECT id FROM tblcurrencies WHERE `default` = 1 LIMIT 1", array());
		$_SESSION["currency"] = $currency_array["id"];
	}

	//set the domain with the post data if filled
	$domain = isset($_POST["domain"]) ? $_POST["domain"] : "";

	//get the module name
	$modulename = "ispapidomaincheck";
	$path_to_domain_file = "modules/addons/".$modulename."/domain.php";
	$modulepath = "modules/addons/".$modulename."/";

	//check if backordermodule is installed and set the backorder module path
	$backordermoduleinstalled = (file_exists(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php")) ? true : false;
	$backordermodulepath = "modules/addons/ispapibackorder/";

	//get all categories
	$categories = SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");

	return array(
			'pagetitle' => $_LANG['domaintitle'],
			'breadcrumb' => array('index.php?m=ispapidomaincheck'=>$_LANG["domaintitle"]),
			'templatefile' => 'ispapidomaincheck',
			'requirelogin' => false,
			'vars' => array(
					'categories' => $categories,
					'startsequence' => 4,
					'modulename' => $modulename,
					'modulepath' => $modulepath,
					'backorder_module_installed' => $backordermoduleinstalled,
					'backorder_module_path' => $backordermodulepath,
					'path_to_domain_file' => $path_to_domain_file,
					'domain' => $domain,
					'currency' => $_SESSION["currency"]
			),
	);
}


/*
 * Backend module
 */
function ispapidomaincheck_output($vars) {
	if(!isset($_GET["tab"])){
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

function ispapidomaincheck_categoryeditorcontent($modulelink){

	include(dirname(__FILE__)."/categories.php");

	echo '<div id="tab0box" class="tabbox tab-content">';

	//delete category
	if(isset($_REQUEST["delete"])){
		$currency_array = SQLCall("DELETE FROM ispapi_tblcategories WHERE id=? LIMIT 1", array($_REQUEST["delete"]), "execute");
		echo '<div class="infobox"><strong><span class="title">Successfully deleted!</span></strong><br>The category has been deleted.</div>';
	}

	//import default categories
	if(isset($_REQUEST["importdefaultcategories"])){
		$category_not_found_in_categorieslib = array();
		$data = SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");
		if(empty($data)){
			foreach ($categorieslib as $category => $tlds) {
				$insert_stmt = SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($category, implode(" ", $tlds)), "execute");
			}
		}else{
			foreach ($categorieslib as $key => $value) {
				in_array_r($key, $data) ? '' : $category_not_found_in_categorieslib[$key] = $value;
			}
			if(!empty($category_not_found_in_categorieslib)){
				foreach ($category_not_found_in_categorieslib as $category => $tlds) {
					SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($category, implode(" ", $tlds)), "execute");
				}
			}
		}
		echo '<div class="infobox"><strong><span class="title">Successfully imported!</span></strong><br>The categories have been sucessfully imported.</div>';
	}

	//save changes
	if(isset($_REQUEST["savecategories"])){
		//update the category and tlds
		foreach($_POST["CAT"] as $id => $category){
			SQLCall("UPDATE ispapi_tblcategories SET name=?, tlds=? WHERE id=?", array($category['NAME'], $category['TLDS'], $id), "execute");
		}
		//insert when added new category
		if($_POST['NEWCAT']['NAME']){
			SQLCall("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)", array($_POST["NEWCAT"]["NAME"], $_POST["NEWCAT"]["TLDS"]), "execute");
		}
		echo '<div class="infobox"><strong><span class="title">Successfully saved!</span></strong><br>The changes have been saved.</div>';
	}
	###############################################################################

	//get all categories with tlds for displaying
	$categories = SQLCall("SELECT * FROM ispapi_tblcategories", array(), "fetchall");

	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%"><tbody>';
	echo '<tr><th>Categories</th>';
	echo '<th>TLDs</th>';
	echo '<th width="20"></th></tr>';
	foreach($categories as $cat){
		echo '<tr><td width="220"><input style="width:210px;font-weight:bold" type="text" name="CAT['.$cat["id"].'][NAME]" value="'.$cat["name"].'"/></td><td><input style="width:650px;" type="text" name="CAT['.$cat["id"].'][TLDS]" value="'.$cat["tlds"].'"/></td><td width="20"><a href="'.$modulelink."&delete=".$cat["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
	}
	echo '<tr><td><input style="width:210px;" type="text" name="NEWCAT[NAME]" value=""/></td><td><input style="width:650px;" type="text" name="NEWCAT[TLDS]" value=""/></td><td></td></tr>';
	echo '</tbody></table></div>';
	echo '<p align="center"><input class="btn" name="savecategories" type="submit" value="Save Changes">';
	echo '<input style="margin-left:10px;" class="btn" name="importdefaultcategories" type="submit" value="import default categories"></p>';
	echo '</form>';

	echo '</div>';
}


/*
 * Helper to import default categories
 */
function in_array_r($key, $dataarray, $strict = false) {
    foreach ($dataarray as $item) {
        if (($strict ? $item === $key : $item == $key) || (is_array($item) && in_array_r($key, $item, $strict))) {
            return true;
        }
    }
    return false;
}

/*
 * Helper to send SQL call to the Database with Capsule
 */
function SQLCall($sql, $params, $fetchmode = "fetch"){
	try {
		$pdo = Capsule::connection()->getPdo();
		$stmt = $pdo->prepare($sql);
		$result = $stmt->execute($params);

		if($fetchmode == "fetch"){
			return $stmt->fetch(PDO::FETCH_ASSOC);
		}elseif($fetchmode == "fetchall"){
			return $stmt->fetchAll(PDO::FETCH_ASSOC);
		}elseif($fetchmode == "execute"){
			return $result;
		}else{
			return $result;
		}
	} catch (\Exception $e) {
		die($e->getMessage());
	}
}


/*
 * Adds the registrar to the array if:
 * - it is an HEXONET registrar module
 * - registrar module >= 1.0.53
 * - registrar module authentication successful
 */
function addRegistrar($registrar, &$myarray) {
	if(!empty($registrar) && !in_array($registrar, $myarray)){
		include_once(dirname(__FILE__)."/../../../modules/registrars/".$registrar."/".$registrar.".php");
		if(function_exists($registrar.'_GetISPAPIModuleVersion')){
			$registrar_module_version = call_user_func($registrar.'_GetISPAPIModuleVersion');
			//check if registrar module version >= 1.0.53
			if( version_compare($registrar_module_version, '1.0.53') >= 0 ){
				//check registrar module authentication
				$ispapi_config = ispapi_config(getregistrarconfigoptions($registrar));
				$command =  $command = array(
						"command" => "CheckAuthentication",
						"subuser" => $ispapi_config["login"],
						"password" => $ispapi_config["password"],
				);
				$checkAuthentication = ispapi_call($command, $ispapi_config);
				if($checkAuthentication["CODE"] == "200"){
					array_push($myarray, $registrar);
				}else{
					die("The \"".$registrar."\" Registrar Module authentication failed! Please verify your registrar credentials and try again.");
				}
			}else{
				die("The ISPAPI HP DomainCheck Module requires \"".$registrar."\" Registrar Module v1.0.53 or higher!");
			}
		}
	}
}
