<?php

/**
 * Get Domain Search Menu Item replaced with our Domain Search
 */

add_hook('ClientAreaSecondarySidebar', 1, function ($navbar) {
    $navItem = $navbar->getChild('Actions');
    if (is_null($navItem)) {
        return;
    }
    $children = $navItem->getChildren();
    foreach ($children as $c) {
        if ($c->getName() === "Domain Registration") {
            $c->setUri('domainchecker.php');
            break;
        }
    }
});
