<?php

namespace WHMCS\Module\Addon\ispapidomaincheck\Client;

/**
 * Client Area Dispatch Handler
 */
class ClientDispatcher
{

    /**
     * Dispatch request.
     *
     * @param string $action
     * @param array $parameters
     * @param Smarty $smarty template engine instance
     *
     * @return string
     */
    public function dispatch($action, $args, $smarty)
    {
        if (!$action) {
            // Default to index if no action specified
            $action = 'index';
        } else {
            $action = str_replace("-", "", $action);
        }

        $controller = new Controller();

        // Verify requested action is valid and callable
        if (is_callable(array($controller, $action))) {
            return $controller->$action($args, $smarty);
        }
        // action error
        $smarty->assign("error", $args['_lang']['actionerror']);
        return $smarty->fetch('error.tpl');
    }
}
