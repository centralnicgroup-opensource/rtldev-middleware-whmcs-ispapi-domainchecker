{literal}
<script>

/**
 * Escape all special jQuery CSS selector characters in *selector*.
 * Useful when you have a class or id which contains special characters
 * which you need to include in a selector.
 */
jQuery.extend(jQuery, {
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

    //starts the search directly when the page is opened
    jQuery(function(){
        jQuery('#searchbutton').click();
    });

    //starts the search when entenkey is pressed
    $('#searchfield').keyup(function(e){
        if(e.keyCode == 13){
            $(this).trigger("enterKey");
	    }
	});
	$('#searchfield').bind("enterKey",function(e){
		$("#searchbutton").trigger("click");
	});

    //prevent the page reload when form is submitted
	$('#searchform').submit(function(e){
	    e.preventDefault();
	});

    //handle the click on the category-button
    $('.category-button').click(function(){
        $(this).find('i.category').toggleClass('fa-angle-up fa-angle-down');
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

    // to remove data from the div elements
    function removeAppendDataFromDivs(){
            $("#domain-in-box").removeClass("domaininbox-backorder");
            $('.status-text').html('');
            $('.domainlabel').html('');
            $('.tldzone').html('');
            $('.domain-description').html('');
            $('.price-of-domain').html('');
            $('.premium-label').html('');
            $('.action-button').hide();
            $('.action-button').html('');
            $('.renewalprice-of-domain').html('');
            $("#domain-in-box").removeClass("domaininbox-available");
            $("#domain-in-box").removeClass("domaininbox-taken");
            $("#domain-in-box").removeClass("domaininbox-available");
    }
    //handle the feedback message for a searched domain
    function handleFeedbackMessage(data){
        // error, backorder, available, taken
        if(data.feedback.f_type){
            var domainName = data.feedback.id;
            var index = domainName.indexOf(".");
            var domainLabel = domainName.substr(0, index);
            var tldZone = domainName.substr(index + 0);
            $("#domain-in-box").removeAttr('style');
            $('.status-text').append(data.feedback.f_message);
            $('.domainlabel').append(domainLabel);
            $('.tldzone').append(tldZone);
            if(data.feedback.f_type == "error" || data.feedback.f_type == "taken"){ //anthony.coco //tulsi.co
                $("#domain-in-box").addClass("domaininbox-taken");
                $('.domain-description').append("But not to worry, we have other domains you might be interested in. Check them out!<br>");
                $('.action-button').hide();
            }
            if(data.feedback.f_type == "backorder"){ //anthony.com
                $('.action-button').show();
                $("#domain-in-box").addClass("domaininbox-backorder");
                $('.action-button').append("Backorder");
                $('.domain-description').append("using our backorder system, we will attempt to register the domain as soon as it becomes available.");
                $('.price-of-domain').append("<br>"+data.feedback.backorderprice+" upon successful registration<br>");
            }
            if(data.feedback.f_type == "available"){ //premium - anthony.blog /normal-testi234.com
                $('.action-button').show();
                $("#domain-in-box").addClass("domaininbox-available");
                if(data.feedback.premiumtype){
                    $('.premium-label').append("PREMIUM");
                    $('.domain-description').append("This is a registry premium domain. It is classified differently than a standard domain which may affect its pricing.<br>");
                }
                $('.action-button').append("Add to cart");
                $('.price-of-domain').append("<br>"+data.feedback.registerprice);
                $('.renewalprice-of-domain').append("Renewal: "+data.feedback.renewprice);
            }
        }
        // if(data.feedback.type){
        //     //TODO Tulsi :)
        // }
    }

    //MAIN FUNCTION: handle the availability checks
	function checkdomains(domains, cached_data){
		var currency = "&currency={/literal}{$currency}{literal}" ;
		var cache = "";
		if(cached_data){
			cache = "&cache=1";
		}
		var domainlist = "";
		$.each(domains, function(index, element) {
			domainlist += "&domains[]=" + element;
		});

        var params = $("#searchform").serialize();
		$.ajax({
			type: "POST",
			url: "{/literal}{$path_to_domain_file}{literal}",
			data: params + cache + currency + domainlist,
			dataType:'json',
			success: function(data, textStatus, jqXHR) {

                //handle the feedback message
                handleFeedbackMessage(data);

				$.each(data["data"], function(index, element) {
					var id = jQuery.escapeSelector(element.id); //.replace(/\./g, '');
					$( "#" + id).addClass(element.checkover);
                    // TULSI TODO: GO THROUGH EVERY ELEMENTS AND DISPLAY THE CORRECT DESIGN -DONE
                    //prices of the domains
                    var registerprice = '<span name="domainsregperiod['+element.id+']">' + '<span class=" registerprice ">'+element.registerprice+'</span>' + '</span>';
                    var hideregisterprice = '<span name="domainsregperiod['+element.id+']">' + '<span class=" registerprice added">'+element.registerprice+'</span>' + '</span>';
                    var renewprice = '<span name="domainsregperiod['+element.id+']">'+ '<span class="renewal">Renewal: '+element.renewprice+'</span>'+ '</span>';
                    var backorderprice = '<span name="domainsregperiod['+element.id+']">'+ '<span class=" renewalprice ">'+element.backorderprice+'</span>'+ '</span>';
                    //ALL THE DOMAINS IN THE CART
                    var domainsInCart = [];
                    if(element.cart){
                        $.each(element.cart.domains, function(n, currentElem) {
                            domainsInCart.push(currentElem.domain);
                        });
                    }
                    //IF THE DOMAIN IS PRESENT IN CART:
                    if (domainsInCart.indexOf(element.id) > -1) { //DONE
                            $("#domainform input[id=orderbutton]").removeClass('hide');
                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                            $( "#" + id).find('span.domainname.domain-label').addClass('available added');
                            $( "#" + id).find('span.domainname.tld-zone').addClass('available added');
                            if(element.status == "available"){
                                if(element.premiumtype == "") {
                                    $( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");
                                }else{
                                    $( "#" + id + " div.availability").html('<span class="available added">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium added" value="'+element.id+'"> - '+element.premiumtype+'</span>');
                                }
                            }
                            //to display register and renewprice as before
                            $("#" + id).find('div.second-line.registerprice').html(registerprice);
                            $("#" + id).find('div.second-line.renewalprice').html(renewprice);
                            //to ad Added and only register price
                            hideregisterprice =  '<span>Added</span><br/>'+hideregisterprice;
                            $("#" + id).find('span.registerprice.added').html(hideregisterprice);
                            //hide the display register and renewprice as before
                            $("#" + id).find('div.search-result-price').addClass('details hide');
                            $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                    } else {
                        //IF DOMAIN IS AVAILABLE => IT CAN BE PREMIUM OR NORMAL
                        if(element.status == "available"){
                            if(element.premiumtype == "") {//DONE
                                    $( "#" + id).find('span.domainname.domain-label').addClass('available');
                                    $( "#" + id).find('span.domainname.tld-zone').addClass('available');
                                    $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                    $( "#" + id + " div.availability").html("<span>{/literal}{$LANG.domaincheckeravailable}{literal}</span>").addClass("available");
                                } else { //DONE
                                    $( "#" + id).find('span.domainname.domain-label').addClass('available');
                                    $( "#" + id).find('span.domainname.tld-zone').addClass('available');
                                    $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                    $( "#" + id + " div.availability").html('<span class="available">{/literal}{$LANG.domaincheckeravailable}{literal}</span><span class="premium " value="'+element.id+'"> - '+element.premiumtype+'</span>');
                                }
                                //display prices
                                $("#" + id).find('div.second-line.registerprice').html(registerprice);
                                $("#" + id).find('div.second-line.renewalprice').html(renewprice);
                                //add ADDED  and price to the hidden div
                                hideregisterprice =  '<span>Added</span><br/>'+hideregisterprice;
                                $("#" + id).find('span.registerprice.added').html(hideregisterprice);
                        }else if(element.status == "taken"){ //taken or taken and backorder //DONE
                            var moreelement ='<div class="first-line click">'+
                                                '<span class="see-more">'+
                                                    '<i class="more fa fa-caret-down" style="font-size: 14px;color: #939598;"></i>'+
                                                '</span>'+
                                                '<span class="more" style="font-size: 14px;color: #939598;"> More</span>'+
                                                '<br><span> <br> </span>'+ //to create a gap in between
                                            '</div>';
                                            //
                            var moreinformation = '<div class="text col-xs-12 search-result-details hide">'+'<div class="small-container">'+
                                                    '<small>'+
                                                        '<span></span><span style="color:#0033a0;font-weight:500;">'+element.id+' is registered, but you still want this domain if and when it expires. Place a free BACKORDER today and we will notify and attempt to register* when it becomes available. </span>'+
                                                        '<br><br><ul style="color:#0033a0; font-weight:700;margin-right:20px;">'+
                                                            '<li class="details-note">'+
                                                                '<i >Registration attempt executed only for active accounts with enough positive prepaid funds at the time of expiration</i>'+
                                                            '</li>'+
                                                            '<li class="details-note">'+
                                                                '<i >Domains with multiple backorders are sent to private auction</i>'+
                                                            '</li>'+
                                                            '<li class="details-note">'+
                                                                '<i > Successful individual backorder registration fee is '+element.backorderprice+' </i><i> </i>'+
                                                            '</li>'+
                                                        '</ul>'+
                                                    '</small>'+
                                                '</div></div>';
                            //to add Added and backorder price
                            backorderprice =  '<span>Added</span><br/>'+backorderprice;
                            $("#" + id).find('span.registerprice.added').html(backorderprice);
                            //to display More and information
                            $("#" + id).find('div.second-line.registerprice').html(moreelement);
                            $("#" + id).find('div.search-result-price').eq(1).after(moreinformation);

                            if(element.backordered == "1"){
                                $( "#" + id).find('span.domainname.domain-label').addClass('added');
                                $( "#" + id).find('span.domainname.tld-zone').addClass('added');
                                $( "#" + id + " span.checkboxarea").html('<label class="added setbackorder" value="' +element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                                $( "#" + id + " div.availability").html("<span class='taken added'>{/literal}{$LANG.domaincheckertaken}{literal}</span>" + "<span class='backorder added'> - BACKORDER</span>");
                                //hide the display register and renewprice as before
                                $("#" + id).find('div.search-result-price').addClass('details hide');
                                $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                                // IF DOMAIN IS TAKEN => BACKORDER MAYBE AVAILABLE
                            } else if(element.backorder_available == "1"){
                                // when backorder available, display More option
                                $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span> "  + "<span class='backorder '> - BACKORDER</span>");
                            } else {//backorder not available
                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$LANG.domaincheckertaken}{literal}</span>");
                                $( "#" + id).find('div.col-xs-7').removeClass("search-result-info clickable");
                                // for taken => to display —
                                var spanelement = '<span style="font-size: 14px;color: #939598;font-weight:bold;">—</span>'+
                                '<br><span><br></span>'; //to create a gap in between;
                                $("#" + id).find('div.second-line.registerprice').html(spanelement);
                            }
                        }
                    }
				});

                //handle the click on the WHOIS button //TODO : there is no use of WHOIS. isnt it?
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

    //handle the click on the check button
	var count = 0;
	$("#searchbutton").click(function() {
		count++;

        //handle the following feature: Search can be triggered over the URL (domainchecker.php?search=test.com&cat=5)
		if("{/literal}{$smarty.get.search}{literal}" && count == 1){
            //pass the search term from the URL to the form
			$("#searchform input[name='searched_domain']").attr("value", "{/literal}{$smarty.get.search}{literal}" );
			$("#searchfield").attr("value", "{/literal}{$smarty.get.search}{literal}" );
            //pass the category id fromt the URL to the form
			if("{/literal}{$smarty.get.cat}{literal}"){
				$("#searchform input[name=tldgroup]").attr("value", "{/literal}{$smarty.get.cat}{literal}");
			}
		}else{
			var searched_domain = $("#searchfield").val();

			//stop the request when domainfield is not filled
			if(searched_domain == ""){
				return;
			}else{
				$("#searchform input[name='searched_domain']").attr("value", searched_domain );

                //TODO: explain what is done here
                //this part is related subcats. We do not have subcats anymore. Even though i would like to keep it for a while
                // if($("#searchform input[name=tldgroup").attr("value") == ''){
                //     var idsOfSubCat = $("#searchform").find('li');
                //     var tmpid = [];
                //     idsOfSubCat.each(function(){
                //         var id = $(this).attr("id").substring(2);
                //         tmpid.push(id);
                //     });
                //     $("#searchform input[name=tldgroup").attr("value",tmpid);
                // }
			}
		}

		//$("#loading").show();
		//$("#pricingTable").hide();

        //get the complete list of all domains that should be checked
        // - 2 modes: normal and suggestions
		var currency = "&currency={/literal}{$currency}{literal}" ;
		var params = $("#searchform").serialize();
		var getlistparams = params + "&action=getList" + currency;
        //To remove the content from the div element structure of the domain box
        removeAppendDataFromDivs();
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

                //handle the feedback message
                handleFeedbackMessage(data);

				var nb_results = 0;
				$.each(data["checkorder"], function(index, element) {
					var domain = element; //.replace(/\./g, '');

                    //TODO split and bold the tld - DONE
                    var index = domain.indexOf(".");
                    var domainLabel = domain.substr(0, index);
                    var tldZone = domain.substr(index + 0);
                    $('#searchresults').append(
                        '<div class="domainbox" id="' + domain + '">'+
                            '<div class="col-xs-7 search-result-info clickable">'+
                                '<div class="first-line">'+
                                    '<span class="checkboxarea"></span>'+
                                    '<span class=" domainname domain-label ">'+domainLabel+'</span>'+'<span class=" domainname tld-zone ">'+tldZone+'</span>'+
                                '</div>'+
                                '<div class="second-line availability">'+
                                    '<span></span>'+
                                '</div>'+
                            '</div>'+
                            '<div class="col-xs-5 search-result-price">'+
                                '<div class="second-line registerprice"></div>'+
                                '<div class="second-line renewalprice"></div>'+
                            '</div>'+
                            '<div class="col-xs-5 search-result-price details hide">'+
                                '<div class="second-line price">'+
                                    '<span class="registerprice added"></span>'+
                                    '<span class="renewalprice added"></span>'+
                                '</div>'+
                            '</div>'+
                            '<div class="clear"></div>'+
                        '</div>'
                    );

					nb_results++;
				});

				if(nb_results == 0){
					$("#resultsarea").hide();
				}

				//send only one check for cached data
				if(data["cache"] == true){
					checkdomains(new Array(), true);
					return;
				}else{
                    startChecking(data["checkorder"]);
				}

			},
			error: function (jqXHR, textStatus, errorThrown){
				$("#errorsarea").text(errorThrown);
				$("#errorsarea").show();
				$("#resultsarea, #loading").hide();
			}
		});
	});

    //This function get the complete list of domains to check and
    //split the checks in 2, then 4, then 8, then 16 checks at once.
    //In this way the customer is getting faster feedback.
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

	}

    $(document).on("click",".click", function() {
        //more information - More
        $(this).find('i.more').toggleClass('fa-caret-up');
        //show and hid information when clicked on more
        $(this).parent().parent().siblings().eq(2).toggleClass('hide');
    });
    //TODO refactor this code and add comments.
    $(document).on("click",".search-result-info", function() {
        if($(this).find('label').hasClass('setbackorder')){
            // when user not logged - no need to display change of design - backorder only
        }else{
            //toggle checkbox
            $(this).find('i.fa-square-o').toggleClass('fa-check-square');
            //toggle domain name and tld zone
            $(this).find('span.domainname').toggleClass('added');
            //toggle backorder and premium availability
            $(this).find('span.backorder').toggleClass('added');
            $(this).find('span.premium').toggleClass('added');
            // to toggle hide on the second div items
            $(this).siblings().eq(0).toggleClass('details hide');
            $(this).siblings().eq(1).toggleClass('details hide');
        }

        if($(this).find('span.domainname.domain-label').hasClass('available added')){
            //show checkout button
            $("#domainform input[id=orderbutton]").removeClass('hide');
            //prepare params array with action, domain name and token to put it in cart
            var params = {};
            params['a'] = 'addToCart';
            params['domain'] = $(this).find('label').attr("value");
            params['token'] = $("#domainform").find('input').eq(0).attr("value");
            //handling premium domains in cart
            if($(this).find('span').hasClass('premium')){
                var paramspremium = {};
                var price = $(this).siblings().find('span.registerprice').text();
                var renewalprice = $(this).siblings().find('span.renewal').text();
                // remove 'USD' from the price before adding it to cart
                var regex = /[\d|,|.|e|E|\+]+/g;
                var registerprice = price.match(regex);
                var renewprice = renewalprice.match(regex);
                paramspremium['action'] = 'addPremiumToCart';
                paramspremium['domain'] = $(this).find('label').attr("value");
                paramspremium['registerprice']= registerprice[0];
                paramspremium['renewalprice']= renewprice[2];

                $.ajax({
                    //premium domain in cart
                      type: "GET",
                      data: paramspremium,
                      async: false,
                      url: "{/literal}{$modulepath}{literal}domain.php?"
                });
            }else{
                //normal domain in cart
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
                //hide checkout button when no domain added in cart
                $("#domainform input[id=orderbutton]").addClass('hide');
            }
            var domainInCart = $(this).find('label').attr("value");
            //to remove domains from cart on click
            $.ajax({
                  type: "GET",
                  async: false,
                  url: "{/literal}{$modulepath}{literal}domain.php?action=removeFromCart&domain="+domainInCart
            });
        }
        // handling backorder domains on click
        if($(this).find('label').hasClass('setbackorder')){

            var iconLabel = $(this).find('label.setbackorder');
            var command = "CreateBackorder";
            //display domain design when user logged in - backorder domains
            //toggle checkbox
            var checkbox = $(this).find('i.fa-square-o');
            //toggle domain name and tld zone
            var domainname = $(this).find('span.domainname');
            //toggle backorder and premium availability
            var backorder = $(this).find('span.backorder');
            //toggle - taken -availability
            var taken = $(this).find('span.taken');
            // to toggle hide on the second div items
            var sib0 = $(this).siblings().eq(0);
            var sib1 = $(this).siblings().eq(1);

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

                        checkbox.addClass('fa-check-square');
                        domainname.addClass('added');
                        backorder.addClass('added');
                        taken.addClass('added');
                        sib0.addClass('details hide');
                        sib1.removeClass('details hide');

                        noty({text: 'Backorder successfully created.', type: 'success', layout: 'bottomRight'}).setTimeout(3000);
                    }
                    else if(command=="DeleteBackorder" && data.CODE==200){
                        iconLabel.removeClass("added");

                        checkbox.removeClass('fa-check-square');
                        domainname.removeClass('added');
                        backorder.removeClass('added');
                        taken.removeClass('added');
                        sib0.removeClass('details hide');
                        sib1.addClass('details hide');

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

    //handle the click on the order button
	$("#orderbutton").bind("click", function(e){
		$("#orderbutton").hide();
		$("#orderbuttonloading").show();
		location.href = "{/literal}{$modulepath}{literal}../../../cart.php?a=confdomains";
	});

});

</script>
{/literal}


<!-- HTML PART OF THE DOMAINCHECKER -->

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


    <!-- CATEGORY and searched domain in box-->
    <div id="categories" class="row1 row collapse-category">
        <!-- To display searched domain in a box with feedback message  -->
        <div id="domain-in-box" style="display:none">
            <div class="status-text"></div>
            <div class="label-text">
                <span class="domainlabel"></span>
                <span class="tldzone"></span>
                <span class="premium-label"></span>
                <button id="actionbutton" class="action-button"></button>
            </div>
            <div class="description-text">
                <span class="domain-description"></span>
            </div>
            <div class="price-text">
                <span class="price-of-domain"></span>
                <span class="renewalprice-of-domain"></span>
            </div>
        </div>

        <!--  CATEGORY-->
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
                                            {foreach from=$cat item=sub}
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
