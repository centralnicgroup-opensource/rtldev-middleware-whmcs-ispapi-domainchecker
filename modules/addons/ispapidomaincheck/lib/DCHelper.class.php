<?php
namespace ISPAPI;

$path = implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","registrars","ispapi","lib","Helper.class.php"));
if (file_exists($path)) {
    require_once($path);
} else {
    die('Please install our <a href="https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip">ISPAPI Registrar Module</a> >= v1.7.1');
}
require_once(implode(DIRECTORY_SEPARATOR, array(__DIR__,"i18n.class.php")));

/**
 * PHP DCHelper Class
 *
 * @copyright  2018 HEXONET GmbH
 */
class DCHelper extends Helper
{
    /*
     * Helper to send SQL call to the Database with Capsule
     *
     *
     * @param string $sql The SQL query
     * @param array $params The parameters of the query DEFAULT = NULL
     * @param $fetchmode The fetching mode of the query (fetch, fetchall, execute) - DEFAULT = fetch
     * @param $debug Set to true to have the SQL Query in addition returned in case of an error
     * @return json|array The SQL query response or JSON string with error message.
     */
    public static function SQLCall($sql, $params = null, $fetchmode = "fetch", $debug = false)
    {
        $r = parent::SQLCall($sql, $params, $fetchmode, $debug);
        $i18n = new I18n();
        if (empty($r["errormsg"])) {
            if ($fetchmode == "execute") {
                return $r["success"];
            }
            return $r["result"];
        }
        $out = array(
            "feedback" => array(
                "f_type" => "sqlerror",
                "f_message" => $i18n->getText("error_feedback")
            )
        );
        if ($debug) {
            $out["sqlmessage"] = $r["errormsg"];
            $out["sqlquery"] = $query;
        }
        die(json_encode($out));
    }
}
