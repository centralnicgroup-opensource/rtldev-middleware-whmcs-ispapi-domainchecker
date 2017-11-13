<?php

require_once(dirname(__FILE__)."/../../../init.php");

switch ($_REQUEST["action"]) {
    //get the product id with the classname
	case "getproduct":
    	$result = select_query("tblproducts", "id", array("name" => $_REQUEST["class"]));
        $data = mysql_fetch_array($result);
        if(!empty($data)){
        	$result = $data;
        }else{
        	$result = array();
        }
        echo json_encode($result);
        die();
        break;

	case "removeFromCart":

		if(isset($_REQUEST["domain"])){
			foreach ($_SESSION["cart"]["domains"] as $key => $value) {
				if(in_array($_REQUEST["domain"], $value)){
					 unset($_SESSION["cart"]["domains"][$key]);
				}
				else{
				}
			}
		}

    default:
    	break;
}

?>
