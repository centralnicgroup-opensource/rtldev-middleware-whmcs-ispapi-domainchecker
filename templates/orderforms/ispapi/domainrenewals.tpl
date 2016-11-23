<script type="text/javascript" src="templates/orderforms/{$carttpl}/js/main.js"></script>
<link rel="stylesheet" type="text/css" href="templates/orderforms/{$carttpl}/style.css" />

<div id="order-modern">

    <div class="title-bar">
        <h1>{$LANG.domainrenewals}</h1>
        {include file="templates/orderforms/{$carttpl}/category-chooser.tpl"}
    </div>

    <p>{$LANG.domainrenewdesc}</p>

    {php}

	$newlist = array();
	foreach ($template->getVariable('renewals')->value as $item) {
	    $result = full_query("select g.name from tblproductgroups g, tblproducts p, tblhosting h where p.id = h.packageid and p.gid = g.id and h.domain = '".$item['domain']."'");
		$data = mysql_fetch_array($result);
		if(isset($data)){
			if($data["name"]!="PREMIUM DOMAIN"){
				array_push($newlist, $item);
			}
		}
	}

	// assign new list without premium domains to renewals variable
	$template->assign('renewals', $newlist);

    {/php}

    <form method="post" action="cart.php?a=add&renewals=true">

        <table class="table table-hover renewals">
            <thead>
                <tr>
                    <th width="20"></th>
                    <th>{$LANG.orderdomain}</th>
                    <th>{$LANG.domainstatus}</th>
                    <th>{$LANG.domaindaysuntilexpiry}</th>
                    <th></th>
                </tr>
            </thead>
            <tbody>
                {foreach from=$renewals item=renewal}
                    <tr>
                        <td>
                            {if !$renewal.pastgraceperiod}
                                <input type="checkbox" name="renewalids[]" value="{$renewal.id}" />
                            {/if}
                        </td>
                        <td>
                            {$renewal.domain}
                        </td>
                        <td>
                            {$renewal.status}
                        </td>
                        <td>
                            {if $renewal.daysuntilexpiry > 30}
                                <span class="textgreen">
                                    {$renewal.daysuntilexpiry} {$LANG.domainrenewalsdays}
                                </span>
                            {elseif $renewal.daysuntilexpiry > 0}
                                <span class="textred">
                                    {$renewal.daysuntilexpiry} {$LANG.domainrenewalsdays}
                                </span>
                            {else}
                                <span class="textblack">
                                    {$renewal.daysuntilexpiry*-1} {$LANG.domainrenewalsdaysago}
                                </span>
                            {/if}
                            {if $renewal.ingraceperiod}
                                <br />
                                <span class="textred">
                                    {$LANG.domainrenewalsingraceperiod}
                                </span>
                            {/if}
                        </td>
                        <td>
                            {if $renewal.beforerenewlimit}
                                <span class="textred">
                                    {$LANG.domainrenewalsbeforerenewlimit|sprintf2:$renewal.beforerenewlimitdays}
                                </span>
                            {elseif $renewal.pastgraceperiod}
                                <span class="textred">
                                    {$LANG.domainrenewalspastgraceperiod}
                                </span>
                            {else}
                                <select name="renewalperiod[{$renewal.id}]">
                                    {foreach from=$renewal.renewaloptions item=renewaloption}
                                        <option value="{$renewaloption.period}">
                                            {$renewaloption.period} {$LANG.orderyears} @ {$renewaloption.price}
                                        </option>
                                    {/foreach}
                                </select>
                            {/if}
                        </td>
                    </tr>
                {foreachelse}
                    <tr class="carttablerow">
                        <td colspan="5">{$LANG.domainrenewalsnoneavailable}</td>
                    </tr>
                {/foreach}
            </tbody>
        </table>

        <p class="text-center">
            <button type="submit" class="btn btn-success btn-lg">
                <i class="fa fa-shopping-cart"></i>
                {$LANG.ordernowbutton}
            </button>
        </p>

    </form>

</div>
