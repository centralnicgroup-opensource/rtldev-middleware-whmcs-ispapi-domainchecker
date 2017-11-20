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
		location.href = "{/literal}{$modulepath}{literal}../../../cart.php?a=confdomains";
	});

	$('#searchform').submit(function(e){
	    e.preventDefault();
	});

	$('#searchfield').bind("enterKey",function(e){
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

					//create selectbox with the price
                    if(element.price.domainregister && element.price.domainregister[1] != -1){
                        var price = '<span name="domainsregperiod['+element.id+']">';
                        $.each(element.price.domainregister, function(index, p){
                            if(element.premiumchannel == "NAMEMEDIA"){
                                price = price + '<span class="period" value="'+index+'">'+p+'</span>';
                            }else{
                                price = price + '<span class=" t period " value="'+index+'">'+p+'</span>';
                            }
                        });
						price = price + '</span>';
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
                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                            $( "#" + id).children().children().children().next().addClass('added');
                            $("#" + id).children().next().children().html(price);
                            price =  '<span class="period ">Added</span><br/>'+price;
                            $("#" + id).children().next().next().children().children().html(price);
                            $( "#" + id).children().next().children().children().children().addClass('added');
                            $("#" + id).children().next().addClass('details');
                            $("#" + id).children().next().addClass('hide');
                            $( "#" + id).children().next().next().children().children().children().children().addClass('added');
                            $("#" + id).children().next().next().removeClass('details');
                            $("#" + id).children().next().next().removeClass('hide');

                        }else{
                            $( "#" + id).children().children().children().next().addClass('available');
                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                            $("#" + id).children().next().children().html(price);
                            price = '<span class="period added">Added</span><br/>'+price;
                            $("#" + id).children().next().next().children().children().html(price);
                        }

						$( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");

                        <!--TODO-->
					}else if(element.code == "423"){
						$( "#" + id + " div.availability").html("<span class='label label-warning'>SERVICE OFFLINE</span>").addClass("domcheckererror");
					}else if(element.code == "541"){
						$( "#" + id + " div.availability").html("<span class='label label-warning'>Invalid domain name</span>").addClass("domcheckererror");
					}else if(element.code == "549"){
						$( "#" + id + " div.availability").html("<span class='label label-warning'>Unsupported TLD</span>").addClass("domcheckererror");
					}
                    else{
						//if premium class
						if(element.class){

							if(priceavailable){

                                $( "#" + id + " span.checkboxarea").html('<input class="checkbox" type="checkbox" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><label for="checkboxId'+element.id+'"><i class="fa fa-square-o" aria-hidden="true"></i></label>');
							}
                            $( "#" + id + " div.availability").html('<span class="taken">{/literal}{$LANG.domaincheckertaken}{literal}</span><span class="premium"> - '+element.premiumchannel+' PREMIUM</span>');

                            $( "#" + id).children().eq(0).removeClass("search-result-info");
                            $( "#" + id).children().eq(0).removeClass("clickable");

						}else{
                            $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>");

                            $( "#" + id).children().eq(0).removeClass("search-result-info");
                            $( "#" + id).children().eq(0).removeClass("clickable");

                            if(element.backorder_installed == "1" && element.backorder_available == 1){

                                $( "#" + id).children().eq(0).addClass("search-result-info");
                                $( "#" + id).children().eq(0).addClass("clickable");

                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder'> - BACKORDER</span>");
                                $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="' +element.id+'"><i class=" fa fa-square-o" aria-hidden="true"></i></label>');

                                if(element.backordered==1){
                                        $( "#" + id).children().next().next().hide();
                                        $( "#" + id).children().children().children().next().addClass("added");
                                        $( "#" + id + " div.availability").html("<span class='added'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='added'> - BACKORDER</span>");
                                        $( "#" + id + " span.checkboxarea").html('<label class="added setbackorder" value="' +element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                                        $( "#" + id + " div.search-result-price").html('<div class="second-line price style="display:none"><span class="period added">Backorder Placed</span></div>');
                                }
                                else{
                                    $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder'> - BACKORDER</span>");
                                    $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="' +element.id+'"><i class=" fa fa-square-o" aria-hidden="true"></i></label>');
                                    $( "#" + id + " div.search-result-price.details.hide").html('<div class="second-line price"><span class="period added">Backorder Placed</span></div>');
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
                    var idsOfSubCat = $("#searchform").children().eq(6).children().eq(2).children().children().children().children().children().children().children().children();
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

                    $('#searchresults').append('<div id="' + id + '" ><div class="col-xs-7 search-result-info clickable"><div class="first-line"><span class="checkboxarea"></span><span class=" t domain-label " ><strong>' + element + '</strong></span></div><div class="second-line availability"><span>{/literal}{$LANG.loading}{literal}</span></div></div><div class="col-xs-5 search-result-price"><div class="second-line price"></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price><span class="period added">Added</span><br/><span class="period added"></span></div></div></div>');

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

        $(this).children().children().children().children().toggleClass('fa-check-square');
        $(this).children().children().children().next().children().toggleClass('fa-check-square');

        $(this).siblings().children().find('span.t').toggleClass('added');
        $(this).children().find('span.t').toggleClass('added');
        $(this).children().next().children().toggleClass('added');

        $(this).siblings().toggleClass('details hide');

        if($(this).children().find('span.t').hasClass('available') && $(this).children().find('span.t').hasClass('added')){
            var params = {};

            params['a'] = 'addToCart';
            params['domain'] = $(this).children().children().children().attr("value");
            params['token'] = $("#domainform").children().attr("value");

            $.ajax({
                  url: "{/literal}{$modulepath}{literal}../../../cart.php?a=add&domain=register",
                  type: "POST",
                  data: params,
                  async: false
            });
        }
        else{
            var domainInCart = $(this).children().children().children().attr("value");
            $.ajax({
                  type: "GET",
                  async: false,
                  url: "{/literal}{$modulepath}{literal}ajax.php?action=removeFromCart&domain="+domainInCart
            });
        }

        if($(this).children().children().children().hasClass('setbackorder')){

            var icon = $(this).children().children().children();
            var command = "CreateBackorder";

            if ($(this).children().children().children().hasClass("added")){
                command = "DeleteBackorder";
            }
            $.ajax({
                type: "POST",
                async: true,
                dataType: "json",
                url: "{/literal}{$backorder_module_path}{literal}backend/call.php",
                data: {
                    COMMAND: command,
                    DOMAIN:$(this).children().children().children().attr("value"),
                    TYPE: "FULL"
                },
                success: function(data) {
                    if(command=="CreateBackorder" && data.CODE==200){
                        icon.addClass("added");
                        noty({text: 'Backorder successfully created.', type: 'success', layout: 'bottomRight'}).setTimeout(3000);
                    }
                    else if(command=="DeleteBackorder" && data.CODE==200){
                        $(this).siblings().children().find('span.t').removeClass('added');
                        icon.removeClass("added");;
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

<style>

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

        #searchfield {
            width:600px;
        }

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

    @media (min-width:1200px) {
        #searchfield {
            width:750px;
        }
    }

    @media (max-width:1200px) {
        #searchfield {
            width:600px;
        }
    }

    @media (max-width:767px){
        #searchfield {
            width:250px;
        }
    }

    <!--  a  -->
    @import url(//netdna.bootstrapcdn.com/font-awesome/3.2.1/css/font-awesome.css);

    .checkboxarea {
      display: block;
      padding-left: 15px;
      text-indent: -15px;
    }
    .checkbox{
        display:none;
    }

    .fa.fa-square-o.fa-check-square{
        position:absolute;
        font-size:22px;
        color: #00a850;
    }
    hr.first-domain-separator {
       width: 100%;
       text-align: center;
       border-bottom: 1px solid #00a850;
       line-height: 0.1em;
       margin: 5px 0 10px;
   }

   .clickable {
       cursor: pointer;
   }
   .first-line .tld-zone {
        font-weight: bold;
        font-size: 15px;
        color: #939598;
    }
    .first-line .domain-label{
        font-weight: lighter;
        color: #939598;
        line-height: 1.45;
        font-size: 15px;
        margin-left: 30px;
        margin-right: 1px;
    }
    .avail.fa.fa-square-o{
        position:absolute;
        font-size:22px;
        color: #00a850;
    }

    .fa.fa-square-o{
        position:absolute;
        font-size:22px;
        color: #939598;
    }
    .domain-label:hover {
        color: #f26522;
    }
    .clicked .domain-label {
        padding-left: 30px;
        color: white;
    }
    .domain-label.available.added {
        color: #00a850;
    }
    .domain-label.available{
        color: #0033a0;
    }

    div.second-line{
        margin-top: 3px;
        margin-left: 30px;
    }
    .second-line{
        display: block;
        max-height: 14px;
        font-size: 80%;
        font-weight: bold;
        margin-left: 132px;
        margin-top: -6px;
    }
    span.period {
        font-size: 15px;
        color: #f26522;
    }

    .search-result-price {
        text-align: right;
        margin-bottom: 50px;
    }

    .added {
        font-weight: bold;
        color: #00a850; !important;
    }
    .domain-label.added{
        font-weight: bold;
        color: #00a850; !important;
    }
    .row1{
        margin-left: 190px;
        margin-right: 190px;
    }
    .details.hide {
        display:none;
    }
    .period.added{
        color: #00a850;
    }
    .available {
        font-size: 11px;
        color: #00a850;
        font-weight: 700;
    }
    .backorder.added{
        color: #00a850;
    }
    .backorder {
        font-size: 11px;
        font-weight: 700;
        text-transform: capitalize;
        color: #0033a0;
    }
    .premium {
        font-size: 11px;
        font-weight: 700;
        text-transform: capitalize;
        color: #0033a0;
    }
    .resultson .search-form {
      margin-top: 0;
    }
    .resultson .search-form .search-state {
      padding-right: 77px;
      display: none;
    }
    .resultson .search-form .search-btn {
      right: 82px;
    }
    .resultson .search-form .collapse-category .category-button {
      display: block;
    }
    .search-form {
      margin-top: 100px;
      position: relative;
    }
    .search-form .search-state {
      text-align: right;
      margin-bottom: 5px;
    }

    .search-form .search-input-bar {
      margin-bottom: 10px;
    }
    .search-form .search-input-bar .input-group {
      min-width: 100%;
      color: #939598;
    }
    @media (max-width: 549px) {
      .search-form .search-input-bar .input-group {
        margin-bottom: 10px;
      }
    }
    .search-form .search-input-bar .input-group .search-btn {
      background-color: #f26522;
      color: #fff;
      border-radius: 5px;
      border: none;
    }
    .search-form .search-input-bar .input-group .search-btn:focus {
      outline: none;
      border: none;
    }
    .search-form .search-input-bar .input-group .singlesearch:focus:-webkit-input-placeholder {
      color: transparent;
    }
    .search-form .search-input-bar .input-group .singlesearch:focus::-moz-placeholder {
      color: transparent;
    }
    .search-form .search-input-bar .input-group .singlesearch:focus::-webkit-input-placeholder {
      color: transparent;
    }
    .search-form .search-input-bar .input-group .singlesearch:focus:-ms-input-placeholder {
      color: transparent;
    }
    .search-form .search-input-bar .input-group .bulksearch,
    .search-form .search-input-bar .input-group .singlesearch {
      background: transparent;
      border: 3px solid #0033a0;
      border-radius: 10px;
      font-size: 18px;
    }
    .search-form .search-input-bar .input-group .singlesearch {
      margin-left: 0;
      height: 44px;
    }
    .search-form .search-input-bar .input-group .bulksearch {
      resize: vertical;
    }
    .search-form .settings-icons {
      margin-bottom: 10px;
      text-align: center;
      color: #939598;
    }
    .search-form .settings-icons > div,
    .search-form .settings-icons label {
      cursor: pointer;
    }
    .search-form .settings-icons .active {
      color: #00a850;
    }
    .search-form .settings-icons .table-switch i {
      font-size: 26px;
    }
    .search-form .settings-icons label {
      font-size: 11px;
      text-transform: uppercase;
      line-height: 1.2;
    }
    .search-form .collapse-category {
      text-align: center;
      margin-bottom: 10px;
    }
    .search-form .collapse-category .category-button {
      padding: 0;
      margin: 0 auto;
      border: none;
      background: transparent;
      font-weight: 600;
      font-size: 12px;
      text-transform: uppercase;
      /*display: none;*/
      color: #939598;
    }
    .search-form .collapse-category .category-button i {
      font-size: 24px;
    }
    .search-form .collapse-category .category-button:hover {
      text-decoration: none;
    }
    .search-form .collapse-category .category-button:focus {
      text-decoration: none;
      outline: none;
    }
    .search-form .collapse-category .category-item {
      display: inline-block;
      /*margin: 10px 4px 0;*/  /*gaps inbetween the category items*/
    }
    .search-form .collapse-category .category-item.continents {
      margin-top: 0;
      cursor: pointer;
    }
    .search-form .collapse-category .category-item.continents .category-label {
      margin-top: 0;
      cursor: pointer;
    }
    /*.search-form .collapse-category .category-item.icon {
      margin-bottom: 10px;
    }*/
    .search-form .collapse-category .category-item .category-label {
      font-size: 80%;
      font-weight: 600;
      margin-top: 10px;
    }
    /*.search-form .collapse-category input {
      display: none;
    }*/
    .input-group .inner-addon .addon {
      position: absolute;
      padding: 6px;
    }
    .input-group .inner-addon .input-box {
      z-index: 0;
    }
    .input-group .inner-addon.left-addon .addon {
      left: 0;
    }
    .input-group .inner-addon.left-addon .input-box {
      padding-left: 50px;
    }
    .input-group .inner-addon.right-addon .addon {
      right: 0;
    }
    .input-group .inner-addon.right-addon .input-box {
      padding-right: 50px;
    }
    .input-group .input-group-addon.shoppingcart {
      background-color: transparent;
      border: none;
      vertical-align: top;
      min-width: 77px;
      padding-right: 0;
    }
    .resultson .search-form .search-btn {
      right: 82px;
    }

</style>
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
</head>

	<input type="hidden" name="tldgroup" value="">
	<input type="hidden" name="searched_domain" value="">

    <div class="text-center">
        <div class="row">
            <div class="col-md-8 col-md-offset-2 col-xs-10 col-xs-offset-1">
                <div class="input-group input-group-lg input-group-box">
                    <input style="background:white;border:3px solid #0033a0;border-radius:10px;font-size:16px;" id="searchfield" name="domain" class="form-control" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$LANG.domaincheckerdomainexample}">
                    <!-- <span class="input-group-btn"> -->
                        <button id="searchbutton" class="btn btn-primary" style="line-height:22px;background-color:#f26522;border:none;position:absolute;font-size:14px;margin-left:-48px;margin-top:6px;z-index:1000;" type="button">Go </button>
                    <!-- </span> -->
                 </div>
            </div>
        </div>
    </div>

<!-- <div class="text-center">
    <div class="row search-input-bar">
        <div class="col-xs-12">
            <div class="input-group">
                <div class="inner-addon right-addon"> -->
                    <!-- <input type="text" id="text" onkeyup ="searchBox()" class="form-control singlesearch input-box"/> -->
                    <!-- <input type="text" class="form-control singlesearch input-box"/>
                    <div class="addon">
                        <button id="searchbutton" class="btn btn-default search-btn">GO</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div> -->

    <!-- CATEGORY -->
<div id="categories" class="row1 row collapse-category">
    <br/>
    <div class="col-xs-12 category-setting">
        <button class="category-button" type="button" data-toggle="collapse" data-target="#category" >
            <span>CATEGORIES</span>
            <br />
            <!-- <i class="button fa fa-toggle-off"></i> -->
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
                                <ul class="sub">
                                  {foreach from=$categories item=cat}
                        			  {foreach from=$cat.subcategories item=sub}
                        			    	<li class="subCat" id="s_{$sub.id}">{$sub.name}</li>
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


<!-- <div class="domainresults" id="resultsarea" style="display:none;">
<div>Search Results</div>
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
		<table class="table table-curved table-hover">
			<tbody id="searchresults"></tbody>
		</table>
		<p align="center" id="orderbuttonloading" style="display:none;"><img src="{$modulepath}loading.gif"/></p>
		<p align="center"><input id="orderbutton" type="button" value="{$LANG.ordernowbutton} &raquo;" class="btn btn-danger" /></p>
		<br>
	</form>
</div> -->

<div class="result-item" id="resultsarea" style="display:none;">
<!-- <div>Search Results</div><br /> -->
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
        <div class="row row1" id="searchresults">
        </div>
		<p align="center" id="orderbuttonloading" style="display:none;"><img src="{$modulepath}loading.gif"/></p>
		<p align="center"><input id="orderbutton" type="button" value="{$LANG.checkoutbutton} &raquo;" class="btn btn-danger" /></p>
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
