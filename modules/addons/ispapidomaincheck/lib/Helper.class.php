<?php
namespace ISPAPI;

use WHMCS\Database\Capsule;
use PDO;

/**
 * PHP Helper Class
 *
 * @copyright  2018 HEXONET GmbH
 */
class Helper
{

    /*
     *  Constructor
     */
    public function __construct(){}

    /*
     * Helper to send SQL call to the Database with Capsule
     * Set $debug = true in the function to have DEBUG output in the JSON string
     *
     * @param string $sql The SQL query
     * @param array $params The parameters of the query
     * @param $fetchmode The fetching mode of the query (fetch or fetchall) - DEFAULT = fetch

     * @return json|array The SQL query response or JSON string with error message.
     */
    public static function SQLCall($sql, $params, $fetchmode = "fetch"){
        $debug = false;

        try {
            $pdo = Capsule::connection()->getPdo();
            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);

            if($fetchmode == "fetch"){
                return $stmt->fetch(PDO::FETCH_ASSOC);
            }else{
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        } catch (\Exception $e) {
            if($debug){
                echo json_encode( array("feedback" => array( "f_type" => "sqlerror", "f_message" => $this->getTranslation("error_feedback"), "sqlmessage" => $e->getMessage(), "sqlquery" => $sql) ) );
            }else{
                echo json_encode( array("feedback" => array( "f_type" => "sqlerror", "f_message" => $this->getTranslation("error_feedback")) ) );
            }
            die();
        }
    }

}

?>
