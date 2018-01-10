

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
    console.log("HERE\n");
	var count = 0;

	$("#orderbutton").bind("click", function(e){
		$("#orderbutton").hide();
		$("#orderbuttonloading").show();
		location.href = "{/literal}{$modulepath}{literal}../../../cart.php?a=confdomains";
	});

	$('#searchform').submit(function(e){
	    e.preventDefault();
	});

	$('#searchfield').bind("enterKey",function(e){
        // console.log(e);
		$("#searchbutton").trigger("click");
	});

	$('#searchfield').keyup(function(e){
        if(e.keyCode == 13){
            $(this).trigger("enterKey");
	    }
	});

    //handle the categories events
    $(".subCat").bind("click", function(){
        $(this).toggleClass('active');

        var tmpid = [];
        $(".sub").find("li").each(function() {
            if($(this).hasClass('active')){
                var id = $(this).attr("id").substring(2);
                tmpid.push(id);
            }
        });
        tmpid = jQuery.unique( tmpid );
        $("#searchform input[name=tldgroup]").attr("value", tmpid);
        $("#searchbutton").trigger("click");
	})

	function checkdomains(domains, cached_data){
        // console.log(domains);

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

				$.each(data["data"], function(index, element) {
					var id = jQuery.escapeSelector(element.id); //.replace(/\./g, '');

					$( "#" + id).addClass(element.checkover);

                    // alert(element.price.renewalprice);
					//create selectbox with the price
                    if(element.price.domainregister && element.price.domainregister[1] != -1 || element.price.domainrenew){

                        var renewalprice = '<span name="domainsregperiod['+element.id+']">';
                        var price = '<span name="domainsregperiod['+element.id+']">';
                        $.each(element.price.domainregister, function(index, p){
                            if(element.premiumchannel == "NAMEMEDIA"){
                                price = price + '<span class="period" value="'+index+'">'+p+'</span>';
                            }else{
                                price = price + '<span class=" t period " value="'+index+'">'+p+'</span>';
                            }
                        });
                        $.each(element.price.domainrenew, function(index, rp){
                            renewalprice = renewalprice + '<span class="renewal" value="'+index+'">Renewal: '+rp+'</span>';
                        });
						price = price + '</span>';
                        renewalprice = renewalprice + '</span>';

						var priceavailable = true;
					}else{
						var price = "Pricing not found";
						var priceavailable = false;
					}

                    var domainsInCart = [];
                    if(element.cart){
                        $.each(element.cart.domains, function(n, currentElem) {
                            domainsInCart.push(currentElem.domain);
                        });
                    }

                    if(element.code == "210"){

                        if (domainsInCart.indexOf(element.id) > -1) {
                            var test = $("#domainform input[id=orderbutton]");
                            $("#domainform input[id=orderbutton]").removeClass('hide');

                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                            $( "#" + id).find('span.t.domain-label').addClass('available added');
                            $("#" + id).find('div.second-line').html(price);
                            price =  '<span class="period ">Added</span><br/>'+price;
                            $("#" + id).find('span').eq(8).html(price);
                            $( "#" + id).find('span.period').addClass('added');
                            $("#" + id).find('div.search-result-price').addClass('details hide');
                            $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                        }else{

                            $( "#" + id).find('span.t.domain-label').addClass('available');
                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                            $("#" + id).find('div.second-line.price').html(price);
                            $("#" + id).find('div.second-line.renewalprice').html(renewalprice);
                            price = '<span class="period added">Added</span><br/>'+price;
                            $("#" + id).find('span.period.added').html(price);
                        }

						$( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");

                        <!--TODO-->
					}else if(element.code == "423"){
						$( "#" + id + " div.availability").html("<span class='label label-warning'>SERVICE OFFLINE</span>").addClass("domcheckererror");
					}else if(element.code == "541"){
						$( "#" + id + " div.availability").html("<span class='label label-warning'>Invalid domain name</span>").addClass("domcheckererror");
					}else if(element.code == "549"){
                        // $( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");
						$( "#" + id + " div.availability").html("<span class='taken' style='font-size:12px;'>Unsupported TLD</span>");
                        price = '<span class="period added"></span><br/>'+'';
                        $("#" + id).find('div.second-line.price').html(price);
                        $("#" + id).find('div.second-line.renewalprice').html(renewalprice);

					}
                    else{

						//if premium class
						if(element.class){
                            if (domainsInCart.indexOf(element.id) > -1) {

                                $("#domainform input[id=orderbutton]").removeClass('hide');
                                $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                                $( "#" + id).find('span.t.domain-label').addClass('available added');
                                $("#" + id).find('div.second-line').html(price);
                                price =  '<span class="period ">Added</span><br/>'+price;
                                // console.log($("#" + id).find('span').eq(8));
                                $("#" + id).find('span').eq(8).html(price);
                                $( "#" + id).find('span.period').addClass('added');
                                $("#" + id).find('div.search-result-price').addClass('details hide');
                                $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                                $( "#" + id + " div.availability").html('<span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium added" value="'+element.id+'"> - '+element.premiumchannel+' PREMIUM</span>');


                            }else{

                                $( "#" + id).find('span.t.domain-label').addClass('available');
                                if(priceavailable){
                                    $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                    // $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                    // $( "#" + id + " span.checkboxarea").html('<input class="checkbox" type="checkbox" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><label for="checkboxId'+element.id+'"><i class="fa fa-square-o" aria-hidden="true"></i></label>');
                                }
                                // else{
                                //     var spanelement = '<span class="spanelement">span<span></span></span>';
                                //     $("#" + id).find('div.second-line.price').html(spanelement);
                                // }

                                // TODO
                                if(price == "Pricing not found"){

                                    $("#" + id).find('div.second-line.renewalprice').html(price).addClass('taken');
                                    $("#" + id).find('div.second-line.price').html(price).addClass('hide');
                                    var spanelement = '<span class="spanelement">span<span></span></span>';
                                    $("#" + id).find('div.second-line.price').html(spanelement);
                                    $( "#" + id).find('span.t.domain-label').removeClass('available');
                                    $( "#" + id).find('div.col-xs-7').removeClass("search-result-info clickable");
                                }
                                // $("#" + id).find('div.second-line').html(price);

                                $("#" + id).find('div.second-line.price').html(price);
                                $("#" + id).find('div.second-line.renewalprice').html(renewalprice);

                                price = '<span class="period added">Added</span><br/>'+price;
                                $("#" + id).find('span.period.added').html(price);

                                // remove value="'+element.id+'" for span class premium TODO
                                $( "#" + id + " div.availability").html('<span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium " value="'+element.id+'"> - '+element.premiumchannel+' PREMIUM</span>');


                                // $( "#" + id + " div.availability").html('<span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium"> - '+element.premiumchannel+' PREMIUM</span>');



                                // OLD
                                // $( "#" + id + " div.availability").html('<span class="taken">{/literal}{$LANG.domaincheckertaken}{literal}</span><span class="premium"> - '+element.premiumchannel+' PREMIUM</span>');
                                // $( "#" + id).find('div.col-xs-7').removeClass("search-result-info clickable");
                            }


						}else{

                            $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>");
                            $( "#" + id).find('div.col-xs-7').removeClass("search-result-info clickable");
                            // var spanelement = '<span class="spanelement">span<span></span></span>';
                            var spanelement = '<span class="spanelement">span</span>';
                            $("#" + id).find('div.second-line.price').html(spanelement);
                            $("#" + id).find('div.second-line.renewalprice').html(spanelement);

                            if(element.backorder_installed == "1" && element.backorder_available == 1){

                                $( "#" + id).find('div.col-xs-7').addClass("search-result-info clickable");
                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder added'> - BACKORDER</span>");
                                $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="' +element.id+'"><i class=" fa fa-square-o" aria-hidden="true"></i></label>');

                                if(element.backordered==1){
                                        $( "#" + id).find('span.t.domain-label').addClass('added');
                                        $( "#" + id + " div.availability").html("<span class='added'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder added'> - BACKORDER</span>");
                                        $( "#" + id + " span.checkboxarea").html('<label class="added setbackorder" value="' +element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                                        $( "#" + id + " div.second-line.renewalprice").html('<span class="period added">Backorder Placed</span>');

                                        // var test = $( "#" + id + " div.second-line.price");
                                        // console.log(test);
                                        // $( "#" + id + " div.search-result-price.details.hide").find('div').html('<span class="period added">Backorder Placed</span>');

                                        // $("#" + id).find('div.second-line.renewalprice').html('<span class="period added">Backorder Placed</span>');


                                        // var test = $("#" + id).find('div.second-line.price').children().eq(0);
                                        // $("#" + id).find('div.second-line.price').children().eq(0).addClass('details hide');
                                        // console.log(test);


                                        // $( "#" + id + " div.search-result-price").find('div.price').html('<span class="period added">Backorder Placed</span>');
                                        // var test = $( "#" + id + " div.search-result-price").find('div').eq(0);
                                        // console.log(test);
                                        // $( "#" + id + " div.search-result-price").find('div').eq(0).html('<span style="display:block;" class="period added">Backorder Placed</span>');
                                        // $( "#" + id + " div.second-line").eq(1).html('<span class="period added">Backorder Placed</span>');
                                }
                                else{
                                    $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder'> - BACKORDER</span>");
                                    $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="' +element.id+'"><i class=" fa fa-square-o" aria-hidden="true"></i></label>');

                                    $( "#" + id + " div.search-result-price.details.hide").find('div').html('<span class="period added">Backorder Placed</span>');
                                    // $( "#" + id + " div.search-result-price.details.hide").insertAfter(spanelement, $( "#" + id + " div.search-result-price.details.hide").children().eq(0));
                                    // $( "#" + id + " div.search-result-price.details.hide").appendChild('<div><span class="spanelement">span</span></div>')

                                    // var afteradd = $("#" + id).find('div.search-result-price.details.hide').children().eq(0);
                                    // $( "#" + id + " div.search-result-price.details.hide").html('<div><span class="period added">Backorder Placed</span></div>');
                                    // $("#" + id).find('div.search-result-price.details.hide').children().eq(0).html(spanelement);


                                    // var test = $("#s" + id).find('div.search-result-price.details.hide');
                                    // console.log(test);
                                    // $("#" + id).find('div.search-result-price.details.hide').html(test1);
                                    // var test = $("#" + id).find('div.search-result-price');
                                    // console.log(test);





                                    // $("#" + id).find('div.second-line.price').html('<span class="period added">Backorder Placed</span>');
                                    // $( "#" + id + " div.search-result-price.details.hide").find('div.second-line.renewalprice').html('<span class="period added">Backorder Placed</span>');

                                    // $("#" + id).find('div.search-result-price').html(spanelement);
                                    // $("#" + id).find('div.second-line.renewalprice').html(spanelement);
                                    // $("#" + id).find('div.second-line.price').html(spanelement);
                                    // $( "#" + id + " div.search-result-price.details.hide").find('div').html('<span class="period added">Backorder Placed</span>');
                                }
                            }
						}
					}
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
                if($("#searchform input[name=tldgroup").attr("value") == ''){
                    var idsOfSubCat = $("#searchform").find('li');
                    var tmpid = [];
                    idsOfSubCat.each(function(){
                        var id = $(this).attr("id").substring(2);
                        tmpid.push(id);
                    });
                    $("#searchform input[name=tldgroup").attr("value",tmpid);
                }
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
				$('#searchresults').find("div").remove();

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

                    var tld = element.split(".");
                    tld = tld[0];

                    var index = element.indexOf(".");
                    var idtld = element.substr(0, index);
                    var zone = element.substr(index + 0).bold();

                    $('#searchresults').append('<div id="' + id + '" ><div class="col-xs-7 search-result-info clickable"><div class="first-line"><span class="checkboxarea"></span><span class=" t domain-label " >' + tld+zone + '</span></div><div class="second-line availability"><span></span></div></div><div class="col-xs-5 search-result-price"><div class="second-line price"></div><div class="second-line renewalprice"></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price><span class="period added"></span><span class="period added"></span></div></div></div>');

                    // $('#searchresults').append('<div id="' + id + '" ><div class="col-xs-7 search-result-info clickable"><div class="first-line"><span class="checkboxarea"></span><span class=" t domain-label " >' + tld+zone + '</span></div><div class="second-line availability"><span>{/literal}{$LANG.loading}{literal}</span></div></div><div class="col-xs-5 search-result-price"><div class="second-line price"></div><div class="second-line renewalprice"></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price><span class="period added"></span><span class="period added"></span></div></div></div>');

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

							var price = '<span name="domainsregperiod['+element.id+']">';

							$.each(element.price.domainregister, function(index, element){
								price = price + '<span value="'+index+'">'+element+'</span>';
							});

							price = price + '</span>';
							var pricing_available = true;

						}else{
							var price = "Pricing not found";
							var pricing_available = false;
						}

						if(!already_existing){
							if(pricing_available){

                                $('#searchresults').append( '<div id="' + id + '" class="api"><div class="col-xs-7 search-result-info clickable" ><div class="first-line"><span class="checkboxarea"><label value="'+element.id+":"+element.class+'" name="premiumdomains[]" id="checkboxId' + id + '"><i class="avail fa fa-square-o" aria-hidden="true"></i></label></span><span class=" t domain-label available " ><strong>' + element.id + '</strong></span></div><div class="second-line availability"><span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium"> - NAMEMEDIA PREMIUM</span></div></div><div id="pricetest" class="col-xs-5 search-result-price"><div class="second-line price"><span class="period">'+price+'</span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price"><span class="period added">Added</span><br/><span class="period added">'+price+'</span></div></div><br/></div>');

							}else{

                                $('#searchresults').append( '<div id="' + id + '" class="api"><div class="col-xs-7 search-result-info clickable" ><div class="first-line"><span class="checkboxarea"><label value="'+element.id+":"+element.class+'" name="premiumdomains[]" id="checkboxId' + id + '"><i class="avail fa fa-square-o" aria-hidden="true"></i></label></span><span class=" t domain-label available " ><strong>' + element.id + '</strong></span></div><div class="second-line availability"><span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium"> - NAMEMEDIA PREMIUM</span></div></div><div id="pricetest" class="col-xs-5 search-result-price"><div class="second-line price"><span class="period">'+price+'</span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price"><span class="period added">Added</span><br/><span class="period added">'+price+'</span></div></div><br/></div>');
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


    $(document).on("click",".search-result-info", function() {

        $(this).find('i.fa-square-o').toggleClass('fa-check-square');
        $(this).siblings().find('span.t').toggleClass('added');
        $(this).find('span.t').toggleClass('added');
        $(this).find('span').eq(2).toggleClass('added');
        $(this).find('span.backorder').toggleClass('added');
        $(this).find('span.premium').toggleClass('added');
        $(this).siblings().toggleClass('details hide');

        // $(this).find('div.renewalprice').toggleClass('details hide');

        // $(this).siblings().eq(1).find('div.renewalprice').toggleClass('details hide');
        // $(this).siblings().eq(1).find('div.renewalprice').toggleClass('details hide');
        var test = $(this).siblings().eq(1).find('div.renewalprice');
        // console.log(test);


        if($(this).find('span.t.domain-label').hasClass('available') && $(this).find('span.t.domain-label').hasClass('added')){

            $("#domainform input[id=orderbutton]").removeClass('hide');

            var params = {};

            params['a'] = 'addToCart';
            params['domain'] = $(this).find('label').attr("value");
            params['token'] = $("#domainform").find('input').eq(0).attr("value");

            if($(this).find('span').hasClass('premium')){
                var paramspremium = {};
                var price = $(this).siblings().find('span.t.period').text();
                var renewalprice = $(this).siblings().find('span.renewal').text();

                var regex = /[\d|,|.|e|E|\+]+/g;
                var registerprice = price.match(regex);
                var renewprice = renewalprice.match(regex);

                paramspremium['action'] = 'addPremiumDomainToCart';
                paramspremium['domain'] = $(this).find('label').attr("value");
                paramspremium['registerprice']= registerprice[0];
                paramspremium['renewalprice']= renewprice[2];

                $.ajax({

                      type: "GET",
                      data: paramspremium,
                      async: false,
                      url: "{/literal}{$modulepath}{literal}ajax.php?"
                });

            }else{
                $.ajax({
                      url: "{/literal}{$modulepath}{literal}../../../cart.php?a=add&domain=register",
                      type: "POST",
                      data: params,
                      async: false
                });

            }

        }
        else{
            if($("#domainform").find('span.t.domain-label').hasClass('added') && $("#domainform").find('span.t.domain-label').hasClass('available')){
                //
            }else{
                $("#domainform input[id=orderbutton]").addClass('hide');
            }
            var domainInCart = $(this).find('label').attr("value");

            $.ajax({
                  type: "GET",
                  async: false,
                  url: "{/literal}{$modulepath}{literal}ajax.php?action=removeFromCart&domain="+domainInCart
            });
        }

        if($(this).find('label').hasClass('setbackorder')){

            var iconLabel = $(this).find('label.setbackorder');
            var command = "CreateBackorder";

            if ($(this).find('label.setbackorder').hasClass("added")){
                command = "DeleteBackorder";
            }
            $.ajax({
                type: "POST",
                async: true,
                dataType: "json",
                url: "{/literal}{$backorder_module_path}{literal}backend/call.php",
                data: {
                    COMMAND: command,
                    DOMAIN:$(this).find('label.setbackorder').attr("value"),
                    TYPE: "FULL"
                },
                success: function(data) {
                    if(command=="CreateBackorder" && data.CODE==200){
                        iconLabel.addClass("added");
                        noty({text: 'Backorder successfully created.', type: 'success', layout: 'bottomRight'}).setTimeout(3000);
                    }
                    else if(command=="DeleteBackorder" && data.CODE==200){
                        iconLabel.removeClass("added");;
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
        }
    });
    $('.category-button').click(function(){
        $(this).find('i.category').toggleClass('fa-angle-up fa-angle-down');
    });

});

</script>

{/literal}

{if $backorder_module_installed}
    <script src="../modules/addons/ispapibackorder/templates/lib/noty-2.4.1/jquery.noty.packaged.min.js"></script>
{/if}

<div class="domain-checker-container2">
<div class="domain-checker-bg2">
<form method="post" action="index.php?m=ispapicheckdomain" id="searchform" class="search-form">
    <head>
        <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
        <link href="style.css" rel="stylesheet" />
        <link rel="stylesheet" href="../modules/addons/ispapidomaincheck/ispapidomaincheck.css">
    </head>

	<input type="hidden" name="tldgroup" value="">
	<input type="hidden" name="searched_domain" value="">

    <div class="row search-input-bar">
        <div class="col-md-8 col-md-offset-2 col-xs-10 col-xs-offset-1">
            <div class="input-group input-group-lg input-group-box">
                <input style="background:white;border:3px solid #0033a0;border-radius:10px;font-size:16px;margin-left:50px;width:230%;" id="searchfield" name="domain" class="form-control" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$LANG.domaincheckerdomainexample}">
                    <button id="searchbutton" class="btn btn-primary" style="line-height:22px;background-color:#f26522;border:none;position:absolute;font-size:14px;margin-left:-48px;margin-top:6px;z-index:1000;" type="button">Go </button>
             </div>
        </div>
    </div>

    <!-- CATEGORY -->
    <div id="categories" class="row1 row collapse-category">
        <br/>
        <div class="col-xs-12 category-setting">
            <button class="category-button" type="button" data-toggle="collapse" data-target="#category" >
                <span>CATEGORIES</span>
                <br />
                <i class="category fa fa-angle-down"></i>
            </button>
        </div>

        <div class="col-xs-12">

            <div class="collapse" id="category">

                <div class="category-item icon">
                    <div class="domain-checker-container2">
                        <div class="domain-checker-bg2">
                            <div class="well2">
                                <div class="catcontainer" > <!-- id="container_cat" -->
                                    <ul class="sub" style="text-align:center;">
                                        {foreach from=$categories item=cat}
                                            {foreach from=$cat.subcategories item=sub}
                                                <li class="subCat" style="margin-right:10px;display:inline-block;" id="s_{$sub.id}">{$sub.name}</li>
                                            {/foreach}
                                        {/foreach}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </form>
</div>
</div>

<!-- <div class="alert text-center" id="loading" style="display:none;"><img src="{$modulepath}loading.gif"/></div> -->
<div class="alert alert-danger text-center" id="errorsarea" style="display:none;"></div>
<div class="domain-checker-result-headline"><p class="domain-checker-available" id="successarea" style="display:none;"></p></div>



<div class="result-item" id="resultsarea" style="display:none;">
<!-- <div>Search Results</div><br /> -->
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
        <div class="row row1" id="searchresults">
        </div>
		<p align="center" id="orderbuttonloading" style="display:none;"><img src="{$modulepath}loading.gif"/></p>
		<p align="center"><input id="orderbutton" type="button" value="{$LANG.checkoutbutton} &raquo;" class="hide btn btn-danger" /></p>
		<br>
	</form>
</div>


<!-- <div id="pricingTable" style="display:visible;">
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
</div> -->

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
