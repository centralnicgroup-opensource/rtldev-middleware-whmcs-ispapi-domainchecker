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

                        var price = '<span name="domainsregperiod['+element.id+']">';

                        $.each(element.price.domainregister, function(index, p){

                            if(element.premiumchannel == "NAMEMEDIA"){
                                price = price + '<span class="period" value="'+index+'">'+p+'</span>';

                            }else{
                                price = price + '<span class=" t period" value="'+index+'">'+p+'</span>';
                            }
                        });

						price = price + '</span>';

						var priceavailable = true;

					}else{
						var price = "Pricing not found";
						var priceavailable = false;
					}

					if(element.code == "210"){

						$( "#" + id + " span.checkboxarea").html('<input class="checkbox" type="checkbox" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><label for="checkboxId'+element.id+'"><i class="avail fa fa-square-o" aria-hidden="true"></i></label>');

                        $("#" + id).children().next().children().html(price);

                        price =  '<span class="period added">Added</span><br/>'+price;

                        $("#" + id).children().next().next().children().children().html(price);

						$( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");

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
                            <!--  remove this later- checkbox for pricing not found-->
                            $( "#" + id + " span.checkboxarea").html('<input class="checkbox" type="checkbox" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><label for="checkboxId'+element.id+'"><i class="fa fa-square-o" aria-hidden="true"></i></label>');

                            $("#" + id).children().next().children().html(price);

							$( "#" + id + " div.availability").html('<span>'+element.premiumchannel+' PREMIUM</span>').addClass("premium");

						}else{

                            if(element.backorder_installed == "1" && element.backorder_available == 1 && element.backordered=="1"){

                                $( "#" + id).children().children().children().next().addClass("added");

                                $( "#" + id).children().next().next().hide()

                                $( "#" + id + " div.availability").html("<span class='added'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='added'> - BACKORDER</span>");

                                $( "#" + id + " span.checkboxarea").html('<label class="added setbackorder" value="' +element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');

                                $( "#" + id + " div.search-result-price").html('<div class="second-line price style="display:none"><span class="period added">Backorder Placed</span></div>');


                            }else{

                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder'> - BACKORDER</span>");
                                $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="' +element.id+'"><i class=" fa fa-square-o" aria-hidden="true"></i></label>');

                                $( "#" + id + " div.search-result-price.details.hide").html('<div class="second-line price"><span class="period added">Backorder Placed</span></div>');

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

                        <!-- if(data["data"][0] == id){ -->
                            <!-- $('#searchresults').append('<hr class="first-domain-separator"></hr>'); -->
                            <!-- $('#searchresults').append('<div id="' + id + '" ><div class="col-xs-7 search-result-info clickable"><div class="first-line"><span class="checkboxarea"></span><span class=" t domain-label " ><strong>' + element + '</strong></span></div><div class="second-line availability"><span>{/literal}{$LANG.loading}{literal}</span></div></div><div class="col-xs-5 search-result-price"><div class="second-line price"><span class="period"></span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price><span class="period added">Added</span><br/><span class="period added"></span></div></div></div>'); -->
                            <!-- $('#searchresults').append('<hr class="first-domain-separator"></hr>'); -->
                        <!-- } -->
                    <!-- else { -->

                        $('#searchresults').append('<div id="' + id + '" ><div class="col-xs-7 search-result-info clickable"><div class="first-line"><span class="checkboxarea"></span><span class=" t domain-label " ><strong>' + element + '</strong></span></div><div class="second-line availability"><span>{/literal}{$LANG.loading}{literal}</span></div></div><div class="col-xs-5 search-result-price"><div class="second-line price"><span class="period"></span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price><span class="period added">Added</span><br/><span class="period added"></span></div></div></div>');

                    <!-- } -->

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

                                $('#searchresults').append( '<div id="' + id + '" class="api"><div class="col-xs-7 search-result-info clickable" ><div class="first-line"><span class="checkboxarea"><input class="checkbox" type="checkbox" value="'+element.id+":"+element.class+'" name="premiumdomains[]" id="checkboxId' + id + '"><label for="checkboxId' + id + '"><i class="fa fa-square-o" aria-hidden="true"></i></label></span><span class=" t domain-label " ><strong>' + element.id + '</strong></span></div><div class="second-line availability"><span class="premium">NAMEMEDIA PREMIUM</span></div></div><div id="pricetest" class="col-xs-5 search-result-price"><div class="second-line price"><span class="period">'+price+'</span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price"><span class="period added">Added</span><br/><span class="period added">'+price+'</span></div></div><br/></div>');

							}else{

                                $('#searchresults').append( '<div id="' + id + '" class="api"><div class="col-xs-7 search-result-info clickable" ><div class="first-line"><span class="checkboxarea"><input class="checkbox" type="checkbox" value="'+element.id+":"+element.class+'" name="premiumdomains[]" id="checkboxId' + id + '"><label for="checkboxId' + id + '"><i class="fa fa-square-o" aria-hidden="true"></i></label></span><span class=" t domain-label " ><strong>' + element.id + '</strong></span></div><div class="second-line availability"><span class="premium">NAMEMEDIA PREMIUM</span></div></div><div id="pricetest" class="col-xs-5 search-result-price"><div class="second-line price"><span class="period">'+price+'</span></div></div><div class="col-xs-5 search-result-price details hide"><div class="second-line price"><span class="period added">Added</span><br/><span class="period added">'+price+'</span></div></div><br/></div>');

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

        var box=$(".checkbox", $(this).parent());
        if(box.prop('checked') == true){
            box.prop('checked', false);
         } else{
             box.prop('checked', true);
         }

        $(this).find('i.fa-square-o').toggleClass('fa-check-square');

        $(this).siblings().toggleClass('details hide');


        $(this).siblings().children().find('span.t').toggleClass('added');


        $(this).children().find('span.t').toggleClass('added');


        $(this).children().next().children().toggleClass('added');

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

    $(document).on("click",".fa-square-o", function() {
        <!-- $(this).toggleClass('fa-check-square'); -->
    });



});

</script>

<style>

    .details.hide {
        display:none;
    }
    .backordertest.added{
        color: #00a850;
    }
    .period.added{
        color: #00a850;
    }
    .available {
        font-size: 11px;
        color: #00a850;
        font-weight: 700;
        margin-left: 30px;
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

<!--  T  -->
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
.domain-label.added {
     color: #00a850;
 }
 .tld-zone.green {
     color: #00a850;
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
     <!-- margin-top: 300px; -->
}

.search-result-price {
  text-align: right;
  margin-bottom: 50px;
}

.added {
  font-weight: bold;
  color: #00a850; !important;
}

.domain-suggestions .result-item .search-result-details .small-container {
  margin-top: 12px;
  margin-left: 29.5px;
}
.domain-suggestions .result-item .search-result-details .small-container .details-note {
  list-style-type: disc;
  list-style-position: inside;
  text-indent: -1em;
  padding-left: 1em;
}

</style>
{/literal}

{if $backorder_module_installed}
    <script src="../modules/addons/ispapibackorder/templates/lib/noty-2.4.1/jquery.noty.packaged.min.js"></script>
{/if}

<div class="domain-checker-container2">
<div class="domain-checker-bg2">
<form method="post" action="index.php?m=ispapicheckdomain" class="form-horizontal" id="searchform">

    <head>
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.4.0/css/font-awesome.min.css">
  <link href="style.css" rel="stylesheet" />
</head>

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
							<input style="background:white;border:3px solid #0033a0;border-radius:10px;font-size:16px;" id="searchfield" name="domain" class="form-control" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$LANG.domaincheckerdomainexample}">
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
<div>Search Results</div><br />
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">

        <div class="row" id="searchresults">

        </div>

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
