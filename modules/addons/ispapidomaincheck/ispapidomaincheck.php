
<?php

$module_version = "7.0.0";

// echo "<pre>"; print_r($_SESSION); echo "</pre>";

//if (!defined("WHMCS"))
//	die("This file cannot be accessed directly");

/*
 * Configuration of the addon module.
 */
function ispapidomaincheck_config() {
	global $module_version;
    $configarray = array(
	    "name" => "ISPAPI DomainCheck",
	    "description" => "The ISPAPI DomainCheck use the configured ISPAPI registrar module to check the availability of domains.",
	    "version" => $module_version,
	    "author" => "HEXONET",
	    "language" => "english",
		"fields" => array(
			"username" => array ("FriendlyName" => "Admin username", "Type" => "text", "Size" => "30", "Description" => "[REQUIRED]", "Default" => "admin", )
	    ));

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
	$query = "CREATE TABLE IF NOT EXISTS ispapi_tblsettings (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, aftermarket_premium INT(10), registry_premium INT(10));";
	$result = full_query($query);


	//IF NOT EXISTS create products for premium domains (DONUTS)
	$result = mysql_query("SELECT * FROM tblproductgroups WHERE name='PREMIUM DOMAIN' LIMIT 1");
	$data = mysql_fetch_array($result);
	if(!empty($data)){
		$productgroupid = $data["id"];
	}else{
		$productgroupid = insert_query("tblproductgroups",array("name" => "PREMIUM DOMAIN", "hidden" => 1));
	}

	$classes = array("PREMIUM_DONUTS_A" => "1234",
			"PREMIUM_DONUTS_A+" => "1234",
			"PREMIUM_DONUTS_AA" => "1234",
			"PREMIUM_DONUTS_AA+" => "1234",
			"PREMIUM_DONUTS_AAA+" => "1234",
			"PREMIUM_DONUTS_AAAA" => "1234",
			"PREMIUM_DONUTS_B" => "1234",
			"PREMIUM_DONUTS_B+" => "1234",
			"PREMIUM_DONUTS_BB" => "1234",
			"PREMIUM_DONUTS_BB+" => "1234",
			"PREMIUM_DONUTS_BBB+" => "1234",
			"PREMIUM_DONUTS_BBBB" => "1234",
			"PREMIUM_MENU_A" => "1234",
			"PREMIUM_MENU_B" => "1234",
			"PREMIUM_MENU_C" => "1234",
			"PREMIUM_MENU_D" => "1234",
			"PREMIUM_CEO_A" => "1234",
			"PREMIUM_CEO_B" => "1234",
			"PREMIUM_CEO_C" => "1234",
			"PREMIUM_CEO_D" => "1234",
			"PREMIUM_BUILD_A" => "1234",
			"PREMIUM_BUILD_B" => "1234",
			"PREMIUM_BUILD_C" => "1234",
			"PREMIUM_BUILD_D" => "1234",
			"PREMIUM_BUILD_E" => "1234",
			"PREMIUM_RIGHTSIDE_A" => "1234",
			"PREMIUM_RIGHTSIDE_B" => "1234",
			"PREMIUM_RIGHTSIDE_C" => "1234",
			"PREMIUM_RIGHTSIDE_D" => "1234",
			"PREMIUM_RIGHTSIDE_E" => "1234",
			"PREMIUM_RIGHTSIDE_F" => "1234",
			"PREMIUM_RIGHTSIDE_G" => "1234",
			"PREMIUM_RIGHTSIDE_H" => "1234",
			"PREMIUM_RIGHTSIDE_I" => "1234",
			"PREMIUM_RIGHTSIDE_J" => "1234",
			"PREMIUM_RIGHTSIDE_K" => "1234",
			"PREMIUM_RIGHTSIDE_L" => "1234",
			"PREMIUM_RIGHTSIDE_M" => "1234",
			"PREMIUM_RIGHTSIDE_N" => "1234",
			"PREMIUM_RIGHTSIDE_O" => "1234",
			"PREMIUM_RIGHTSIDE_P" => "1234",);

	$currencies = array();
	$result = select_query("tblcurrencies", "id");
	while($data = mysql_fetch_array($result)){
		array_push($currencies, $data["id"]);
	}

	foreach($classes as $class => $price){

		$result = mysql_query("SELECT * FROM tblproducts WHERE name='".mysql_real_escape_string($class)."'");
		$data = mysql_fetch_array($result);
		if(empty($data)){

			$newid = insert_query("tblproducts",array("type" => "other",
					"gid" => $productgroupid,
					"name" => $class,
					"description" => "",
					"autosetup" => "payment",
					"hidden" => "on",
					"servertype" => "ispapipremium",
					"paytype" => "recurring",
					"retired" => "0",
					"freedomain" => "on",
					"freedomainpaymentterms" => "Annually",));
		}

	}
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
	//$query = "DROP TABLE ispapi_tblsettings;";
	//$result = full_query($query);

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

	#tulsi
	#check here if the backorder module is installed and save the result in a session
	#for this example we will say it EXISTS
	if(file_exists(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/ispapibackorder.php")){
		$_SESSION["ispapi_backorder"] = 1;
	}
	else{
		$_SESSION["ispapi_backorder"] = 0;
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


// require_once(dirname(__FILE__)."/../../../modules/addons/ispapibackorder/backend/call.php");
// $backordermodulepath = "modules/addons/ispapibackorder/backend/call.php";
$backordermodulepath = "modules/addons/ispapibackorder/";

	//get the module name
	//$parts = Explode("/", __FILE__);
	//$parts = Explode(".", $parts[count($parts) - 1]);
	//$modulename = $parts[0];
	$modulename = "ispapidomaincheck";

	$path_to_domain_file = "modules/addons/".$modulename."/domain.php";
	$modulepath = "modules/addons/".$modulename."/";

	//get all categories with subgategories for the template
	$categories = array();
	$result = mysql_query("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
	while ($data = mysql_fetch_array($result)) {
		$subcategories = array();
		$result2 = select_query("ispapi_tblcategories","id,name,tlds", array("parent"=>$data["id"]));
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
					'backordermodulepath' => $backordermodulepath,
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

	//Aftermarket Currencies
	###############################################################################
	//Create aftermarket currencies table
	full_query("CREATE TABLE IF NOT EXISTS ispapi_tblaftermarketcurrencies (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, currency TEXT, rate decimal(10,5));");

	//insert currencies from whmcs to this table
	$select = mysql_query("SELECT * FROM tblcurrencies where code != 'USD' and code != 'usd'");
	while ($data = mysql_fetch_array($select)) {
		$s = mysql_query("SELECT * FROM ispapi_tblaftermarketcurrencies WHERE currency = '".$data["code"]."' limit 1");
		$d = mysql_fetch_array($s);
		if(empty($d)){
			mysql_query("INSERT INTO ispapi_tblaftermarketcurrencies (currency,rate) VALUES ( '".strtoupper($data["code"])."', 0.0);");
		}
	}

	//Delete old currencies from the ispapi_tblaftermarketcurrencies
	$select = mysql_query("SELECT * FROM ispapi_tblaftermarketcurrencies");
	while ($data = mysql_fetch_array($select)) {
		$s = mysql_query("SELECT * FROM tblcurrencies WHERE code = '".$data["currency"]."'");
		$d = mysql_fetch_array($s);
		if(empty($d)){
			mysql_query("DELETE FROM ispapi_tblaftermarketcurrencies WHERE currency = '".$data["currency"]."'");
		}
	}
	###############################################################################

	echo '<div id="tab0box" class="tabbox tab-content">';

	//Save settings
	###############################################################################
	if(isset($_REQUEST["savegeneralsettings"])){
		$select = mysql_query("SELECT id FROM ispapi_tblsettings LIMIT 1");
		$data = mysql_fetch_array($select);
		if(!empty($data)){
			update_query( "ispapi_tblsettings", array("aftermarket_premium" => $_REQUEST["aftermarket_premium"], "registry_premium" => $_REQUEST["registry_premium"]), array( "id" => $data["id"]) );
		}else{
			insert_query("ispapi_tblsettings",array("aftermarket_premium" => $_REQUEST["aftermarket_premium"],"registry_premium" => $_REQUEST["registry_premium"]));
		}

		$select = mysql_query("SELECT * FROM ispapi_tblaftermarketcurrencies");
		while ($data = mysql_fetch_array($select)) {
			update_query( "ispapi_tblaftermarketcurrencies", array("rate" => $_REQUEST[$data["currency"]]), array( "currency" => $data["currency"]) );
		}

		echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################

	//get the data from the DB for displaying
	###############################################################################
	$adminuser = $startsequence = $namemedia = "";
	$select = mysql_query("SELECT * FROM ispapi_tblsettings LIMIT 1");
	$data = mysql_fetch_array($select);
	if(!empty($data)){
		$aftermarket = $data["aftermarket_premium"];
		$registry = $data["registry_premium"];
	}
	###############################################################################

	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%" style="color:#333333;"><tbody>';

	echo '<tr><td colspan="2" style="font-size:14px;color:#111111;"><b>Aftermarket Premium Domains</td></tr>';
	echo '<tr><td width="50%" class="fieldlabel"><b>Show aftermarket premium domains</b></td><td class="fieldarea"><input type="radio" name="aftermarket_premium" value="1" '.(($aftermarket==1)?"checked":"").'> Yes &nbsp;&nbsp;&nbsp;<input type="radio" name="aftermarket_premium" value="0" '.(($aftermarket!=1)?"checked":"").'> No</td></tr>';

	echo '<tr><td width="50%" class="fieldlabel" valign="top"><b>Aftermarket conversion rates<b></td><td style="padding-left:10px;" class="fieldarea">
	<p style="margin-top:0px;">Aftermarket Premium Domains are charged in USD. A currency conversion rate is required in order to display the price in your selling currencies.<br>
	If your WHMCS default currency is set to USD you don\'t need to fill the conversion rates here.</p>';

	$select = mysql_query("SELECT * FROM ispapi_tblaftermarketcurrencies");
	while ($data = mysql_fetch_array($select)) {
			echo "1 USD =  <input name='".$data["currency"]."' size='10' type='text' value='".$data["rate"]."'> ".$data["currency"]."<br>";
	}

	echo '</td></tr>';

	echo '<tr><td colspan="2" style="font-size:14px;color:#111111;"><b>Registry Premium Domains</td></tr>';

	echo '<tr><td width="50%" class="fieldlabel"><b>Show registry premium domains</b></td><td class="fieldarea"><input type="radio" name="registry_premium" value="1" '.(($registry==1)?"checked":"").'> Yes &nbsp;&nbsp;&nbsp;<input type="radio" name="registry_premium" value="0" '.(($registry!=1)?"checked":"").'> No</td></tr>';


	echo '</tbody></table></div>';
	echo '<p align="center"><input class="btn" name="savegeneralsettings" type="submit" value="Save Changes"></p>';
	echo '</form>';

	echo '</div>';
}

function ispapidomaincheck_categoryeditorcontent($modulelink){
	echo '<div id="tab1box" class="tabbox tab-content">';

	//Delete categories
	###############################################################################
	if(isset($_REQUEST["delete"])){
		mysql_query("DELETE FROM ispapi_tblcategories WHERE id='".mysql_real_escape_string($_REQUEST["delete"])."'");
		mysql_query("DELETE FROM ispapi_tblcategories WHERE parent='".mysql_real_escape_string($_REQUEST["delete"])."'");
		echo '<div class="infobox"><strong><span class="title">Deletion Successfully!</span></strong><br>Your category has been deleted.</div>';
	}
	###############################################################################

	//Save categories
	###############################################################################
	if(isset($_REQUEST["savecategories"])){
		foreach($_POST["CAT"] as $id => $categorie){
			update_query( "ispapi_tblcategories", array( "name" => $categorie["NAME"], "tlds" => $categorie["TLDS"] ), array( "id" => $id) );
		}
		foreach($_POST["ADDSUBCAT"] as $id => $subcat){
			if(!empty($subcat["NAME"])){
				insert_query("ispapi_tblcategories",array("parent" => $id, "name" => $subcat["NAME"], "tlds" => $subcat["TLDS"]));
			}
		}
		if(!empty($_POST["ADDCAT"]["NAME"])){
			$id = insert_query("ispapi_tblcategories",array("name" => $_POST["ADDCAT"]["NAME"]));
			if(!empty($_POST["ADDSUBCAT"]["NAME"])){
				insert_query("ispapi_tblcategories",array( "parent" => $id, "name" => $_POST["ADDSUBCAT"]["NAME"], "tlds" => $_POST["ADDSUBCAT"]["TLDS"] ));
			}
		}
		echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
	}
	###############################################################################

	//get all categories with subgategories for displaying
	###############################################################################
	$categories = array();
	$result = mysql_query("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
	while ($data = mysql_fetch_array($result)) {
		$subcategories = array();
		$result2 = select_query("ispapi_tblcategories","id,name,tlds", array("parent"=>$data["id"]));
		while ($data2 = mysql_fetch_array($result2)) {
			array_push($subcategories, $data2);
		}
		$data["subcategories"] = $subcategories;
		array_push($categories, $data);
	}
	###############################################################################

	echo '<form action="'.$modulelink.'" method="post">';
	echo '<div class="tablebg" align="center"><table id="domainpricing" class="datatable" cellspacing="1" cellpadding="3" border="0" width="100%"><tbody>';
	foreach($categories as $category){
		echo '<tr><td colspan="2" style="background-color:#2162A3;"><input style="font-weight:bold;width:210px;" type="text" name="CAT['.$category["id"].'][NAME]" value="'.$category["name"].'"/></td><td width="20" style="background-color:#2162A3;"><a href="'.$modulelink."&delete=".$category["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
		foreach($category["subcategories"] as $subcategory){
			echo '<tr><td width="220"><input style="width:210px;" type="text" name="CAT['.$subcategory["id"].'][NAME]" value="'.$subcategory["name"].'"/></td><td><input style="width:650px;" type="text" name="CAT['.$subcategory["id"].'][TLDS]" value="'.$subcategory["tlds"].'"/></td><td width="20"><a href="'.$modulelink."&delete=".$subcategory["id"].'"><img border="0" width="16" height="16" alt="Delete" src="images/icons/delete.png"></a></td></tr>';
		}
		echo '<tr><td><input style="width:210px;" type="text" name="ADDSUBCAT['.$category["id"].'][NAME]" value=""/></td><td><input style="width:650px;" type="text" name="ADDSUBCAT['.$category["id"].'][TLDS]" value=""/></td><td></td></tr>';
	}
	echo '<tr><td colspan="3" style="background-color:#2162A3;"><input style="font-weight:bold;width:210px;" type="text" name="ADDCAT[NAME]" value=""/> <span style="color:#fff;">(Fill to add a new category)</span></td></tr>';
	echo '<tr><td><input style="width:210px;" type="text" name="ADDSUBCAT[NAME]" value=""/></td><td><input style="width:650px;" type="text" name="ADDSUBCAT[TLDS]" value=""/></td><td></td></tr>';
	echo '</tbody></table></div>';
	echo '<p align="center"><input class="btn" name="savecategories" type="submit" value="Save Changes"></p>';
	echo '</form>';

	echo '</div>';
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
