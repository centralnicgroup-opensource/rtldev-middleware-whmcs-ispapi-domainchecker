{literal}


<script>
jQuery.extend(jQuery, {
  /**
   * Escape all special jQuery CSS selector characters in *selector*.
   * Useful when you have a class or id which contains special characters
   * which you need to include in a selector.
   */
  escapeSelector: (function() {
    var specials = [
      '#', '&', '~', '=', '>',
      "'", ':', '"', '!', ';', ','
    ];
    var regexSpecials = [
      '.', '*', '+', '|', '[', ']', '(', ')', '/', '^', '$'
    ];
    var sRE = new RegExp(
      '(' + specials.join('|') + '|\\' + regexSpecials.join('|\\') + ')', 'g'
    );

    return function(selector) {
      return selector.replace(sRE, '\\$1');
    }
  })()
});

$( document ).ready(function() {
	var count = 0;

	$("#orderbutton").bind("click", function(e){
		$("#orderbutton").hide();
		$("#orderbuttonloading").show();
		addSelectedpremiumDomainsToCart();
		addSelectedSimpleDomainsToCart();
		location.href = "{/literal}{$modulepath}{literal}../../../cart.php?a=confdomains";
	});

	function addAftermarketPremiumToCart(id){
		$.ajax({
			  url: "{/literal}{$modulepath}{literal}../../../cart.php?a=add&pid=" + id,
			  type: "POST",
			  async: false,
		});
	}

	function addRegistryPremiumToCart(id,domain){
		$.ajax({
			  type: "POST",
			  async: false,
			  url: encodeURI("{/literal}{$modulepath}{literal}../../../cart.php?a=add&ajax=1&domains[]="+domain+"&domainselect=1&pid="+id)
		});
	}

	function addSelectedSimpleDomainsToCart(){
		var params = $("#domainform").serialize();
		$.ajax({
			  url: "{/literal}{$modulepath}{literal}../../../cart.php?a=add&domain=register",
			  type: "POST",
			  data: params,
			  async: false
		});
	}

	function addSelectedpremiumDomainsToCart(){
		$("#domainform input[name='premiumdomains[]']:checked").each(function() {

			var premiumarray = $(this).attr("value").split(":");
			var domain = premiumarray[0];
			var class_ = premiumarray[1];

			if (class_ == "PREMIUM_NAMEMEDIA") {
				$.ajax({
					  type: "POST",
					  async: false,
					  dataType:'json',
					  url: "{/literal}{$modulepath}{literal}product.php?page=create&domain=" +  domain + "&class=" + encodeURIComponent(class_) ,
					  success: function(data, textStatus, jqXHR) {
						  if(data["status"] == "ok"){
							  addAftermarketPremiumToCart(data["productid"]);
						  }
					  }
				});
			} else if (class_.indexOf("PREMIUM") !=-1) {
				$.ajax({
					  type: "GET",
					  async: false,
					  url: "{/literal}{$modulepath}{literal}ajax.php?action=getproduct&class=" + encodeURIComponent(class_),
					  dataType:'json',
					  success: function(data, textStatus, jqXHR) {
							if(data["id"]){
								addRegistryPremiumToCart(data["id"],domain);
							}
					  }
				});
			}

		});
	}

	$('#searchform').submit(function(e){
	    e.preventDefault();
	});

	$('#searchfield').bind("enterKey",function(e){
		$("#searchbutton").trigger("click");
	});
	$('#searchfield').keyup(function(e){
	    if(e.keyCode == 13)
	    {
	        $(this).trigger("enterKey");
	    }
	});

	$(".cat li").bind("click", function(e){
		var id = $(this).attr("id");
		$(".cat li").each(function() {
			$(this).removeClass("active");
		});
		$(this).addClass("active");

		$(".catcontainer").each(function(){
			$(this).hide();
		});
		$("div[id='container_" + id + "']").show();
		$("div[id='container_" + id + "'] ul li").first().trigger("click");
	})


	$(".sub li").bind("click", function(e){
		$(".sub li").each(function() {
			$(this).removeClass("active");
		});
		$(this).addClass("active");
		var tmpid = $(this).attr("id");
		var id = tmpid.substring(2);
		$("#searchform input[name=tldgroup]").attr("value", id);
		$("#searchbutton").trigger("click");
	})

	function checkdomains(domains, cached_data){
		var currency = "&currency={/literal}{$currency}{literal}" ;

		var cache = "";
		if(cached_data){
			cache = "&cache=1";
		}

		var domainlist = "";
		$.each(domains, function(index, element) {
			domainlist += "&domain[]=" + element;
		});

		var params = $("#searchform").serialize();
		$.ajax({
			type: "POST",
			url: "{/literal}{$path_to_domain_file}{literal}",
			data: params + cache + currency + domainlist,
			dataType:'json',
			success: function(data, textStatus, jqXHR) {

				if(data["feedback"]){
					if(data["feedback"]["status"] == true){
						$("#successarea").html(data["feedback"]["message"]);
						$("#successarea").show();
					}
					if(data["feedback"]["status"] == false){
						$("#errorsarea").html(data["feedback"]["message"]);
						$("#errorsarea").show();
					}
				}

				$.each(data["data"], function(index, element) {
					var id = jQuery.escapeSelector(element.id); //.replace(/\./g, '');
					$( "#" + id).addClass(element.checkover);

					//create selectbox with the price
					if(element.price.domainregister && element.price.domainregister[1] != -1){
						var price = '<select name="domainsregperiod['+element.id+']">';
						$.each(element.price.domainregister, function(index, p){
							if(element.premiumchannel == "NAMEMEDIA"){
								price = price + '<option value="'+index+'">Price: '+p+'</option>';
							}else{
								price = price + '<option value="'+index+'">'+index+' {/literal}{$LANG.orderyears}{literal} @ '+p+'</option>';
							}
						});
						price = price + '</select>';
						var priceavailable = true;
					}else{
						var price = "Pricing not found";
						var priceavailable = false;
					}

					if(element.code == "210"){
						$( "#" + id + " td.checkboxarea").html('<input type="checkbox" value="'+element.id+'" name="domains[]">');
						$( "#" + id + " td.period").html(price);
						$( "#" + id + " td.availability").html("<span class='label label-success'>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("domcheckersuccess");
					}else if(element.code == "423"){
						$( "#" + id + " td.availability").html("<span class='label label-warning'>SERVICE OFFLINE</span>").addClass("domcheckererror");
					}else if(element.code == "541"){
						$( "#" + id + " td.availability").html("<span class='label label-warning'>Invalid domain name</span>").addClass("domcheckererror");
					}else if(element.code == "549"){
						$( "#" + id + " td.availability").html("<span class='label label-warning'>Unsupported TLD</span>").addClass("domcheckererror");
					}
					else{
						//if premium class
						if(element.class){
							if(priceavailable){
								$( "#" + id + " td.checkboxarea").html('<input type="checkbox" value="'+element.id+":"+element.class+'" name="premiumdomains[]">');
							}
							$( "#" + id + " td.period").html(price);
							$( "#" + id + " td.availability").html('<span class="label label-info">'+element.premiumchannel+' PREMIUM</span>').addClass("domcheckersuccess");
						}else{

                            $( "#" + id + " td.availability").html("<span class='label label-danger'>{/literal}{$LANG.domaincheckertaken}{literal}</span>").addClass("domcheckererror");

							var res = element.id.replace('.', ' ');
							var transfer = res.split(" ");

                            var backorder_button = "";
                            if(element.backorder_installed == "1" && element.backorder_available == 1){
                                var backorder_button_class = ((element.backordered=="1") ? "active": "btn-default");
                                $( "#" + id + " td.availability").html("<span class='label label-danger'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span style='border-left:1px solid white;' class='label label-backorder'>Backorder available</span>").addClass("domcheckererror");
                                 backorder_button = "<a class='setbackorder btn btn-sm "+backorder_button_class+"' id='createnewbackorderbutton|"+element.id+"' value='"+element.id+"' >BACKORDER</a>";
                            }

							$( "#" + id + " td.period").html("<a class='btn btn-sm btn-default' href='http://"+element.id+"' target='_blank'>WWW</a> <a class='btn btn-default btn-sm viewWhois' id='WHOIS|"+element.id+"'>WHOIS</a> <a class='btn btn-default btn-sm' href='cart.php?a=add&domain=transfer&sld="+transfer[0]+"&tld=."+transfer[1]+"' target='_blank'>"+"{/literal}{$LANG.domainstransfer}{literal}".toUpperCase()+"</a> "+backorder_button);
						}
					}

                    $('.setbackorder').unbind().click(function() {
                        var button = $(this);
                        var command = "CreateBackorder";
                        if ($(this).hasClass("active"))
                            command = "DeleteBackorder";

                        $.ajax({
                            type: "POST",
                            async: true,
                            dataType: "json",
                            url: "{/literal}{$backorder_module_path}{literal}backend/call.php",
                            data: {
                                COMMAND: command,
                                DOMAIN:$(this).attr("value"),
                                TYPE: "FULL"
                            },
                            success: function(data) {
                                if(command=="CreateBackorder" && data.CODE==200){
                                    button.addClass("active").removeClass("btn-default");;
                                    noty({text: 'Backorder successfully created.', type: 'success', layout: 'bottomRight'}).setTimeout(3000);
                                }
                                else if(command=="DeleteBackorder" && data.CODE==200){
                                    button.addClass("btn-default").removeClass("active");;
                                    noty({text: 'Backorder successfully deleted.', type: 'success', layout: 'bottomRight'}).setTimeout(3000);
                                }
                                else if(data.CODE==531){
                                    noty({text: 'Login Required', type: 'error', layout: 'bottomRight'}).setTimeout(3000);
                                }
                                else{
                                    noty({text: 'An error occured: ' + data.DESCRIPTION, type: 'error', layout: 'bottomRight'}).setTimeout(3000);
                                }
                            },
                            error: function(data) {
                                noty({text: 'An error occured.', type: 'error', layout: 'bottomRight'}).setTimeout(3000);
                            }
                        });
                    });
				});

				$(".viewWhois").unbind();
				$(".viewWhois").bind("click", function(){
					var domain = $(this).attr("id").substring(6);
				    $("#modalWhoisLoader").removeClass('hidden').show();
				    $("#modalWhoisBody").hide();
				    $("#whoisDomainName").html(domain);
				    $("#modalWhois").modal('show');
				    $.post("mywhois.php", "domain=" + domain,
				        function(data) {
				            $("#modalWhoisBody").html(data);
				            $("#modalWhoisLoader").hide();
				            $("#modalWhoisBody").show();
				    });
				});

			},
			error: function (jqXHR, textStatus, errorThrown){
				$("#errorsarea").text(errorThrown);
				$("#errorsarea").show();
				$("#resultsarea, #loading").hide();
			}
		});
	}

	$("#searchbutton").click(function() {

		count++;

		if("{/literal}{$smarty.get.search}{literal}" && count==1){
			$("#searchform input[name='searched_domain']").attr("value", "{/literal}{$smarty.get.search}{literal}" );
			$("#searchfield").attr("value", "{/literal}{$smarty.get.search}{literal}" );
			if("{/literal}{$smarty.get.cat}{literal}"){
				$("#searchform input[name=tldgroup]").attr("value", "{/literal}{$smarty.get.cat}{literal}");
			}
		}else{
			var searched_domain = $("#searchfield").val();
			//Stop the request when domainfield is not filled
			if(searched_domain == ""){
				return;
			}else{
				$("#searchform input[name='searched_domain']").attr("value", searched_domain );
			}
		}

		$("#loading").show();
		$("#pricingTable").hide();

		var currency = "&currency={/literal}{$currency}{literal}" ;
		var params = $("#searchform").serialize();
		var getlistparams = params + "&action=getList" + currency;
		$.ajax({
			type: "POST",
			url: "{/literal}{$path_to_domain_file}{literal}",
			data: getlistparams,
			dataType:'json',
			success: function(data, textStatus, jqXHR) {
				$("#loading, #errorsarea, #successarea").hide();
				$("#errorsarea, #successarea").html("");

				$("#resultsarea").show();
				$('#searchresults').find("tr").remove();

				if(data["feedback"]){
					if(data["feedback"]["status"] == true){
						$("#successarea").html(data["feedback"]["message"]);
						$("#successarea").show();
					}
					if(data["feedback"]["status"] == false){
						$("#errorsarea").html(data["feedback"]["message"]);
						$("#errorsarea").show();
						$("#resultsarea").hide();
						return;
					}
				}

				var nb_results = 0;
				$.each(data["data"], function(index, element) {
					var id = element;//.replace(/\./g, '');

					$('#searchresults').append( '<tr id="' + id + '"><td class="text-center checkboxarea"></td><td><strong>' + element + '</strong></td><td class="text-center availability"><span style="color:#cdcdcd;">{/literal}{$LANG.loading}{literal}</span></td><td class="text-center period"></td></tr>' );
					nb_results++;
				});

				if(nb_results == 0){
					$("#resultsarea").hide();
				}

				//send only one check for cached data
				if(data["cache"] == true){
					checkdomains(new Array(), true);

					{/literal}{if $show_aftermarket_premium_domains eq "1"}{literal}
                        showPremiumDomains();
					{/literal}{/if}{literal}
					return;
				}else{
					var getsortedlistparams = params + "&action=getSortedList" + currency;
					$.ajax({
						type: "POST",
						url: "{/literal}{$path_to_domain_file}{literal}",
						data: getsortedlistparams,
						dataType:'json',
						success: function(sorteddata, textStatus, jqXHR) {
							startChecking(sorteddata["data"]);
						}
					});
				}

			},
			error: function (jqXHR, textStatus, errorThrown){
				$("#errorsarea").text(errorThrown);
				$("#errorsarea").show();
				$("#resultsarea, #loading").hide();
			}
		});
	});

	function startChecking(domainlist){

		var nb_results = domainlist.length;
		var startwith = {/literal}{$startsequence}{literal};

		var i = 1;
		var step = startwith;
		var j = 0;
		while(i < nb_results){
			var modulo = i % step;
			if(modulo == 0){
				var start = step-startwith;
				var end = Math.abs(((step-startwith)+i-1));
				if(end > nb_results-1)
					end = nb_results-1;
				//alert("index:" + i + " step:" + step + " start: " + start + " end: " + end );
				var domains = new Array();
				for(var i = start; i<= end; i++){
					domains.push(domainlist[i]);
				}
				checkdomains(domains, false);
				step = step*2;
				j = i;
			}
			i++;
		}
		if((nb_results-j) > 0){
			var start = j;
			var end = nb_results-1
			var domains = new Array();
			for(var i = start; i<= end; i++){
				domains.push(domainlist[i]);
			}
			checkdomains(domains, false);
		}

		{/literal}{if $show_aftermarket_premium_domains eq "1"}{literal}
			showPremiumDomains();
		{/literal}{/if}{literal}
	}

	function showPremiumDomains(){
		var currency = "&currency={/literal}{$currency}{literal}" ;
		var params = $("#searchform").serialize();
		var getsuggestionsparams = params + "&action=getSuggestions" + currency;
		$.ajax({
			type: "POST",
			url: "{/literal}{$path_to_domain_file}{literal}",
			data: getsuggestionsparams,
			dataType:'json',
			success: function(data, textStatus, jqXHR) {

				if(data["feedback"]){
					if(data["feedback"]["status"] == false){
						$("#errorsarea").html("PREMIUM: " + data["feedback"]["message"]);
						$("#errorsarea").show();
					}
				}

				if(data["data"].length != 0){
					var i = 2;
					var j = 0;
					var selector = "";
					$.each(data["data"], function(index, element) {
						//var id = element.id.toLowerCase(); //.replace(/\./g, '').toLowerCase();
						//var id = jQuery.escapeSelector(element.id.toLowerCase()); //.replace(/\./g, '');
						var id = element.id.toLowerCase().replace("/\./g",'');

						var already_existing = false;
						if($("#"+id).length != 0){
							//if exists - do not display
							already_existing = true;
						}

						//create selectbox with the price
						if(element.price.domainregister && element.price.domainregister[1] != -1){
							var price = '<select name="domainsregperiod['+element.id+']">';
							$.each(element.price.domainregister, function(index, element){
								price = price + '<option value="'+index+'">Price: '+element+'</option>';
							});
							price = price + '</select>';
							var pricing_available = true;
						}else{
							var price = "Pricing not found";
							var pricing_available = false;
						}

						//place 2 rows each 2 rows
						if(j<2){
							j++;
						}else{
							j=1;
							i=i+4;
						}
						if(i > $('#searchresults tr').length)
							selector = '#searchresults tr:last';
						else
							selector = '#searchresults tr:nth-child(' + i + ')';

						if(!already_existing){
							if(pricing_available){
								$(selector).after( '<tr id="' + id + '" class="api"><td class="text-center checkboxarea"><input type="checkbox" value="'+element.id+":"+element.class+'" name="premiumdomains[]"></td><td><strong>' + element.id + '</strong></td><td class="text-center availability"><span class="label label-info">NAMEMEDIA PREMIUM</span></td><td class="text-center period">'+price+'</td></tr>');
							}else{
								$(selector).after( '<tr id="' + id + '" class="api"><td class="text-center checkboxarea"></td><td><strong>' + element.id + '</strong></td><td class="text-center availability"><span class="label label-info">NAMEMEDIA PREMIUM</span></td><td class="text-center period">'+price+'</td></tr>');
							}
						}

					});
				}

			},
			error: function (jqXHR, textStatus, errorThrown){
				$("#errorsarea").text(errorThrown);
				$("#errorsarea").show();
				$("#resultsarea, #loading").hide();
			}
		});
	}

	if("{/literal}{$smarty.get.search}{literal}"){
		if("{/literal}{$smarty.get.cat}{literal}"){
			var subid = "{/literal}{$smarty.get.cat}{literal}";
			var catid = $("#s_" + subid).parent().parent().attr("id").substring(14);
			$(".cat li").each(function() {
				$(this).removeClass("active");
			});
			$("#cat_" + catid).addClass("active");
			$(".catcontainer").each(function(){
				$(this).hide();
			});
			$("div[id='container_cat_" + catid + "']").show();

			$("#s_" + subid).trigger("click");
		}else{
			$(".cat li").first().trigger("click");
		}
	}else{
		$(".cat li").first().trigger("click");
	}

});
</script>
<style>
    .setbackorder.active{
        color:white;
        background-color:#0059b3;
    }

    .label-backorder{
        color:white;
        background-color:#0059b3;
    }

	#filter {
		background-color:#e6e6e6;
		-webkit-border-radius: 3px;
		-webkit-border-top-left-radius: 0;
		-moz-border-radius: 3px;
		-moz-border-radius-topleft: 0;
		border-radius: 3px;
		border-top-left-radius: 0;
		border: none; /*1px solid #e6e6e6*/;
		padding-top:20px;
		padding-bottom:25px;
		padding-right:20px;
        background: linear-gradient(top, #e6e6e6 0%, #e6e6e6 22%, #f2f2f2 100%);
        background: -moz-linear-gradient(top, #e6e6e6 0%, #e6e6e6 22%, #f2f2f2 100%);
        background: -webkit-linear-gradient(top, #e6e6e6 0%, #e6e6e6 22%, #f2f2f2 100%);
        background: -ms-linear-gradient(top, #e6e6e6 0%, #e6e6e6 22%, #f2f2f2 100%);
        background: -o-linear-gradient(top, #e6e6e6 0%, #e6e6e6 22%, #f2f2f2 100%);
        filter: progid:DXImageTransform.Microsoft.gradient(startColorstr=#e6e6e6, endColorstr=#f2f2f2,GradientType=1);
    }

	ul.cat {
		margin:0px;
		padding:0px;
	}

	ul.cat li {
		display:inline;
		float:left;
		background-color: #ffffff;
		color: #111111;
		padding:7px 12px 7px 12px;
		margin-right:5px;
		-webkit-border-top-left-radius: 3px;
		-webkit-border-top-right-radius: 3px;
		-moz-border-radius-topleft: 3px;
		-moz-border-radius-topright: 3px;
		border-top-left-radius: 3px;
		border-top-right-radius: 3px;
		cursor:pointer;
	}

	ul.cat li.active {
		background-color: #e6e6e6;
		border: 1px solid #e6e6e6;
		border-bottom-color: #e6e6e6;
		margin-bottom:-1px;
		font-weight:bold;
	}

	ul.sub {
		margin:0px;
		padding:0px;
	}

	ul.sub li {
		display:inline;
		float:left;
		background-color: #939598;
		color: #ffffff;
		padding:7px 12px 7px 12px;
		margin-left:10px;
		margin-bottom:10px;
		cursor:pointer;
		-webkit-border-radius: 3px;
		-moz-border-radius: 3px;
		border-radius: 3px;
	}

	ul.sub li.active {
		background-color: #f26522;
		color:#ffffff;
	}

	td.availability p {
		font-weight:bold;
		font-size: 80%;
	}

	.domain-checker-container2 {
	    /*background: rgba(0, 0, 0, 0) -moz-linear-gradient(center top , #ffd960, #ffb201) repeat scroll 0 0;*/
	    border-radius: 10px;
	    margin: 20px 0;
	    padding: 0;
	}

	.domain-checker-bg2 {
	    /*background-image: url("../img/globe.png");
	    background-position: 110% -5px;
	    background-repeat: no-repeat;*/
	    margin: 0;
	    padding: 10px 0;
	}

	.clear {
		clear:both;
	}


	@media (max-width:991px) {
		div.well2 {
			margin-left:auto;
			margin-right:auto;
		}

		ul.cat li{
			display:block;
			float:left;
			width: 100%;
			text-align:center;
			background-color:#e6e6e6;
		}

		ul.cat li.active {
		 	border-width: 0px;
		    font-weight: normal;
		    margin-bottom: 0px;
		    background-color:#f26522;
            color:#ffffff;
		}
	}

</style>
{/literal}

{if $backorder_module_installed}
    <script src="../modules/addons/ispapibackorder/templates/lib/noty-2.4.1/jquery.noty.packaged.min.js"></script>
{/if}

<div class="domain-checker-container2">
<div class="domain-checker-bg2">
<form method="post" action="index.php?m=ispapicheckdomain" class="form-horizontal" id="searchform">
	<input type="hidden" name="tldgroup" value="">
	<input type="hidden" name="searched_domain" value="">

	<div class="well2">
	    <ul class="cat">
	    {foreach from=$categories item=cat}
	    	<li id="cat_{$cat.id}">{$cat.name}</li>
	    {/foreach}
	    </ul>
	    <div class="clear"></div>
	    <div id="filter">
		    {foreach from=$categories item=cat}
		    <div class="catcontainer" id="container_cat_{$cat.id}" style="display:none;">
		    	<ul class="sub">
			    	 {foreach from=$cat.subcategories item=sub}
			    	 	<li id="s_{$sub.id}">{$sub.name}</li>
			    	 {/foreach}
			    </ul>
		    </div>
		    {/foreach}

		    <div class="clear"></div>

			<br>

		    <div class="text-center">
				<div class="row">
					<div class="col-md-8 col-md-offset-2 col-xs-10 col-xs-offset-1">
						<div class="input-group input-group-lg input-group-box">
							<input style="background:white;border:3px solid #0033a0;border-radius:10px;font-size:16px;width:750px;" id="searchfield" name="domain" class="form-control" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$LANG.domaincheckerdomainexample}">
							<!--<span class="input-group-btn">-->
								<button id="searchbutton" class="btn btn-primary" style="line-height:22px;background-color:#f26522;border:none;position:absolute;font-size:14px;margin-left:-48px;margin-top:6px;z-index:1000;" type="button">Go<!--{$LANG.checkavailability}--></button>
							<!--</span>-->
						</div>
					</div>
				</div>
		    </div>
	    </div>
	</div>

</form>
</div>
</div>

<div class="alert text-center" id="loading" style="display:none;"><img src="{$modulepath}loading.gif"/></div>
<div class="alert alert-danger text-center" id="errorsarea" style="display:none;"></div>
<div class="domain-checker-result-headline"><p class="domain-checker-available" id="successarea" style="display:none;"></p></div>


<div class="domainresults" id="resultsarea" style="display:none;">
<div>Search Results</div>
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
		<table class="table table-curved table-hover">
			<tbody id="searchresults"></tbody>
		</table>
		<p align="center" id="orderbuttonloading" style="display:none;"><img src="{$modulepath}loading.gif"/></p>
		<p align="center"><input id="orderbutton" type="button" value="{$LANG.ordernowbutton} &raquo;" class="btn btn-danger" /></p>
		<br>
	</form>
</div>



<div id="pricingTable" style="display:visible;">
    <div class="panel-group" id="accordion" role="tablist" aria-multiselectable="true">
        <div class="panel panel-default">
            <div class="panel-heading" role="tab" id="heading{$tldCategory->id}">
                <h4 class="panel-title">
                    <a data-toggle="collapse" data-parent="#accordion" href="#collapseAll" aria-expanded="false" aria-controls="collapseAll" class="domain-tld-pricing-category">
                        {$LANG.alltldpricing}
                    </a>
                </h4>
            </div>
            <div id="collapseAll" class="panel-collapse collapse" role="tabpanel" aria-labelledby="headingAll">
                <div class="panel-body">
                    <div class="row">
                        <div class="col-md-10 col-md-offset-1 col-lg-8 col-lg-offset-2 table-responsive domain-tld-pricing-table-responsive">
                            <table class="table table-striped table-framed">
                                <thead>
                                    <tr>
                                        <th class="text-center">{$LANG.domaintld}</th>
                                        <th class="text-center">{$LANG.domainminyears}</th>
                                        <th class="text-center">{$LANG.domainsregister}</th>
                                        <th class="text-center">{$LANG.domainstransfer}</th>
                                        <th class="text-center">{$LANG.domainsrenew}</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {foreach $tldpricelist as $tld}
                                        <tr>
                                            <td>{$tld.tld}</td>
                                            <td class="text-center">{$tld.period}</td>
                                            <td class="text-center">{if $tld.register}{$tld.register}{else}{$LANG.domainregnotavailable}{/if}</td>
                                            <td class="text-center">{if $tld.transfer}{$tld.transfer}{else}{$LANG.domainregnotavailable}{/if}</td>
                                            <td class="text-center">{if $tld.renew}{$tld.renew}{else}{$LANG.domainregnotavailable}{/if}</td>
                                        </tr>
                                    {/foreach}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

{if !$loggedin && $currencies}
    <div class="currencychooser pull-right clearfix margin-bottom">
        <div class="btn-group" role="group">
            {foreach from=$currencies item=curr}
                <a href="?currency={$curr.id}" class="btn btn-default{if $currency.id eq $curr.id} active{/if}">
                    <img src="{$BASE_PATH_IMG}/flags/{if $curr.code eq "AUD"}au{elseif $curr.code eq "CAD"}ca{elseif $curr.code eq "EUR"}eu{elseif $curr.code eq "GBP"}gb{elseif $curr.code eq "INR"}in{elseif $curr.code eq "JPY"}jp{elseif $curr.code eq "USD"}us{elseif $curr.code eq "ZAR"}za{else}na{/if}.png" border="0" alt="" />
                    {$curr.code}
                </a>
            {/foreach}
        </div>
    </div>
    <div class="clearfix"></div>
{/if}
{include file="$template/includes/modal.tpl" name="Whois" title=$LANG.whoisresults|cat:' <span id="whoisDomainName"></span>'}
