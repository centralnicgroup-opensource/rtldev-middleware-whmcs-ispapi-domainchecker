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

    /*
     *  Constructor
     */
    public function __construct(){
		$this->registrars = array();
		$this->loadISPAPIRegistrars();
    }

	/*
	 * Returns all the loaded registrars
	 *
     * @return array All loaded registrars
     */
	public function getLoadedRegistars(){
		return $this->registrars;
	}

	/*
	 * Loads all the ISPAPI Registrars.
	 * ISPAPI registrar = ISPAPI like registrar module >= 1.0.53 AND registrar module authentication successful
     */
	private function loadISPAPIRegistrars(){
		foreach($this->getAllConfiguredRegistrars() as $registrar){
			include_once(dirname(__FILE__)."/../../../../modules/registrars/".$registrar."/".$registrar.".php");
			if(function_exists($registrar.'_GetISPAPIModuleVersion')){
				//compare version number MINIMUM: 1.0.53
				$version = call_user_func($registrar.'_GetISPAPIModuleVersion');
 				if( version_compare($version, '1.0.53') >= 0 ){
					//check authentication
					$checkAuthentication = Helper::APICall($registrar, array("COMMAND" => "CheckAuthentication"));
					if($checkAuthentication["CODE"] == "200"){
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
	private function getAllConfiguredRegistrars(){
		$list = array();
		$registrars_array = Helper::SQLCall("SELECT extension, autoreg FROM tbldomainpricing GROUP BY autoreg", array(), "fetchall");
		foreach($registrars_array as $registrar){
			array_push($list, $registrar["autoreg"]);
		}
		return $list;
	}
}

?>
