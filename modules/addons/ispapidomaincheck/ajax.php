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

		print_r($_SESSION);

		//delete de $_REQUEST["domain"] from the session.

    default:
    	break;
}

?>
