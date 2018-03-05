<?php
use WHMCS\Database\Capsule;
$module_version = "7.3.0";

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
	    "language" => "english"
	);
    return $configarray;
}

/*
 * This function will be called with the activation of the add-on module.
 */
function ispapidomaincheck_activate() {

	//IF NOT EXISTS Create ispapi_tblcategories table
	$query = "CREATE TABLE IF NOT EXISTS ispapi_tblcategories (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, parent INT(10), name TEXT, tlds TEXT);";
	$result = full_query($query);

	//Insert example categories if table empty (just the first time)
	$result = mysql_query("SELECT * FROM ispapi_tblcategories");
	$data = mysql_fetch_array($result);
	if(empty($data)){
		$id = insert_query("ispapi_tblcategories",array("name" => "new TLDs"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Popular", "tlds" => "camera diamonds domains email guru land sexy tattoo singles"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Business", "tlds" => "camera company computer enterprises equipment holdings management solutions support"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Shopping & eCommerce", "tlds" => "bike camera clothing diamonds tatoo tips voyage"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Food & Drink", "tlds" => "kitchen menu tips today"));
		$id = insert_query("ispapi_tblcategories",array("name" => "generic TLDs"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Top 5", "tlds" => "com net org info biz"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Other", "tlds" => "aero mobi asia name pro xxx jobs tel"));
		$id = insert_query("ispapi_tblcategories",array("name" => "country code TLDs"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "Europe", "tlds" => "fr de it nl lu"));
		$id = insert_query("ispapi_tblcategories",array("name" => "Other"));
		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => "SALES (-20%)", "tlds" => "guru diamonds"));
	}

	//IF NOT EXISTS Create ispapi_tblsettings table
	$query = "CREATE TABLE IF NOT EXISTS ispapi_tblsettings (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, aftermarket_premium INT(10), registry_premium INT(10), normal_suggestion_mode INT(10), suggestion_mode INT(10));"; #,
	$result = full_query($query);

    return array('status'=>'success','description'=>'The ISPAPI Domaincheck Addon was successfully installed.');
}

/*
 * This function will be called with the deactivation of the add-on module.
*/
function ispapidomaincheck_deactivate() {
	// Remove ispapi_tblcategories DB table
	//$query = "DROP TABLE ispapi_tblcategories;";
	//$result = full_query($query);

	// Remove ispapi_tblsettings DB table
	$query = "DROP TABLE ispapi_tblsettings;";
	$result = full_query($query);

	//For easier updates, the tables won't be dropped.

    return array('status'=>'success','description'=>'The ISPAPI Domaincheck Addon was successfully uninstalled.');
}

/*
 * This function ist the startpoint of the add-on module
 * <#WHMCS_URL#>/index.php?m=ispapidomaincheck
 * <#WHMCS_URL#>/mydomainchecker.php
 */
function ispapidomaincheck_clientarea($vars) {
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
		$result = mysql_query("SELECT value FROM tblconfiguration WHERE setting='Language' ");
		while ($data = mysql_fetch_array($result)) {
			$language = $data["value"];
		}
		$_SESSION["Language"] = strtolower($language);
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
	$result = select_query("tbldomainpricing","extension,autoreg");
	$registrar = array();
	while($data = mysql_fetch_array($result)){
		if(!empty($data["autoreg"])){
			if(!in_array($data["autoreg"], $modulelist)){
				array_push($modulelist, $data["autoreg"]);
			}
		}
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
		$result = select_query("tblcurrencies","id", array("default" => 1), "", "", 1);
		$data = mysql_fetch_array($result);
		$_SESSION["currency"] = $data["id"];
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
	$result = mysql_query("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
	while ($data = mysql_fetch_array($result)) {
		$subcategories = array();
		// $result2 = select_query("ispapi_tblcategories","id,name,tlds", array("parent"=>$data["id"]));
		$result2 = select_query("ispapi_tblcategories","id,name,tlds", array("id"=>$data["id"]));
		while ($data2 = mysql_fetch_array($result2)) {
			array_push($subcategories, $data2);
		}
		$data["subcategories"] = $subcategories;
		array_push($categories, $data);
	}

	//get settings from the DB
	$result = mysql_query("SELECT * FROM ispapi_tblsettings LIMIT 1");
	$data = mysql_fetch_array($result);
	if(isset($data)){
		$show_aftermarket_premium_domains = $data["aftermarket_premium"];
	}else{
		$show_aftermarket_premium_domains = 0;
	}

	$prices = ispapi_domainchecker_get_domainprices ($_SESSION["currency"]);
	$tldpricelist = ispapi_domainchecker_tldpricelist( $prices, $_SESSION["currency"] );

	$_SESSION["adminuser"] = $vars["username"];
	return array(
			'pagetitle' => $_LANG['domaintitle'],
			'breadcrumb' => array('index.php?m=ispapidomaincheck'=>$_LANG["domaintitle"]),
			'templatefile' => 'ispapidomaincheck',
			'requirelogin' => false,
			'vars' => array(
					'categories' => $categories,
					'startsequence' => 4,
					'show_aftermarket_premium_domains' => $show_aftermarket_premium_domains,
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
			<li id="tab0" class="tab active" data-toggle="tab" role="tab" aria-expanded="true">
				<a href="javascript:;">General Settings</a>
			</li>
			<li id="tab1" class="tab" data-toggle="tab" role="tab" aria-expanded="true">
				<a href="javascript:;">Category Editor</a>
			</li>
		</ul>
	</div>

	';

	ispapidomaincheck_generalsettingscontent($modulelink."&tab=0");
	ispapidomaincheck_categoryeditorcontent($modulelink."&tab=1");
}


function ispapidomaincheck_generalsettingscontent($modulelink){

	echo '<div id="tab0box" class="tabbox tab-content">';

	//Save settings
	###############################################################################
	if(isset($_REQUEST["savegeneralsettings"])){
		$select = mysql_query("SELECT id FROM ispapi_tblsettings LIMIT 1");
		$data = mysql_fetch_array($select);
		if(!empty($data)){
			if($_REQUEST["suggestion_mode"] === "suggestions"){
				update_query( "ispapi_tblsettings", array("aftermarket_premium" => $_REQUEST["aftermarket_premium"], "registry_premium" => $_REQUEST["registry_premium"], "suggestion_mode" => "1", "normal_suggestion_mode" => '0'), array( "id" => $data["id"]) );
			}elseif($_REQUEST["suggestion_mode"] === "normalsuggestions"){
				update_query( "ispapi_tblsettings", array("aftermarket_premium" => $_REQUEST["aftermarket_premium"], "registry_premium" => $_REQUEST["registry_premium"], "normal_suggestion_mode" => "1", "suggestion_mode" => '0'), array( "id" => $data["id"]) );
			}
			else{
				update_query( "ispapi_tblsettings", array("aftermarket_premium" => $_REQUEST["aftermarket_premium"], "registry_premium" => $_REQUEST["registry_premium"]), array( "id" => $data["id"]) );
			}
		}else{
			if($_REQUEST["suggestion_mode"]  === "suggestions"){
				insert_query("ispapi_tblsettings",array("aftermarket_premium" => $_REQUEST["aftermarket_premium"],"registry_premium" => $_REQUEST["registry_premium"], "suggestion_mode" => "1", "normal_suggestion_mode" => "0"));
			}elseif($_REQUEST["suggestion_mode"] === "normalsuggestions"){
				insert_query("ispapi_tblsettings",array("aftermarket_premium" => $_REQUEST["aftermarket_premium"],"registry_premium" => $_REQUEST["registry_premium"], "normal_suggestion_mode" => "1", "suggestion_mode" => "0",));
			}
			else{
				insert_query("ispapi_tblsettings",array("aftermarket_premium" => $_REQUEST["aftermarket_premium"],"registry_premium" => $_REQUEST["registry_premium"]));
			}

		}
		echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################

	//get the data from the DB for displaying
	###############################################################################
	$select = mysql_query("SELECT * FROM ispapi_tblsettings LIMIT 1");
	$data = mysql_fetch_array($select);
	if(!empty($data)){
		$suggestion_mode = $data["suggestion_mode"];
		$normal_mode = $data["normal_suggestion_mode"];

	}
	###############################################################################


	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%" style="color:#333333;"><tbody>';
	echo '<tr><td colspan="2" style="font-size:14px;color:#111111;"><b>Domain Suggestion Mode</td></tr>';
	echo '<tr><td width="50%" class="fieldlabel"><b>suggestions</b></td><td class="fieldarea"><input type="radio" name="suggestion_mode" value="suggestions" '.(($suggestion_mode==1)?"checked":"").' ></td></tr>';
	echo '<tr><td width="50%" class="fieldlabel"><b>normal</b></td><td class="fieldarea"><input type="radio" id="radioButton" name="suggestion_mode"  value="normalsuggestions" '.(($normal_mode==1)?"checked":"").'></td></tr>';
	echo '</tbody></table></div>';
	echo '<p align="center"><input class="btn" name="savegeneralsettings" type="submit" value="Save Changes"></p>';
	echo '</form>';

	echo '</div>';

}

function ispapidomaincheck_categoryeditorcontent($modulelink){

	include(dirname(__FILE__)."/categorieslib.php");

	echo '<div id="tab1box" class="tabbox tab-content">';

	//Delete categories
	###############################################################################
	if(isset($_REQUEST["delete"])){
		mysql_query("DELETE FROM ispapi_tblcategories WHERE id='".mysql_real_escape_string($_REQUEST["delete"])."'");
		mysql_query("DELETE FROM ispapi_tblcategories WHERE parent='".mysql_real_escape_string($_REQUEST["delete"])."'");
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
					insert_query("ispapi_tblcategories",array("name" => $category, "tlds" => implode(" ", $tlds) ));
				}
			}else{
				foreach ($categorieslib as $key => $value) {
					in_array_r($key, $data) ? '' : $category_not_found_in_categorieslib[$key] = $value;
				}
				if(!empty($category_not_found_in_categorieslib)){
					foreach ($category_not_found_in_categorieslib as $category => $tlds) {
						insert_query("ispapi_tblcategories",array("name" => $category, "tlds" => implode(" ", $tlds) ));
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
		foreach($_POST["CAT"] as $id => $categorie){
			update_query( "ispapi_tblcategories", array( "name" => $categorie["NAME"], "tlds" => $categorie["TLDS"] ), array( "id" => $id) );
		}
		//added
		if($_POST["ADDSUBCAT"]['NAME']){
			try{
	        	$pdo = Capsule::connection()->getPdo();
				$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (NULL, ?, ?)");
				$insert_stmt->execute(array( $_POST["ADDSUBCAT"]["NAME"], $_POST["ADDSUBCAT"]["TLDS"]));
	        } catch (Exception $e) {
	        	die($e->getMessage());
	        }
			// insert_query("ispapi_tblcategories",array("parent" => "NULL", "name" => $_POST["ADDSUBCAT"]["NAME"], "tlds" => $_POST["ADDSUBCAT"]["TLDS"]));
		}

		// foreach($_POST["ADDSUBCAT"] as $id => $subcat){
		// 	if(!empty($subcat["NAME"])){
		// 		insert_query("ispapi_tblcategories",array("parent" => $id, "name" => $subcat["NAME"], "tlds" => $subcat["TLDS"]));
		// 	}
		// }

		// if(!empty($_POST["ADDCAT"]["NAME"])){
		// 	$id = insert_query("ispapi_tblcategories",array("name" => $_POST["ADDCAT"]["NAME"]));
		// 	if(!empty($_POST["ADDSUBCAT"]["NAME"])){
		// 		insert_query("ispapi_tblcategories",array( "parent" => $id, "name" => $_POST["ADDSUBCAT"]["NAME"], "tlds" => $_POST["ADDSUBCAT"]["TLDS"] ));
		// 	}
		// }
		echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################

	//get all categories with subgategories for displaying
	###############################################################################
	$categories = array();
	$result = mysql_query("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
	while ($data = mysql_fetch_array($result)) {
		$subcategories = array();
		$result2 = select_query("ispapi_tblcategories","id,name,tlds", array("id" => $data["id"] ));
		while ($data2 = mysql_fetch_array($result2)) {
			array_push($subcategories, $data2);
		}
		$data["subcategories"] = $subcategories;
		array_push($categories, $data);
	}
	###############################################################################

	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%"><tbody>';
	echo '<tr><th>Categories</th>';
	echo '<th>TLDs</th>';
	echo '<th width="20"></th></tr>';
	foreach($categories as $category){
		// echo '<tr><td colspan="2" style="background-color:#2162A3;"><input style="font-weight:bold;width:210px;" type="text" name="CAT['.$category["id"].'][NAME]" value="'.$category["name"].'"/></td><td width="20" style="background-color:#2162A3;"><a href="'.$modulelink."&delete=".$category["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
		foreach($category["subcategories"] as $subcategory){
			echo '<tr><td width="220"><input style="width:210px;font-weight:bold" type="text" name="CAT['.$subcategory["id"].'][NAME]" value="'.$subcategory["name"].'"/></td><td><input style="width:650px;" type="text" name="CAT['.$subcategory["id"].'][TLDS]" value="'.$subcategory["tlds"].'"/></td><td width="20"><a href="'.$modulelink."&delete=".$subcategory["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
		}
		// echo '<tr><td><input style="width:210px;" type="text" name="ADDSUBCAT['.$category["id"].'][NAME]" value=""/></td><td><input style="width:650px;" type="text" name="ADDSUBCAT['.$category["id"].'][TLDS]" value=""/></td><td></td></tr>';
	}
	// echo '<tr><td colspan="3" style="background-color:#2162A3;"><input style="font-weight:bold;width:210px;" type="text" name="ADDCAT[NAME]" value=""/> <span style="color:#fff;">(Fill to add a new category)</span></td></tr>';
	echo '<tr><td><input style="width:210px;" type="text" name="ADDSUBCAT[NAME]" value=""/></td><td><input style="width:650px;" type="text" name="ADDSUBCAT[TLDS]" value=""/></td><td></td></tr>';
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

	$sql = "SELECT * FROM tblcurrencies
			WHERE id='".mysql_real_escape_string($currencyid)."'
			LIMIT 1";
	$query = mysql_query ($sql);
	$cur = @mysql_fetch_array ($query, MYSQL_ASSOC);

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
	$sql = "SELECT tdp.extension, tp.type, msetupfee year1, qsetupfee year2, ssetupfee year3, asetupfee year4, bsetupfee year5, monthly year6, quarterly year7, semiannually year8, annually year9, biennially year10
			FROM tbldomainpricing tdp, tblpricing tp
			WHERE tp.relid = tdp.id
			AND tp.tsetupfee = 0
			AND tp.currency = '".mysql_real_escape_string($currencyid)."'
			ORDER BY tdp.order";
	$query = mysql_query ($sql);
	while ($row = @mysql_fetch_array ($query, MYSQL_ASSOC)) {
		for ( $i = 1; $i <= 10; $i++ ) {
			if (($row['year'.$i] > 0) && ($row['type'] != 'domaintransfer')) $domainprices[$row['extension']][$row['type']][$i] = $row['year'.$i];
			if (($row['year'.$i] >= 0) && ($row['type'] == 'domaintransfer')) $domainprices[$row['extension']][$row['type']][$i] = $row['year'.$i];
		}
	}
	foreach ( $domainprices as $tld => $values ) {
		if ( !isset($values['domainregister']) ) {
			unset($domainprices[$tld]);
		}
	}

	return $domainprices;
}
//#######################################
