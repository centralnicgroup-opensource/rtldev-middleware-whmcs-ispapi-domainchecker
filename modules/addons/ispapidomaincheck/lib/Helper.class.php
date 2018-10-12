<?php
namespace ISPAPI;

use WHMCS\Database\Capsule;
use WHMCS_ClientArea;
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
    public function __construct()
    {
    }

    /*
     * Helper to send SQL call to the Database with Capsule
     * Set $debug = true in the function to have DEBUG output in the JSON string
     *
     * @param string $sql The SQL query
     * @param array $params The parameters of the query
     * @param $fetchmode The fetching mode of the query (fetch or fetchall) - DEFAULT = fetch

     * @return json|array The SQL query response or JSON string with error message.
     */
    public static function SQLCall($sql, $params, $fetchmode = "fetch")
    {
        $debug = false;

        try {
            $pdo = Capsule::connection()->getPdo();
            $stmt = $pdo->prepare($sql);
            $result = $stmt->execute($params);

            if ($fetchmode == "fetch") {
                return $stmt->fetch(PDO::FETCH_ASSOC);
            } elseif ($fetchmode == "execute") {
                return $result;
            } else { //ELSE returns fetchall
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            }
        } catch (\Exception $e) {
            $i18n = new I18n();
            if ($debug) {
                echo json_encode(array("feedback" => array( "f_type" => "sqlerror", "f_message" => $i18n->getText("error_feedback"), "sqlmessage" => $e->getMessage(), "sqlquery" => $sql) ));
            } else {
                echo json_encode(array("feedback" => array( "f_type" => "sqlerror", "f_message" => $i18n->getText("error_feedback")) ));
            }
            die();
        }
    }


    /*
     * Helper to send API command to the given registrar. Returns the response
     *
     * @param string $registrar The registrar
     * @param string $command The API command to send
     *
     * @return array The response from the API
     */
    public static function APICall($registrar, $command)
    {
        $registrarconfigoptions = getregistrarconfigoptions($registrar);
        $registrar_config = call_user_func($registrar."_config", $registrarconfigoptions);
        return call_user_func($registrar."_call", $command, $registrar_config);
    }

    /*
     * Returns the customer selected currency id.
     *
     * @return string Currency ID of the user.
     */
    public static function getCustomerCurrency()
    {
        //first take the currency from the URL or from the session
        $currency = isset($_REQUEST["currency"]) ? $_REQUEST["currency"] : $_SESSION["currency"];

        //if customer logged in, set the configured currency.
        $ca = new WHMCS_ClientArea();
        if ($ca->isLoggedIn()) {
            $user = self::SQLCall("SELECT currency FROM tblclients WHERE id=?", array($ca->getUserID()));
            $currency = $user["currency"];
        }

        //not logged in, no currency in the URL and no currency in the SESSION
        if (empty($currency)) {
            $default = self::SQLCall("SELECT id FROM tblcurrencies WHERE `default`=1", array());
            $currency = $default["id"];
        }
        return $currency;
    }
}
