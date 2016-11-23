<?php

if (!defined("WHMCS"))
    die("This file cannot be accessed directly");

function ispapidomaincheck_hook_premiumcron($vars) {
	include 'premiumcron.php';
}

add_hook("DailyCronJob",1,"ispapidomaincheck_hook_premiumcron");
