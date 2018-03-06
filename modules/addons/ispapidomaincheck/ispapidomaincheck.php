<?php
use WHMCS\Database\Capsule;
$module_version = "7.3";
$configarray = array();
/*
 * Configuration of the addon module.
 */
function ispapidomaincheck_config() {
	global $module_version;
    $configarray = array(
	    "name" => "ISPAPI High Performance DomainChecker",
	    "description" => "This addon provides a new domainchecker interface with high speed checks and premium support.",
	    "version" => $module_version,
	    "author" => "HEXONET",
	    "language" => "english",
		"fields" => array(
			"suggestion_mode" => array ("FriendlyName" => "Mode", "Type" => "radio",'Options' => 'Suggestions,Normal','Description' => 'Choose your option!',)),
	);
    return $configarray;
}

/*
 * This function will be called with the activation of the add-on module.
 */
function ispapidomaincheck_activate() {
	//IF NOT EXISTS Create ispapi_tblcategories table
	try {
	    $pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("CREATE TABLE IF NOT EXISTS ispapi_tblcategories (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, name TEXT, tlds TEXT)");
		$query->execute();
		//Insert example categories if table empty (just the first time)
		$query = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
		$query->execute();
		$data = $query->fetchAll(PDO::FETCH_ASSOC);

		if ( empty($data) ) {
			$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories(name, tlds) VALUES ('Popular', 'com diamonds domains email guru land sexy tattoo singles'), ('Business', 'camera company computer enterprises equipment holdings management solutions support'), ('Europe', 'fr de it nl lu')");
			$insert_stmt->execute();
		}
	} catch (\Exception $e) {
        die($e->getMessage());
    }

    return array('status'=>'success','description'=>'The ISPAPI Domaincheck Addon was successfully installed.');
}
//to update existing database on new version installation
function ispapidomaincheck_upgrade($vars) {
	$version = $vars['version'];
	try {
	    $pdo = Capsule::connection()->getPdo();

		if($version < 7.3) {
			// 1. DROP ispapi_tblaftermarketcurrencies if exists
			$query = $pdo->prepare("DROP TABLE IF EXISTS ispapi_tblaftermarketcurrencies");
		   	$query->execute();
			//2. DROP ispapi_tblsettings if exists
			$query = $pdo->prepare("DROP TABLE IF EXISTS ispapi_tblsettings");
			$query->execute();
			// 3. ALTER ispapi_tblcategories if exists
			$query = $pdo->prepare("ALTER TABLE ispapi_tblcategories DROP COLUMN parent");
			$query->execute();
			// This one deletes the row and does not complain if it can't.
			$query = $pdo->prepare("DELETE IGNORE FROM ispapi_tblcategories WHERE tlds=''");
			$query->execute();
		}
	} catch (\Exception $e) {
        die($e->getMessage());
    }
}

/*
 * This function will be called with the deactivation of the add-on module.
*/
function ispapidomaincheck_deactivate() {
	// Remove ispapi_tblcategories DB table
	//$query = "DROP TABLE ispapi_tblcategories;";
	//$result = full_query($query);

	// Remove ispapi_tblsettings DB table
	try {
		$pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("DROP TABLE ispapi_tblsettings");
		$query->execute();
	} catch (\Exception $e) {
		die($e->getMessage());
	}
	//For easier updates, the tables won't be dropped.

    return array('status'=>'success','description'=>'The ISPAPI Domaincheck Addon was successfully uninstalled.');
}

/*
 * This function ist the startpoint of the add-on module
 * <#WHMCS_URL#>/index.php?m=ispapidomaincheck
 * <#WHMCS_URL#>/mydomainchecker.php
 */
function ispapidomaincheck_clientarea($vars) {
	//suggestion mode - for the domain.php file
	if($vars['suggestion_mode'] == 'Suggestions'){
		$_SESSION["suggestion_mode"] = 'on';
	}else{
		$_SESSION["suggestion_mode"] = '';
	}
	//for transfer
	//###############
	if (isset($_REQUEST["transfer"])) {
		if ($_REQUEST["domain"] != $_LANG["domaincheckerdomainexample"]) {
			$parts = explode(".", $_REQUEST["domain"], 2);
			if(isset($parts[0]) && isset($parts[1])){
				redir( "a=add&domain=transfer&sld=" . $parts[0] . "&tld=." . $parts[1], "cart.php" );
			}else{
				redir( "a=add&domain=transfer", "cart.php" );
			}
		}
		else {
			redir( "a=add&domain=transfer", "cart.php" );
		}
	}
	//###############

	//for hosting
	//###############
	if (isset($_REQUEST["hosting"])) {
		if ($_REQUEST["domain"] != $_LANG["domaincheckerdomainexample"]) {
			$parts = explode(".", $_REQUEST["domain"], 2);
			if(isset($parts[0]) && isset($parts[1])){
				redir( "sld=" . $parts[0] . "&tld=." . $parts[1], "cart.php" );
			}else{
				redir( "", "cart.php" );
			}
		}
		else {
			redir( "", "cart.php" );
		}
	}
	//###############

	require_once(dirname(__FILE__)."/../../../includes/registrarfunctions.php");
	if(!isset($_SESSION["Language"])){
		try {
		    $pdo = Capsule::connection()->getPdo();
			$query = $pdo->prepare("SELECT value FROM tblconfiguration WHERE setting='Language'");
			$query->execute();
			$data = $query->fetch(PDO::FETCH_ASSOC);
			if($data){
				$language = $data["value"];
			}
			$_SESSION["Language"] = strtolower($language);
		} catch (\Exception $e) {
		    die($e->getMessage());
		}
	}
	require(dirname(__FILE__)."/../../../lang/".$_SESSION["Language"].".php");

	//Check if the ISPAPI Registrar Module available, load it, raise error if not existing
	//ISPAPI DomainChecker require the ISPAPI Registrar Module
	$error = false;
	$modulelist = array();
	if(file_exists(dirname(__FILE__)."/../../../modules/registrars/ispapi/ispapi.php")){
		$file = "ispapi";
		require_once(dirname(__FILE__)."/../../../modules/registrars/".$file."/".$file.".php");
		$funcname = $file.'_GetISPAPIModuleVersion';
		if(function_exists($file.'_GetISPAPIModuleVersion')){

			$version = call_user_func($file.'_GetISPAPIModuleVersion');
			//check if version = 1.0.15 or higher
			if( version_compare($version, '1.0.15') >= 0 ){
				//check authentication
				$registrarconfigoptions = getregistrarconfigoptions($file);
				$ispapi_config = ispapi_config($registrarconfigoptions);
				$command =  $command = array(
						"command" => "CheckAuthentication",
						"subuser" => $ispapi_config["login"],
						"password" => $ispapi_config["password"],
				);
				$checkAuthentication = ispapi_call($command, $ispapi_config);
				if($checkAuthentication["CODE"] != "200"){
					die("The \"".$file."\" registrar authentication failed! Please verify your registrar credentials and try again.");
				}else{
					array_push($modulelist, $file);
				}
			}else{
				$error = true;
			}
		}else{
			$error = true;
		}
	}else{
		$error = true;
	}

	if($error){
		die("The ISPAPI DomainCheck Module requires ISPAPI Registrar Module v1.0.15 or higher!");
	}


	//Get the list of all used registrar modules
	try {
	    $pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("SELECT extension, autoreg FROM tbldomainpricing");
		$query->execute();
		$data = $query->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
			if(!empty($value["autoreg"])){
				if(!in_array($value["autoreg"], $modulelist)){
					array_push($modulelist, $value["autoreg"]);
				}
			}
		}

	} catch (\Exception $e) {
        die($e->getMessage());
    }

	//filter the whole list to catch only the HEXONET registars
	foreach($modulelist as $file){
		if(file_exists(dirname(__FILE__)."/../../../modules/registrars/".$file."/".$file.".php")){
			require_once(dirname(__FILE__)."/../../../modules/registrars/".$file."/".$file.".php");
			$funcname = $file.'_GetISPAPIModuleVersion';
			if(function_exists($file.'_GetISPAPIModuleVersion')){

				$version = call_user_func($file.'_GetISPAPIModuleVersion');
				//check if version = 1.0.15 or higher
				if( version_compare($version, '1.0.15') >= 0 ){
					array_push($registrar, $file);
					//check authentication
					$registrarconfigoptions = getregistrarconfigoptions($file);
					$ispapi_config = ispapi_config($registrarconfigoptions);
					$command =  $command = array(
							"command" => "CheckAuthentication",
							"subuser" => $ispapi_config["login"],
							"password" => $ispapi_config["password"],
					);
					$checkAuthentication = ispapi_call($command, $ispapi_config);
					if($checkAuthentication["CODE"] != "200"){
						die("The \"".$file."\" registrar authentication failed! Please verify your registrar credentials and try again.");
					}
				}else{
					die("The ISPAPI DomainCheck Module requires \"".$file."\" Registrar Module v1.0.15 or higher!");
				}
			}
		}
	}

	//for the domain.php file
	$_SESSION["ispapi_registrar"] = $registrar;

	//Set currency session if not set.
	if ( !$_SESSION["currency"] ) {
		try {
		    $pdo = Capsule::connection()->getPdo();
			$query = $pdo->prepare("SELECT id FROM tblcurrencies WHERE `default`='1'");
			$query->execute();
			$data = $query->fetch(PDO::FETCH_ASSOC);
			$_SESSION["currency"] = $data["id"];
		} catch (\Exception $e) {
	        die($e->getMessage());
	    }
	}

	//set the domain with the post data if filled
	if(isset($_POST["domain"]))
		$domain = $_POST["domain"];
	else
		$domain = "";

	//empty the cache on all reload
	if(isset($_SESSION["cache"])){
		unset($_SESSION["cache"]);
	}

	//get the module name
	//$parts = Explode("/", __FILE__);
	//$parts = Explode(".", $parts[count($parts) - 1]);
	//$modulename = $parts[0];
	$modulename = "ispapidomaincheck";
	$path_to_domain_file = "modules/addons/".$modulename."/domain.php";
	$modulepath = "modules/addons/".$modulename."/";

	//check if backordermodule is installed and set the backorder module path
	$backordermoduleinstalled = (file_exists(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/api.php")) ? true : false;
	$backordermodulepath = "modules/addons/ispapibackorder/";

	//get all categories with subgategories for the template
	$categories = array();
	try {
		$pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
		$query->execute();
		$data = $query->fetchAll(PDO::FETCH_ASSOC);
		if($data){
			array_push($categories, $data);
		}

	} catch (\Exception $e) {
		die($e->getMessage());
	}

	$prices = ispapi_domainchecker_get_domainprices ($_SESSION["currency"]);
	$tldpricelist = ispapi_domainchecker_tldpricelist( $prices, $_SESSION["currency"] ); //TODO - $tldpricelist is given to tpl file -for this variable data, used the help functions listed in this file

	$_SESSION["adminuser"] = $vars["username"];
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
					'tldpricelist' => $tldpricelist,
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
	<script>
	$( document ).ready(function() {

		$(".tabbox").css("display","none");
			var selectedTab;
			$(".tab").click(function(){
				var elid = $(this).attr("id");
				$(".tab").removeClass("tabselected");
				$("#"+elid).addClass("tabselected");
				if (elid != selectedTab) {
					$(".tabbox").slideUp();
					$("#"+elid+"box").slideDown();
					selectedTab = elid;
				}
			$("#tab").val(elid.substr(3));
		});

		selectedTab = "tab'.$_GET["tab"].'";
		$("#" + selectedTab).addClass("tabselected");
		$("#" + selectedTab + "box").css("display","");

	});
	</script>

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
			<li id="tab1" class="tab" data-toggle="tab" role="tab" aria-expanded="true">
				<a href="javascript:;">Category Editor</a>
			</li>
		</ul>
	</div>

	';

	ispapidomaincheck_categoryeditorcontent($modulelink."&tab=1");
}

function ispapidomaincheck_categoryeditorcontent($modulelink){

	include(dirname(__FILE__)."/categorieslib.php");

	echo '<div id="tab1box" class="tabbox tab-content">';

	//Delete categories
	###############################################################################
	if(isset($_REQUEST["delete"])){
		try {
		    $pdo = Capsule::connection()->getPdo();
			$query = $pdo->prepare("DELETE FROM ispapi_tblcategories WHERE id=?");
			$query->execute(array($_REQUEST["delete"]));

		} catch (\Exception $e) {
	        die($e->getMessage());
	    }
		echo '<div class="infobox"><strong><span class="title">Deletion Successfully!</span></strong><br>Your category has been deleted.</div>';
	}
	###############################################################################

	//Import Default categories
	###############################################################################
	if(isset($_REQUEST["importdefaultcategories"])){
		$category_not_found_in_categorieslib = array();
		try{
        	$pdo = Capsule::connection()->getPdo();
			$request = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
			$request->execute();
			$data = $request->fetchAll(PDO::FETCH_ASSOC);
			if(empty($data)){
				foreach ($categorieslib as $category => $tlds) {
					$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)");
					$insert_stmt->execute(array( $category, implode(" ", $tlds)));
				}
			}else{
				foreach ($categorieslib as $key => $value) {
					in_array_r($key, $data) ? '' : $category_not_found_in_categorieslib[$key] = $value;
				}
				if(!empty($category_not_found_in_categorieslib)){
					foreach ($category_not_found_in_categorieslib as $category => $tlds) {
						$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)");
						$insert_stmt->execute(array( $category, implode(" ", $tlds)));
					}
				}
			}
        } catch (Exception $e) {
        	die($e->getMessage());
        }
		// echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################
	//Save categories
	###############################################################################
	if(isset($_REQUEST["savecategories"])){
		try {
	    	$pdo = Capsule::connection()->getPdo();
			//update the category and tlds
			foreach($_POST["CAT"] as $id => $category){
				$update_query = $pdo->prepare("UPDATE ispapi_tblcategories SET name=?, tlds=? WHERE id=?");
				$update_query->execute(array($category['NAME'], $category['TLDS'], $id));
			}
			//insert when added new category
			if($_POST['NEWCAT']['NAME']){
				$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories (name, tlds) VALUES (?, ?)");
				$insert_stmt->execute(array( $_POST["NEWCAT"]["NAME"], $_POST["NEWCAT"]["TLDS"]));
			}
		} catch (\Exception $e) {
			die($e->getMessage());
		}
		echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################

	//get all categories with tlds for displaying
	###############################################################################
	$categories = array();
	try {
	    $pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
		$query->execute();
		$data = $query->fetchAll(PDO::FETCH_ASSOC);
		if($data){
			array_push($categories, $data);
		}

	} catch (\Exception $e) {
        die($e->getMessage());
    }
	###############################################################################

	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%"><tbody>';
	echo '<tr><th>Categories</th>';
	echo '<th>TLDs</th>';
	echo '<th width="20"></th></tr>';
	foreach($categories as $category){
		foreach ($category as $cat) {
			echo '<tr><td width="220"><input style="width:210px;font-weight:bold" type="text" name="CAT['.$cat["id"].'][NAME]" value="'.$cat["name"].'"/></td><td><input style="width:650px;" type="text" name="CAT['.$cat["id"].'][TLDS]" value="'.$cat["tlds"].'"/></td><td width="20"><a href="'.$modulelink."&delete=".$cat["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
		}
	}
	echo '<tr><td><input style="width:210px;" type="text" name="NEWCAT[NAME]" value=""/></td><td><input style="width:650px;" type="text" name="NEWCAT[TLDS]" value=""/></td><td></td></tr>';
	echo '</tbody></table></div>';
	echo '<p align="center"><input class="btn" name="savecategories" type="submit" value="Save Changes">';
	echo '<input style="margin-left:10px;" class="btn" name="importdefaultcategories" type="submit" value="import default categories"></p>';
	echo '</form>';

	echo '</div>';
}

//import default categories helper
function in_array_r($key, $dataarray, $strict = false) {
    foreach ($dataarray as $item) {
        if (($strict ? $item === $key : $item == $key) || (is_array($item) && in_array_r($key, $item, $strict))) {
            return true;
        }
    }

    return false;
}

//domain pricing helpers
//#######################################
function ispapi_domainchecker_price( $number, $cur ) {

	$format = $cur["format"];
	if ( $format == 1 ) {
		$number = number_format($number, 2, '.', '');
	}
	if ( $format == 2 ) {
		$number = number_format($number, 2, '.', ',');
	}
	if ( $format == 3 ) {
		$number = number_format($number, 2, ',', '.');
	}
	if ( $format == 4 ) {
		$number = preg_replace('/\.?0+$/', '', number_format($number, 2, '.', ','));
	}
	return $cur["prefix"].$number.$cur["suffix"];
}

function ispapi_domainchecker_tldpricelist( $prices, $currencyid ) {

	try {
	    $pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("SELECT * FROM tblcurrencies WHERE id=?");
		$query->execute(array($currencyid));
		$cur = $query->fetch(PDO::FETCH_ASSOC);
	} catch (\Exception $e) {
        die($e->getMessage());
    }
	$list = array();
	$i = 1;

	foreach ( $prices as $tld => $values ) {
		$item = array();
		$item['tld'] = $tld;

		$keys = array_keys($values["domainregister"]);
		if ( count($keys) ) {
			$item['period'] = $keys[0];
			$item['register'] = ispapi_domainchecker_price($values["domainregister"][$keys[0]], $cur);
		}

		$keys = array_keys($values["domaintransfer"]);

		if ( count($keys) ) {
			if($keys[0] != 1){
				$item['transfer'] = "";
			}else{
				$item['transfer'] = ispapi_domainchecker_price($values["domaintransfer"][$keys[0]], $cur);
			}
		}

		$keys = (is_array($values["domainrenew"]))? array_keys($values["domainrenew"]) : array();
		if ( count($keys) ) {
			if($keys[0] != 1){
				$item['renew'] = "";
			}else{
				$item['renew'] = ispapi_domainchecker_price($values["domainrenew"][$keys[0]], $cur);
			}
		}

		$list[$i++] = $item;
	}
	return $list;
}

function ispapi_domainchecker_tldslist( $prices ) {
	$tlds = array();
	$i = 1;
	foreach ( $prices as $tld => $values ) {
		$tlds[$i++] = $tld;
	}
	return $tlds;
}

function ispapi_domainchecker_get_domainprices ( $currencyid ) {
	try {
	    $pdo = Capsule::connection()->getPdo();
		$query = $pdo->prepare("SELECT tdp.extension, tp.type, msetupfee year1, qsetupfee year2, ssetupfee year3, asetupfee year4, bsetupfee year5, monthly year6, quarterly year7, semiannually year8, annually year9, biennially year10
				FROM tbldomainpricing tdp, tblpricing tp
				WHERE tp.relid = tdp.id
				AND tp.tsetupfee = 0
				AND tp.currency=?
				ORDER BY tdp.order");
		$query->execute(array($currencyid));
		$row = $query->fetchAll(PDO::FETCH_ASSOC);

		foreach ($row as $key => $value) {
			for ( $i = 1; $i <= 10; $i++ ) {
				if (($value['year'.$i] > 0) && ($value['type'] != 'domaintransfer')) $domainprices[$value['extension']][$value['type']][$i] = $value['year'.$i];
				if (($value['year'.$i] >= 0) && ($value['type'] == 'domaintransfer')) $domainprices[$value['extension']][$value['type']][$i] = $value['year'.$i];
			}
		}
	} catch (\Exception $e) {
        die($e->getMessage());
    }

	foreach ( $domainprices as $tld => $values ) {
		if ( !isset($values['domainregister']) ) {
			unset($domainprices[$tld]);
		}
	}

	return $domainprices;
}
//#######################################
