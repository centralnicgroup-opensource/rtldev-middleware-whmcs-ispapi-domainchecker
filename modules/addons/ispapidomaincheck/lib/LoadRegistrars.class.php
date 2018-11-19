<?php
namespace ISPAPI;

use ISPAPI\Helper;

/**
 * PHP Class which loads the required registrars for the HP Domainchecker module.
 *
 * @copyright  2018 HEXONET GmbH
 */
class LoadRegistrars
{
    private $registrars;

    const REGISTRAR_MIN_VERSION = '1.0.53';
    /*
     *  Constructor
     */
    public function __construct()
    {
        $this->registrars = array();
        $this->loadISPAPIRegistrars();
    }

    /*
     * Returns all the loaded registrars
     *
     * @return array All loaded registrars
     */
    public function getLoadedRegistars()
    {
        return $this->registrars;
    }

    /*
     * Loads all the ISPAPI Registrars.
     */
    private function loadISPAPIRegistrars()
    {
        foreach ($this->getAllConfiguredRegistrars() as $registrar) {
            $this->loadSingleISPAPIRegistrar($registrar);
        }
        //if no registrar configured in the pricelist, then try to add hexonet and ispapi
        if (empty($this->registrars)) {
            $this->loadSingleISPAPIRegistrar("hexonet");
            $this->loadSingleISPAPIRegistrar("ispapi");
        }
    }

    /*
     * Loads a single ISPAPI Registrar
     * ISPAPI registrar = ISPAPI like registrar module >= 1.0.53 AND registrar module authentication successful

     * @param string $registrar The name of the registrar
     */
    private function loadSingleISPAPIRegistrar($registrar)
    {
        if (isset($registrar)) {
            include_once(implode(DIRECTORY_SEPARATOR, array(ROOTDIR,"modules","registrars",$registrar,$registrar.".php")));
            if (function_exists($registrar.'_GetISPAPIModuleVersion')) {
                //compare version number
                $version = call_user_func($registrar.'_GetISPAPIModuleVersion');
                if (version_compare($version, self::REGISTRAR_MIN_VERSION) >= 0) {
                    //check authentication
                    $checkAuthentication = Helper::APICall($registrar, array("COMMAND" => "CheckAuthentication"));
                    if ($checkAuthentication["CODE"] == "200") {
                        array_push($this->registrars, $registrar);
                    }
                }
            }
        }
    }

    /*
     * Returns all the WHMCS registrars
     *
     * @return array List of all WHMCS registrars
     */
    private function getAllConfiguredRegistrars()
    {
        $list = array();
        $registrars_array = Helper::SQLCall("SELECT extension, autoreg FROM tbldomainpricing GROUP BY autoreg", array(), "fetchall");
        foreach ($registrars_array as $registrar) {
            array_push($list, $registrar["autoreg"]);
        }
        return $list;
    }
}
