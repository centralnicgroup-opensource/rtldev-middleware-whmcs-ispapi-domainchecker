<div class="domain-checker-container2">
    <div class="domain-checker-bg2">
        <form method="post" action="index.php?m=ispapicheckdomain" id="searchform" class="search-form" onsubmit="return false;">
            <div class="search-input-bar row1">
                <div class="input-group">
                    <div class="inner-addon right-addon">
                        <input  id="searchfield" name="domain" class="form-control singlesearch input-box" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$_LANG.domaincheckerdomainexample}">
                        <div class="addon"><button id="transferbutton" class="btn btn-default btn-hx-transfer" type="button"><i class="glyphicon glyphicon-transfer"></i></button><button id="searchbutton" disabled class="btn btn-default btn-hx-search" type="button"><i class="glyphicon glyphicon-search"></i></button></div>
                    </div>
                </div>
            </div>
            <div id="datafilters" class="row1 row" style="display:none">
                <div class="col-sm-2 filter filterInverse" id="showPremiumDomains">
                    <div class="table-switch">
                        <i class="fa fa-toggle-off"></i>
                    </div>
                    <label>{$_LANG.filter_nopremium}</label>
                </div>
                <div class="col-sm-2 filter filterInverse" id="showTakenDomains">
                    <div class="table-switch">
                        <i class="fa fa-toggle-off"></i>
                    </div>
                    <label>{$_LANG.filter_notaken}</label>
                </div>
                <div class="col-sm-2 category-setting category-button" data-toggle="collapse" data-target="#category">
                    <div class="table-switch">
                        <i class="category fa fa-angle-down"></i>
                    </div>
                    <label>{$_LANG.categories_label}
                </div>
                <div id="legend-button" class="col-sm-2 category-setting" data-toggle="collapse" data-target="#legend">
                    <div class="table-switch">
                        <i class="legend fa fa-angle-down"></i>
                    </div>
                    <label>{$_LANG.legend_label}
                </div>
            </div>
            <div id="legend-cont" class="row1 row collapse-legend">
                <div class="col-xs-12">
                    <div class="collapse" id="legend">
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-available">{$_LANG.domaincheckeravailable}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_available}</div>
                        </div><hr class="xs"/>
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-premium">{$_LANG.premium}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_premium}</div>
                        </div><hr class="xs"/>
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-premium">{$_LANG.aftermarket}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_aftermarket}</div>
                        </div><hr class="xs"/>
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-taken">{$_LANG.domaincheckertaken}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_taken}</div>
                        </div><hr class="xs"/>
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-backorder">{$_LANG.backorder}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_backorder}</div>
                        </div><hr class="xs"/>
                        <div class="row">
                            <div class="col-xs-2"><span class="label label-hx label-hx-whois"><i class="glyphicon glyphicon-question-sign"></i> {$_LANG.whois}</span></div>
                            <div class="col-xs-10">{$_LANG.label_descr_whois}</div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="categories" class="row1 row collapse-category" style="display:none">
                <div class="col-xs-12">
                    <div class="collapse" id="category">
                        <div class="category-item icon">
                            <div class="domain-checker-container2">
                                <div class="domain-checker-bg2">
                                    <div class="well2">
                                        <div class="catcontainer">
                                            <ul class="cat" id="categoriescont"></ul>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <hr>
                    </div>
                </div>
                <p align="center"><a class="btn btn-danger orderbutton hide" href="{$WEB_ROOT}/cart.php?a=confdomains" role="button">{$_LANG.checkoutbutton} &raquo;</a></p>
            </div>
        </form>
    </div>
</div>
<div id="loading"><span><i class="fas fa-sync fa-spin"></i></span></div>
<div class="result-item" id="resultsarea" style="display:none;">
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
        <div class="row row1 search-results" id="searchresults"></div>
        <p align="center"><button id="loadmorebutton" type="button" class="btn btn-secondary" style="display:none">{$_LANG.loadmorebutton} &raquo;</button> <a class="btn btn-danger orderbutton hide" href="{$WEB_ROOT}/cart.php?a=confdomains" role="button">{$_LANG.checkoutbutton} &raquo;</a></p> 
        <hr>
	</form>
</div>
{if !$loggedin && $currencies}
    <div class="currencychooser pull-right clearfix margin-bottom">
        <div class="btn-group" role="group">
            {foreach from=$currencies item=curr}
                <button id="curr_{$curr.id}" class="btn btn-default{if $currency eq $curr.id} active{/if}">
                    <img src="{$BASE_PATH_IMG}/flags/{if $curr.code eq "AUD"}au{elseif $curr.code eq "CAD"}ca{elseif $curr.code eq "EUR"}eu{elseif $curr.code eq "GBP"}gb{elseif $curr.code eq "INR"}in{elseif $curr.code eq "JPY"}jp{elseif $curr.code eq "USD"}us{elseif $curr.code eq "ZAR"}za{else}na{/if}.png" border="0" alt="" />
                    {$curr.code}
                </button>
            {/foreach}
        </div>
    </div>
    <div class="clearfix"></div>
{/if}

{include file="$template/includes/modal.tpl" name="Whois" title="{$_LANG.whoisresults} <b>&quot;<span id=\"whoisDomainName\"></span>&quot;</b>"}
