<?php
namespace ISPAPI;

/**
 * PHP i18n Class. This class is used to handle the Internationalization.
 *
 * @copyright  2018 HEXONET GmbH
 */
class i18n
{

    private $translations;

    /*
     *  Constructor
     */
    public function __construct(){
        $this->loadLanguageFile();
    }

    /*
     * Returns the complete array of translations
     *
     * @return array Complete Array of translations
     */
    public function getTranslations() {
        return $this->translations;
    }

    /*
     * Sets the array of translations
     */
    private function setTranslations($translations) {
        $this->translations = $translations;
    }

    /*
     * Load the module laguage file based on the Language set in the session.
     * If no language set, english will be used.
     */
    private function loadLanguageFile(){
        $loaded = false;
        if(isset($_SESSION["Language"])){
            $module_language_file = dirname(__FILE__)."/../lang/".$_SESSION["Language"].".php";
            if(file_exists($module_language_file)){
            	require($module_language_file);
                $loaded = true;
            }
        }

        //in case no language has been loaded, load english fallback
        if(!$loaded){
            $english_module_language_file = dirname(__FILE__)."/../lang/english.php";
            if(file_exists($english_module_language_file)){
            	require($english_module_language_file);
                $loaded = true;
            }
        }

        if($loaded){
            $this->setTranslations($_LANG);
        }
    }

    /*
     * Returns the value of the translation for a given key
	 *
	 * @param string $key The key
	 *
     * @return string The value if found, the key if the value is not existing
     */
	public function getText($key){
		return (isset($this->translations[$key])) ? $this->translations[$key] : "<#".$key."#>";
    }

}

?>
