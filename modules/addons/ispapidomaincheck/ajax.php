<?php
require_once(dirname(__FILE__)."/../../../init.php");
use WHMCS\Database\Capsule;
switch ($_REQUEST["action"]) {
    //get the product id with the classname
	case "getproduct":
	try{
		$pdo = Capsule::connection()->getPdo();
		$stmt = $pdo->prepare("SELECT id FROM tblproducts WHERE name=?");
		$stmt->execute(array($_REQUEST["class"]));
		$data = $stmt->fetch(PDO::FETCH_ASSOC);

		if(!empty($data)){
			$result = $data;
		}else{
			$result = array();
		}
	} catch (Exception $e) {
		die($e->getMessage());
	}
	echo json_encode($result);
    die();
    break;
	default:
	break;
}

?>
