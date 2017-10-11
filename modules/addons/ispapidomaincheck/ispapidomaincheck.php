<?php

$module_version = "7.2.0";
use WHMCS\Database\Capsule;

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
	// echo "ispapidomaincheck_activate\n";
	try{
        $pdo = Capsule::connection()->getPdo();

		//IF NOT EXISTS Create ispapi_tblcategories table
		$stmt = $pdo->prepare("CREATE TABLE IF NOT EXISTS ispapi_tblcategories (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, parent INT(10), name TEXT, tlds TEXT);");
		$stmt->execute();

		//Insert example categories if table empty (just the first time)
		$stmt2 = $pdo->prepare("SELECT * FROM ispapi_tblcategories");
		$stmt2->execute();
		$data = $stmt2->fetchAll(PDO::FETCH_ASSOC);
		if(empty($data)){
			$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblcategories (name) VALUES ('new TLDs')");
            $insert_stmt->execute();
			if($insert_stmt->rowCount()){
	            $stmt = $pdo->prepare("SELECT id FROM ispapi_tblcategories WHERE name = 'new TLDS'");
	            $stmt->execute();
				$id = $stmt->fetch(PDO::FETCH_ASSOC);
				$insert_stmt1 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, 'Popular', 'camera diamonds domains email guru land sexy tattoo singles')");
				$insert_stmt1->execute(array($id['id']));
				$insert_stmt2 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, 'Business', 'camera company computer enterprises equipment holdings management solutions support')");
                $insert_stmt2->execute(array($id['id']));
				$insert_stmt3 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, 'Shopping & eCommerce', 'bike camera clothing diamonds tatoo tips voyage')");
                $insert_stmt3->execute(array($id['id']));
				$insert_stmt4 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, 'Food & Drink', 'kitchen menu tips today')");
                $insert_stmt4->execute(array($id['id']));
	        }
			$insert_stmt2 = $pdo->prepare("INSERT INTO ispapi_tblcategories (name) VALUES ( 'generic TLDs' )");
            $insert_stmt2->execute();
			if($insert_stmt2->rowCount()){
				$stmt = $pdo->prepare("SELECT id FROM ispapi_tblcategories WHERE name='generic TLDs'");
	            $stmt->execute();
				$id = $stmt->fetch(PDO::FETCH_ASSOC);
				$insert_stmt1 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES ( ?, 'Top 5', 'com net org info biz')");
                $insert_stmt1->execute(array($id['id']));
				$insert_stmt2 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES ( ?, 'Others', 'aero mobi asia name pro xxx jobs tel')");
                $insert_stmt2->execute(array($id['id']));
			}
			$insert_stmt3 = $pdo->prepare("INSERT INTO ispapi_tblcategories (name) VALUES ( 'country code TLDs' )");
            $insert_stmt3->execute();
			if($insert_stmt3->rowCount()){
				$stmt = $pdo->prepare("SELECT id FROM ispapi_tblcategories WHERE name='country code TLDs'");
	            $stmt->execute();
				$id = $stmt->fetch(PDO::FETCH_ASSOC);
				$insert_stmt1 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES ( ?, 'Europe', 'fr de it nl lu')");
                $insert_stmt1->execute(array($id['id']));
			}
			$insert_stmt4 = $pdo->prepare("INSERT INTO ispapi_tblcategories (name) VALUES ( 'Other' )");
            $insert_stmt4->execute();
			if($insert_stmt4->rowCount()){
				$stmt = $pdo->prepare("SELECT id FROM ispapi_tblcategories WHERE name='Other'");
	            $stmt->execute();
				$id = $stmt->fetch(PDO::FETCH_ASSOC);
				$insert_stmt1 = $pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES ( ?, 'SALES (-20%)', 'guru diamonds')");
                $insert_stmt1->execute(array($id['id']));
			}

		}
		//IF NOT EXISTS Create ispapi_tblsettings table
		$stmt = $pdo->prepare("CREATE TABLE IF NOT EXISTS ispapi_tblsettings (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, aftermarket_premium INT(10), registry_premium INT(10));");
		$stmt->execute();

#TODO: testing - from here
		//IF NOT EXISTS create products for premium domains (DONUTS)
		$stmt = $pdo->prepare("SELECT * FROM tblproductgroups WHERE name='PREMIUM DOMAIN' LIMIT 1");
		$stmt->execute();
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

		if(!empty($data)){
			$productgroupid = $data["id"];
		}else{
			$insert_stmt = $pdo->prepare("INSERT INTO tblproductgroups (name, hidden) VALUES ( 'PREMIUM DOMAIN', '1')");
			$insert_stmt->execute();
			if($insert_stmt->rowCount()){
				$stmt = $pdo->prepare("SELECT id FROM tblproductgroups WHERE name='PREMIUM DOMAIN'");
	            $stmt->execute();
				$productgroupid = $stmt->fetch(PDO::FETCH_ASSOC);
			}
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

		$stmt = $pdo->prepare("SELECT id from tblcurrencies");
		$stmt->execute();
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
			array_push($currencies, $value["id"]);
		}

		foreach($classes as $class => $price){
			$stmt = $pdo->prepare("SELECT * FROM tblproducts WHERE name=?");
			$stmt->execute(array(mysql_real_escape_string($class)));
			$data = $stmt->fetch(PDO::FETCH_ASSOC);
			if(empty($data)){
				$insert_stmt = $insert_stmt1 = $pdo->prepare("INSERT INTO tblproducts (type, gid, name, description, autosetup, hidden, servertype, paytype, retired, freedomain, freedomainpaymentterms) VALUES (other, ?, ?, '', 'payment', 'on', 'ispapipremium', 'recurring', '0', 'on', 'Annually')");
                $insert_stmt1->execute(array($productgroupid, $class));
				if($insert_stmt1->rowCount()){
					$stmt = $pdo->prepare("SELECT id FROM tblproducts WHERE gid=?");
		            $stmt->execute(array($productgroupid));
					$newid = $stmt->fetch(PDO::FETCH_ASSOC);

				}
			}
		}
#TODO: testing. until here
		return array('status'=>'success','description'=>'The ISPAPI Domaincheck Addon was successfully installed.');
	} catch (Exception $e) {
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
    try{
        $pdo = Capsule::connection()->getPdo();

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
            $stmt = $pdo->prepare("SELECT value FROM tblconfiguration WHERE setting='Language' ");
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
            $language = $data["value"];

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
        $stmt = $pdo->prepare("SELECT extension, autoreg FROM tbldomainpricing");
        $registrar = array();
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
         foreach ($data as $key => $value) {
             if(!empty($value["autoreg"])){
     			if(!in_array($value["autoreg"], $modulelist)){
     				array_push($modulelist, $value["autoreg"]);
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
            // TODO:This query works fine but the original query is not understandable for me. Need to check again
            $stmt = $pdo->prepare("SELECT id FROM tblcurrencies");
            $stmt->execute();
            $data = $stmt->fetch(PDO::FETCH_ASSOC);
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

        $stmt = $pdo->prepare("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
        $stmt->execute();
        $data = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
			$subcategories = array();
			$stmt2 = $pdo->prepare("SELECT id, name, tlds FROM ispapi_tblcategories WHERE parent=?");
			$stmt2->execute(array($value["id"]));
			$data2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
			foreach ($data2 as $val) {
				array_push($subcategories, $val);
			}
			$value["subcategories"] = $subcategories;
			array_push($categories, $value);
		}
    	//get settings from the DB
        $stmt = $pdo->prepare("SELECT * FROM ispapi_tblsettings LIMIT 1");
        $stmt->execute();
        $data = $stmt->fetch(PDO::FETCH_ASSOC);
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

    } catch (Exception $e) {
         die($e->getMessage());
     }

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
    try{
        $pdo = Capsule::connection()->getPdo();

        //Aftermarket Currencies
    	###############################################################################
		$stmt=$pdo->prepare("CREATE TABLE IF NOT EXISTS ispapi_tblaftermarketcurrencies (id INT(10) NOT NULL PRIMARY KEY AUTO_INCREMENT, currency TEXT, rate decimal(10,5));");
		$stmt->execute();

		//insert currencies from whmcs to this table
		$stmt=$pdo->prepare("SELECT * FROM tblcurrencies where code != 'USD' and code != 'usd'");
		$stmt->execute();
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
		    $stmt2=$pdo->prepare("SELECT * FROM ispapi_tblaftermarketcurrencies WHERE currency=?");
		    $stmt2->execute(array($value["code"]));
		    $d = $stmt2->fetch(PDO::FETCH_ASSOC);
		    if(empty($d)){
		        $insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblaftermarketcurrencies (currency, rate) VALUES (?, '0.0')");
		        $insert_stmt->execute(array(strtoupper($value["code"])));
		    }
		}

		//Delete old currencies from the ispapi_tblaftermarketcurrencies
		$stmt=$pdo->prepare("SELECT * FROM ispapi_tblaftermarketcurrencies");
		$stmt->execute();
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
		    $stmt2=$pdo->prepare("SELECT * FROM tblcurrencies WHERE code =?");
		    $stmt2->execute(array($value["currency"]));
		    $d = $stmt2->fetchAll(PDO::FETCH_ASSOC);
		    if(empty($d)){
		        $delete_stmt = $pdo->prepare("DELETE FROM ispapi_tblaftermarketcurrencies WHERE currency =?");
		        $delete_stmt->execute(array($value["currency"]));
		    }

		}
		###############################################################################

		echo '<div id="tab0box" class="tabbox tab-content">';

		//Save settings
		###############################################################################
		if(isset($_REQUEST["savegeneralsettings"])){
			$stmt = $pdo->prepare("SELECT id FROM ispapi_tblsettings LIMIT 1");
			$stmt->execute();
			$data = $stmt->fetch(PDO::FETCH_ASSOC);
			if(!empty($data)){
				$update_stmt = $pdo->prepare("UPDATE ispapi_tblsettings SET aftermarket_premium=?, registry_premium=? WHERE id=?");
				$update_stmt->execute(array($_REQUEST["aftermarket_premium"], $_REQUEST["registry_premium"], $data["id"]));
			}else{
				$insert_stmt = $pdo->prepare("INSERT INTO ispapi_tblsettings (aftermarket_premium, registry_premium) VALUES (?, ?)");
				$insert_stmt->execute(array($_REQUEST["aftermarket_premium"], $_REQUEST["registry_premium"]));
			}

			$stmt2 = $pdo->prepare("SELECT * FROM ispapi_tblaftermarketcurrencies");
			$stmt2->execute();
			$data = $stmt2->fetchAll(PDO::FETCH_ASSOC);
			foreach ($data as $key => $value) {
				$update_stmt = $pdo->prepare("UPDATE ispapi_tblaftermarketcurrencies SET rate=? WHERE currency=?");
				$update_stmt->execute(array($_REQUEST[$value["currency"]], $value["currency"]));
			}

			echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
		}
		###############################################################################

		//get the data from the DB for displaying
		###############################################################################
		$adminuser = $startsequence = $namemedia = "";
		$stmt=$pdo->prepare("SELECT * FROM ispapi_tblsettings LIMIT 1");
		$stmt->execute();
		$data = $stmt->fetch(PDO::FETCH_ASSOC);
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

		$select=$pdo->prepare("SELECT * FROM ispapi_tblaftermarketcurrencies");
		$select->execute();
		$data = $select->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
			echo "1 USD =  <input name='".$value["currency"]."' size='10' type='text' value='".$value["rate"]."'> ".$value["currency"]."<br>";
		}

		echo '</td></tr>';

		echo '<tr><td colspan="2" style="font-size:14px;color:#111111;"><b>Registry Premium Domains</td></tr>';

		echo '<tr><td width="50%" class="fieldlabel"><b>Show registry premium domains</b></td><td class="fieldarea"><input type="radio" name="registry_premium" value="1" '.(($registry==1)?"checked":"").'> Yes &nbsp;&nbsp;&nbsp;<input type="radio" name="registry_premium" value="0" '.(($registry!=1)?"checked":"").'> No</td></tr>';


		echo '</tbody></table></div>';
		echo '<p align="center"><input class="btn" name="savegeneralsettings" type="submit" value="Save Changes"></p>';
		echo '</form>';

		echo '</div>';

    } catch (Exception $e) {
         die($e->getMessage());
     }

}

function ispapidomaincheck_categoryeditorcontent($modulelink){
	echo '<div id="tab1box" class="tabbox tab-content">';
	try{
        $pdo = Capsule::connection()->getPdo();

		//Delete categories
		###############################################################################
		if(isset($_REQUEST["delete"])){
			$delete_stmt=$pdo->prepare("DELETE FROM ispapi_tblcategories WHERE id=?");
			$delete_stmt->execute(array(mysql_real_escape_string($_REQUEST["delete"])));

			$delete_stmt2 = $pdo->prepare("DELETE FROM ispapi_tblcategories WHERE parent=?");
			$delete_stmt2->execute(array(mysql_real_escape_string($_REQUEST["delete"])));

			echo '<div class="infobox"><strong><span class="title">Deletion Successfully!</span></strong><br>Your category has been deleted.</div>';
		}
		###############################################################################

		//Save categories
		###############################################################################
		if(isset($_REQUEST["savecategories"])){
			foreach($_POST["CAT"] as $id => $categorie){
				$update_stmt = $pdo->prepare("UPDATE ispapi_tblcategories SET name=?,  tlds=? WHERE id=?");
				$update_stmt->execute(array($categorie["NAME"], $categorie["TLDS"], $id));
			}
			foreach($_POST["ADDSUBCAT"] as $id => $subcat){
				if(!empty($subcat["NAME"])){
					$insert_stmt=$pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, ?, ?)");
					$insert_stmt->execute(array($id, $subcat["NAME"], $subcat["TLDS"]));
				}
			}
			if(!empty($_POST["ADDCAT"]["NAME"])){
				$insert_stmt=$pdo->prepare("INSERT INTO ispapi_tblcategories (name) VALUES (?)");
				$insert_stmt->execute(array($_POST["ADDCAT"]["NAME"]));
				if($insert_stmt->rowCount() != 0){
					$stmt=$pdo->prepare("SELECT id FROM ispapi_tblcategories WHERE name=?");
                    $stmt->execute(array($_POST["ADDCAT"]["NAME"]));
					$id = $stmt->fetch(PDO::FETCH_ASSOC);
				}
				if(!empty($_POST["ADDSUBCAT"]["NAME"])){
					$insert_stmt=$pdo->prepare("INSERT INTO ispapi_tblcategories (parent, name, tlds) VALUES (?, ?, ?)");
					$insert_stmt->execute(array($id['id'], $_POST["ADDSUBCAT"]["NAME"], $_POST["ADDSUBCAT"]["TLDS"]));
				}
			}
			echo '<div class="infobox"><strong><span class="title">Changes Saved Successfully!</span></strong><br>Your changes have been saved.</div>';
		}
		###############################################################################

		//get all categories with subgategories for displaying
		###############################################################################
		$categories = array();
		$stmt = $pdo->prepare("SELECT id, name FROM ispapi_tblcategories WHERE parent is NULL");
		$stmt->execute();
		$data = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($data as $key => $value) {
			$subcategories = array();
			$stmt2 = $pdo->prepare("SELECT id, name, tlds FROM ispapi_tblcategories WHERE parent=?");
			$stmt2->execute(array($value["id"]));
			$data2 = $stmt2->fetchAll(PDO::FETCH_ASSOC);
			foreach ($data2 as $val) {
				array_push($subcategories, $val);
			}
			$value["subcategories"] = $subcategories;
			array_push($categories, $value);
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

	} catch (Exception $e) {
         die($e->getMessage());
     }

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
	try{
        $pdo = Capsule::connection()->getPdo();
		$stmt = $pdo->prepare("SELECT * FROM tblcurrencies WHERE id=? LIMIT 1");
		$stmt->execute(array(mysql_real_escape_string($currencyid)));
		$cur = $stmt->fetch(PDO::FETCH_ASSOC);

		$list = array();
		$i = 1;

		foreach ( $prices as $tld => $values ) {
			$item = array();
			$item['tld'] = $tld;

			$keys = array_keys($values["domainregister"]);
			if ( count($keys) ) {
				$item['period'] = $keys[0];
				foreach ($cur as $key => $value) {
					$item['register'] = ispapi_domainchecker_price($values["domainregister"][$keys[0]], $value);
				}

			}

			$keys = array_keys($values["domaintransfer"]);

			if ( count($keys) ) {
				if($keys[0] != 1){
					$item['transfer'] = "";
				}else{
					foreach ($cur as $key => $value) {
						$item['transfer'] = ispapi_domainchecker_price($values["domaintransfer"][$keys[0]], $value);
					}

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

	} catch (Exception $e) {
   	 die($e->getMessage());
 	}

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
	try{
        $pdo = Capsule::connection()->getPdo();

		$stmt = $pdo->prepare("SELECT tdp.extension, tp.type, msetupfee year1, qsetupfee year2, ssetupfee year3, asetupfee year4, bsetupfee year5, monthly year6, quarterly year7, semiannually year8, annually year9, biennially year10
				FROM tbldomainpricing tdp, tblpricing tp
				WHERE tp.relid = tdp.id
				AND tp.tsetupfee = 0
				AND tp.currency = ?
				ORDER BY tdp.order");
		$stmt->execute(array(mysql_real_escape_string($currencyid)));
		$row = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($row as $key => $value) {
			for ( $i = 1; $i <= 10; $i++ ) {
				if (($value['year'.$i] > 0) && ($value['type'] != 'domaintransfer')) $domainprices[$value['extension']][$value['type']][$i] = $value['year'.$i];
				if (($value['year'.$i] >= 0) && ($value['type'] == 'domaintransfer')) $domainprices[$value['extension']][$value['type']][$i] = $value['year'.$i];
			}
		}
		foreach ( $domainprices as $tld => $values ) {
			if ( !isset($values['domainregister']) ) {
				unset($domainprices[$tld]);
			}
		}
		return $domainprices;

	} catch (Exception $e) {
   	 die($e->getMessage());
	}

}
//#######################################
