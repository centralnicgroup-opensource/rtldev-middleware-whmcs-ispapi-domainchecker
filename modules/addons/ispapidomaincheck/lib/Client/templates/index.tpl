<div id="dcmain">
    <div class="domain-checker-container2">
        <div class="domain-checker-bg2">
            <form method="post" action="index.php?m=ispapicheckdomain" id="searchform" class="search-form" onsubmit="return false;">
                <div class="search-input-bar row1">
                    <div class="input-group">
                        <div class="inner-addon right-addon">
                            <input  id="searchfield" name="domain" class="form-control singlesearch input-box" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$_lang.domaincheckerdomainexample}">
                            <div class="addon">
                                <button id="transferbutton" title="Transfer" class="btn btn-default btn-hx-transfer" type="button">
                                    <i class="far fa-exchange"></i>
                                </button>
                                <button id="searchbutton" disabled class="btn btn-default btn-hx-search" type="button">
                                    <i class="far fa-search"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="datafilters" class="row1 row" style="display:none">
                    <div class="col col-sm-2 filter filterInverse" id="showPremiumDomains">
                        <div class="table-switch">
                            <i class="fa fa-toggle-off"></i>
                        </div>
                        <label>{$_lang.filter_nopremium}</label>
                    </div>
                    <div class="col col-sm-2 filter filterInverse" id="showTakenDomains">
                        <div class="table-switch">
                            <i class="fa fa-toggle-off"></i>
                        </div>
                        <label>{$_lang.filter_notaken}</label>
                    </div>
                    <div class="col col-sm-2 category-setting category-button" data-toggle="collapse" data-target="#category">
                        <div class="table-switch">
                            <i class="category fa fa-angle-down"></i>
                        </div>
                        <label>{$_lang.categories_label}</label>
                    </div>
                    <div class="col col-sm-2 category-setting" id="legend-button" data-toggle="collapse" data-target="#legend">
                        <div class="table-switch">
                            <i class="legend fa fa-angle-down"></i>
                        </div>
                        <label>{$_lang.legend_label}</label>
                    </div>
                </div>
                <div id="legend-cont" class="row1 row collapse-legend">
                    <div class="col col-12 col-xs-12">
                        <div class="collapse" id="legend">
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-hot">{$_lang.grouphot}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_grouphot}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-new">{$_lang.groupnew}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_groupnew}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-sale">{$_lang.groupsale}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_groupsale}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-available">{$_lang.domaincheckeravailable}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_available}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-premium">{$_lang.premium}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_premium}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-premium">{$_lang.aftermarket}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_aftermarket}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-reserved">{$_lang.domaincheckerreserveddn}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_reserveddn}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-backorder">{$_lang.backorder}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_backorder}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-taken">{$_lang.domaincheckertaken}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_taken}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-whois"><i class="fa fa-question-circle"></i> {$_lang.whois}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_whois}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-taken">{$_lang.domaincheckerinvaliddn}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_invaliddn}</div>
                                <div class="clear"></div>
                            </div><hr class="xs"/>
                            <div class="row">
                                <div class="col col-3 col-xs-3"><span class="label label-hx label-hx-error"><i class="fa fa-question-circle"></i> {$_lang.domaincheckererror}</span></div>
                                <div class="col col-9 col-xs-9">{$_lang.label_descr_error}</div>
                                <div class="clear"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div id="categories" class="row1 row collapse-category" style="display:none">
                    <div class="col col-12 col-xs-12">
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
                    <p align="center"><a class="btn btn-danger orderbutton" style="visibility:hidden" href="{$WEB_ROOT}/cart.php?a=confdomains" role="button">{$_lang.checkoutbutton} &raquo;</a></p>
                </div>
            </form>
        </div>
    </div>
    <div id="loading"><span><i class="fas fa-sync fa-spin"></i></span></div>
    <div id="errorcont" style="display:none"><p align="center"><b>{$_lang.noresults}</b></p></div>
    <div class="result-item" id="resultsarea" style="display:none;">
        <form id="domainform" action="cart.php?a=add&domain=register" method="post">
            <div class="row row1 search-results clear" id="searchresults"></div>
            <p align="center"><button id="loadmorebutton" type="button" class="btn btn-secondary" style="display:none">{$_lang.loadmorebutton} &raquo;</button> <a class="btn btn-danger orderbutton" style="visibility:hidden" href="{$WEB_ROOT}/cart.php?a=confdomains" role="button">{$_lang.checkoutbutton} &raquo;</a></p> 
            <hr>
        </form>
    </div>
    {if !$loggedin && $currencies}
        <div class="currencychooser pull-right float-right clearfix margin-bottom">
            <div class="btn-group" role="group">
                {foreach from=$currencies item=curr}
                    {assign "country" "{strtolower(substr($curr.code, 0, 2))}"}
                    <button id="curr_{$curr.id}" class="btn btn-default{if $currency eq $curr.id} active{/if}">
                        <div class="iti-flag {$country}" style="display:inline-block"></div>
                        {$curr.code}
                    </button>
                {/foreach}
            </div>
        </div>
        <div class="clearfix"></div>
    {/if}

    {include file="$template/includes/modal.tpl" name="Whois" title="{$_lang.whoisresults} <b>&quot;<span id=\"whoisDomainName\"></span>&quot;</b>"}
</div>