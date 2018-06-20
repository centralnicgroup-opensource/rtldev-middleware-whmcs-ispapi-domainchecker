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
      '#', '&', '~', '=', '>', "'", ':', '"', '!', ';', ','
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
    //pool of ajax requests
    var requestpool = [];

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
        $(".cat").find("li").each(function() {
            if($(this).hasClass('active')){
                var id = $(this).attr("id").substring(2);
                tmpid.push(id);
            }
        });
        tmpid = jQuery.unique( tmpid );
        $("#searchform input[name=tldgroup]").attr("value", tmpid);
        $("#searchbutton").trigger("click");
	});

    // to remove data from the div elements
    function removeAppendDataFromDivs(){
        $('.status-text').html('');
        $('.domainlabel').html('');
        $('.tldzone').html('');
        $('.domain-description').html('');
        $('.price-of-domain').html('');
        $('.premium-label').html('');
        $('.action-button').hide();
        $('.action-button').html('');
        // action-button to work when searched without page refresh
        $('.action-button').removeClass("Available");
        $('.action-button').removeClass("Backorder");

        $(".action-button").removeClass("action-button-added");
        $('.renewalprice-of-domain').html('');
        $("#domain-in-box").removeClass("domaininbox-available");
        $("#domain-in-box").removeClass("domaininbox-taken");
        $("#domain-in-box").removeClass("domaininbox-backorder");
        $("#domain-in-box").hide();
    }
    //handle the feedback message for a searched domain
    function handleFeedbackMessage(data){
        // error, backorder, available, taken
        if(data.feedback.f_type){

            //the domains in the cart
            var domainsInCart = [];
            if(data.feedback.cart){
                $.each(data.feedback.cart.domains, function(n, currentElem) {
                    domainsInCart.push(currentElem.domain);
                });
            }

            $(".action-button").unbind();
            $(".action-button").bind("click", function(e){
                //backorder a domain
                if($(this).attr("class") == "action-button Backorder"){
                    var createbackorder = createBackorder($(this).attr("value"));
                    if(createbackorder.CODE == 200){
                        $(this).addClass("action-button-added");
                        $(this).html("Added");
                        $(this).unbind("click");
                    }
                }
                //add domain to the cart
                if($(this).attr("class") == "action-button Available"){

                    //Display checkout button when domain added to the cart from domainbox
                    $("#domainform input[id=orderbutton]").removeClass('hide');

                    //show checkout button after categories when domain added from domain box
                    $(".btn-danger").removeClass("hide");

                    var params = {};
                    if(data.feedback.premiumtype){
                        params['action'] = 'addPremiumToCart';
                        params['domain'] = data.feedback.id;
                        params['registerprice']= data.feedback.registerprice_unformatted;
                        params['renewalprice']= data.feedback.renewprice_unformatted;
                        addDomainToCart(params, "premium");
                    }
                    else{
                        params['a'] = 'addToCart';
                        params['domain'] = data.feedback.id;
                        params['token'] = $("#domainform").find('input').eq(0).attr("value");
                        addDomainToCart(params, " ");
                    }
                    $(this).addClass("action-button-added");
                    $(this).html("Added");
                    $(this).unbind("click");

                }
            });

            var domainName = data.feedback.id;
            var index = domainName.indexOf(".");
            var domainLabel = domainName.substr(0, index);
            var tldZone = domainName.substr(index + 0);

            $("#domain-in-box").removeAttr('style');
            $('.status-text').append(data.feedback.f_message);
            $('.domainlabel').append(domainLabel);
            $('.tldzone').append(tldZone);
            $('.action-button').attr("value", domainName);

            //removes the item from the list if there is a feedback
            try{
                $("#" + jQuery.escapeSelector(domainName)).remove();
            }catch(err){
                //nothing to do
            }

            if(data.feedback.f_type == "error" || data.feedback.f_type == "taken"){ //anthony.coco //tulsi.co
                if(!domainLabel || !tldZone){
                    $('.tldzone').html("");
                    $('.domainlabel').append(data.feedback.id);
                }

                $("#domain-in-box").addClass("domaininbox-taken");
                $('.domain-description').append("{/literal}{$_LANG.domain_description_taken}{literal}<br>");
                $('.action-button').hide();
            }
            if(data.feedback.f_type == "backorder"){ //anthony.com
                $('.action-button').addClass("Backorder");
                $('.action-button').show();
                $("#domain-in-box").addClass("domaininbox-backorder");
                $('.action-button').append("Backorder");
                $('.domain-description').append("{/literal}{$_LANG.domain_description_backorder}{literal}");
                $('.price-of-domain').append(data.feedback.backorderprice+"<span style='font-weight:normal;font-size:13px;'>{/literal}{$_LANG.price_of_domain_text}{literal}</style>");
                if(data.feedback.backordered == 1){
                    $('.action-button').addClass("action-button-added");
                    $('.action-button').html("Added");
                    $('.action-button').unbind("click");
                }
            }
            if(data.feedback.f_type == "available"){ //premium - anthony.blog /normal-testi234.com
                $('.action-button').addClass("Available");
                $('.action-button').show();
                $("#domain-in-box").addClass("domaininbox-available");
                if(data.feedback.premiumtype){
                    $('.premium-label').append(data.feedback.premiumtype); //{/literal}{$_LANG.premium}{literal}
                    if(data.feedback.premiumtype == "PREMIUM"){
                        $('.domain-description').append("{/literal}{$_LANG.domain_description_premium_registry}{literal}");
                    }else{
                        $('.domain-description').append("{/literal}{$_LANG.domain_description_premium_aftermarket}{literal}<br>");
                    }
                }
                $('.action-button').append("{/literal}{$_LANG.add_to_cart_button}{literal}");
                $('.price-of-domain').append(data.feedback.registerprice);
                $('.renewalprice-of-domain').append("{/literal}{$_LANG.renewal}{literal}: "+data.feedback.renewprice);
                if (domainsInCart.indexOf(domainName) > -1) {
                    $('.action-button').addClass("action-button-added");
                    $('.action-button').html("Added");
                    $('.action-button').unbind("click");

                    //show checkout button on page reload if the domain is added from domainbox
                    $(".btn-danger").removeClass("hide");

                }
            }
        }
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
            beforeSend: function(jqXHR) {
                requestpool.push(jqXHR);
            },
			success: function(data, textStatus, jqXHR) {

                //handle the feedback message
                handleFeedbackMessage(data);
				$.each(data["data"], function(index, element) {
					var id = jQuery.escapeSelector(element.id); //.replace(/\./g, '');
					$( "#" + id).addClass(element.checkover);
                    //prices of the domains
                    var registerprice = '<span name="domainsregperiod['+element.id+']">' + '<span class=" registerprice " value='+element.registerprice_unformatted+'>'+element.registerprice+'</span>' + '</span>';
                    var hideregisterprice = '<span name="domainsregperiod['+element.id+']">' + '<span class=" registerprice added" value='+element.registerprice_unformatted+'>'+element.registerprice+'</span>' + '</span>';
                    var renewprice = '<span name="domainsregperiod['+element.id+']">'+ '<span class="renewal" value='+element.renewprice_unformatted+'>{/literal}{$_LANG.renewal}{literal}: '+element.renewprice+'</span>'+ '</span>';
                    var backorderprice = '<span name="domainsregperiod['+element.id+']">'+ '<span class=" renewalprice ">'+element.backorderprice+'</span>'+ '</span>';
                    //ALL THE DOMAINS IN THE CART
                    var domainsInCart = [];
                    if(element.cart){
                        $.each(element.cart.domains, function(n, currentElem) {
                            domainsInCart.push(currentElem.domain);
                        });
                    }
                    // show the checkout button if cart is not empty
                    if(domainsInCart.length != 0){
                        $("#domainform input[id=orderbutton]").removeClass('hide');

                        //if there are any domains in the cart, do not remove the checkout button
                        // add class name cartIsNotEmpty if cart is not empty
                        $( "#" + id + " div.clear").addClass('cartIsNotEmpty');
                    }
                    //IF THE DOMAIN IS PRESENT IN CART:
                    if (domainsInCart.indexOf(element.id) > -1) {
                            $("#domainform input[id=orderbutton]").removeClass('hide');
                            $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o fa-check-square avail" aria-hidden="true"></i></label>');
                            $( "#" + id).find('span.domainname.domain-label').addClass('available added');
                            $( "#" + id).find('span.domainname.tld-zone').addClass('available added');
                            if(element.status == "available"){
                                if(element.premiumtype == "") {
                                    $( "#" + id + " div.availability").html("<span>{/literal}{$_LANG.domaincheckeravailable}{literal}</span>").addClass("available");
                                }else{
                                    $( "#" + id + " div.availability").html('<span class="available added">{/literal}{$_LANG.domaincheckeravailable}{literal}</span><span class="premium added" value="'+element.id+'"> - '+element.premiumtype+'</span>');
                                }
                            }
                            //to display register and renewprice as before
                            $("#" + id).find('div.second-line.registerprice').html(registerprice);
                            $("#" + id).find('div.second-line.renewalprice').html(renewprice);
                            //to ad Added and only register price
                            hideregisterprice =  '<span>{/literal}{$_LANG.domain_added_to_cart}{literal}</span><br/>'+hideregisterprice;
                            $("#" + id).find('span.registerprice.added').html(hideregisterprice);
                            //hide the display register and renewprice as before
                            $("#" + id).find('div.search-result-price').addClass('details hide');
                            $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                    } else {
                        //IF DOMAIN IS AVAILABLE => IT CAN BE PREMIUM OR NORMAL
                        if(element.status == "available"){
                            if(element.premiumtype == "") {
                                    $( "#" + id).find('span.domainname.domain-label').addClass('available');
                                    $( "#" + id).find('span.domainname.tld-zone').addClass('available');
                                    $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o avail " aria-hidden="true"></i></label>');
                                    $( "#" + id + " div.availability").html("<span>{/literal}{$_LANG.domaincheckeravailable}{literal}</span>").addClass("available");
                                } else {
                                    $( "#" + id).find('span.domainname.domain-label').addClass('available');
                                    $( "#" + id).find('span.domainname.tld-zone').addClass('available');
                                    $( "#" + id + " span.checkboxarea").html('<label value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o avail " aria-hidden="true"></i></label>');
                                    $( "#" + id + " div.availability").html('<span class="available">{/literal}{$_LANG.domaincheckeravailable}{literal}</span><span class="premium " value="'+element.id+'"> - '+element.premiumtype+'</span>');
                                }
                                //display prices
                                $("#" + id).find('div.second-line.registerprice').html(registerprice);
                                $("#" + id).find('div.second-line.renewalprice').html(renewprice);
                                //add ADDED  and price to the hidden div
                                hideregisterprice =  '<span>{/literal}{$_LANG.domain_added_to_cart}{literal}</span><br/>'+hideregisterprice;
                                $("#" + id).find('span.registerprice.added').html(hideregisterprice);
                        }else if(element.status == "taken"){ //taken or taken and backorder
                            var moreelement ='<div class="first-line click">'+
                                                '<span class="see-more">'+
                                                    '<i class="more fa fa-caret-down" style="font-size: 14px;color: #939598;"></i>'+
                                                '</span>'+
                                                '<span class="more" style="font-size: 14px;color: #939598;"> {/literal}{$_LANG.more}{literal}</span>'+
                                                '<br><span> <br> </span>'+ //to create a gap in between
                                            '</div>';
                            var moreinformation = '<div class="text col-xs-12 search-result-details hide">'+'<div class="small-container">'+
                                                    '<small>'+
                                                        '<span></span><span style="color:#0033a0;font-weight:500;">'+element.id+' {/literal}{$_LANG.backorder_info_text}{literal}</span>'+
                                                        '<br><br><ul style="color:#0033a0; font-weight:700;padding-right:10px;padding-left:0px;margin-left:20px;">'+
                                                            '{/literal}{$_LANG.backorder_info_text_list}{literal}'+
                                                            '<li>'+
                                                                '<i>{/literal}{$_LANG.backorder_info_text_backorderprice}{literal} '+element.backorderprice+'</i>'
                                                            '</li>'+
                                                        '</ul>'+
                                                    '</small>'+
                                                '</div></div>';
                            //to add Added and backorder price
                            backorderprice =  '<span>{/literal}{$_LANG.domain_added_to_cart}{literal}</span><br/>'+backorderprice;
                            $("#" + id).find('span.registerprice.added').html(backorderprice);
                            //to display More and information
                            $("#" + id).find('div.second-line.registerprice').html(moreelement);
                            $("#" + id).find('div.search-result-price').eq(1).after(moreinformation);

                            if(element.backordered == "1"){
                                $( "#" + id).find('span.domainname.domain-label').addClass('added');
                                $( "#" + id).find('span.domainname.tld-zone').addClass('added');
                                $( "#" + id + " span.checkboxarea").html('<label class="added setbackorder" value="' +element.id+'"><i class=" fa fa-square-o fa-check-square" aria-hidden="true"></i></label>');
                                $( "#" + id + " div.availability").html("<span class='taken added'>{/literal}{$_LANG.domaincheckertaken}{literal}</span>" + "<a class='viewWhois added' id='WHOIS|"+element.id+"'> - {/literal}{$_LANG.whois}{literal}</a>"+"<span class='backorder added'> - {/literal}{$_LANG.backorder}{literal}</span>");
                                //hide the display register and renewprice as before
                                $("#" + id).find('div.search-result-price').addClass('details hide');
                                $("#" + id).find('div.search-result-price').eq(1).removeClass('details hide');
                                // IF DOMAIN IS TAKEN => BACKORDER MAYBE AVAILABLE
                            } else if(element.backorder_available == "1"){
                                // when backorder available, display More option
                                $( "#" + id + " span.checkboxarea").html('<label class="setbackorder" value="'+element.id+'" name="domains[]" id="checkboxId'+element.id+'"><i class=" fa fa-square-o " aria-hidden="true"></i></label>');
                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$_LANG.domaincheckertaken}{literal}</span> "  + "<a class='viewWhois ' id='WHOIS|"+element.id+"'> - {/literal}{$_LANG.whois}{literal}</a>"+ "<span class='backorder '> - {/literal}{$_LANG.backorder}{literal}</span>");
                            } else {//backorder not available
                                $( "#" + id + " div.availability").html("<span class='taken'>{/literal}{$_LANG.domaincheckertaken}{literal}</span>"+ "<a class='viewWhois ' id='WHOIS|"+element.id+"'> - {/literal}{$_LANG.whois}{literal}</a>");
                                $( "#" + id).find('div.col-xs-7').removeClass("search-result-info clickable");
                                // for taken => to display —
                                var spanelement = '<span style="font-size: 14px;color: #939598;font-weight:bold;">—</span>'+
                                '<br><span><br></span>'; //to create a gap in between;
                                $("#" + id).find('div.second-line.registerprice').html(spanelement);
                            }
                        }
                    }
				});

                //handle the click on the WHOIS button
				$(".viewWhois").unbind();
				$(".viewWhois").bind("click", function(e){
                    // to prevent parent div from toggling classes to other elements
                    e.stopPropagation();

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

			}
		});
	}

    //handle the click on the check button
	var count = 0;
	$("#searchbutton").click(function() {
        count++;

        //clean all previous ajax requests
        $.each(requestpool, function(key, request){
            request.abort();
        });
        //empty request pool
        requestpool = [];

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
			}
		}

        $("#loading").show();
        $("#resultsarea").hide();
        //get the complete list of all domains that should be checked
        //2 modes: normal and suggestions
		var currency = "&currency={/literal}{$currency}{literal}" ;
		var params = $("#searchform").serialize();
		var getlistparams = params + "&action=getList" + currency;

        //to remove the content from the div element structure of the domain box
        removeAppendDataFromDivs();

		$.ajax({
			type: "POST",
			url: "{/literal}{$path_to_domain_file}{literal}",
			data: getlistparams,
			dataType:'json',
            beforeSend: function(jqXHR) {
                requestpool.push(jqXHR);
            },
			success: function(data, textStatus, jqXHR) {
                $("#loading").hide();
				$("#errorsarea, #successarea").hide();
				$("#errorsarea, #successarea").html("");
				$("#resultsarea").show();
				$('#searchresults').find("div").remove();

                //handle the feedback message
                handleFeedbackMessage(data);

				var nb_results = 0;
				$.each(data["checkorder"], function(index, element) {
					var domain = element; //.replace(/\./g, '');

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
                                '<div class="second-line registerprice"><span><i class="fa fa-refresh fa-spin" style="color:#0033a0;font-size:16px;"></i></span></div>'+
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
    //When search in url along with cat id, activate the category under categories button
    if("{/literal}{$smarty.get.search}{literal}"){
        if("{/literal}{$smarty.get.cat}{literal}"){
            var catid = "{/literal}{$smarty.get.cat}{literal}";
            $("#s_" + catid).addClass("active");
        }
    }

    $(document).on("click",".click", function() {
        //more information - More
        $(this).find('i.more').toggleClass('fa-caret-up');
        //show and hid information when clicked on more
        $(this).parent().parent().siblings().eq(2).toggleClass('hide');
    });

    $(document).on("click",".search-result-info", function() {
        var backorderevent = false;
        // handling backorder domains on click
        if($(this).find('label').hasClass('setbackorder')){
            backorderevent = true;
            //the following variables are used to update the frontend design
            var iconLabel = $(this).find('label.setbackorder');
            var whoisLink = $(this).find('a.viewWhois');
            var checkbox = $(this).find('i.fa-square-o');
            var domainnamespan = $(this).find('span.domainname');
            var backorder = $(this).find('span.backorder');
            var taken = $(this).find('span.taken');

            // to toggle hide on the second div items
            var div0 = $(this).siblings().eq(0);
            var div1 = $(this).siblings().eq(1);

            var domainname = $(this).find('label.setbackorder').attr("value");

            if ($(this).find('label.setbackorder').hasClass("added")){
                //delete backorder
                var deletebackorder = deleteBackorder(domainname);
                if(deletebackorder.CODE == 200){
                    iconLabel.removeClass("added");
                    checkbox.removeClass('fa-check-square');
                    domainnamespan.removeClass('added');
                    backorder.removeClass('added');
                    taken.removeClass('added');
                    whoisLink.removeClass('added');
                    div0.removeClass('details hide');
                    div1.addClass('details hide');

                }
            }else{
                //create backorder
                var createbackorder = createBackorder(domainname);
                if(createbackorder.CODE == 200){
                    iconLabel.addClass("added");
                    checkbox.addClass('fa-check-square');
                    domainnamespan.addClass('added');
                    backorder.addClass('added');
                    taken.addClass('added');
                    whoisLink.addClass('added');
                    div0.addClass('details hide');
                    div1.removeClass('details hide');
                }
            }
        }

        //quit if backorderevent, no need to continue
        if(backorderevent){
            return;
        }

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

                var registerprice = $(this).siblings().find('span.registerprice.added').eq(1).attr("value");
                var renewalprice = $(this).siblings().find('span.renewal').attr("value");
                paramspremium['action'] = 'addPremiumToCart';
                paramspremium['domain'] = $(this).find('label').attr("value");
                paramspremium['registerprice']= registerprice;
                paramspremium['renewalprice']= renewalprice;
                addDomainToCart(paramspremium, "premium");
            }else{
                addDomainToCart(params, "");
            }
        }
        else{
            if($("#domainform").find('span.domainname.domain-label').hasClass('added') && $("#domainform").find('span.domainname.domain-label').hasClass('available')){
                //
            }else if($("#domainform").find('div.clear').hasClass('cartIsNotEmpty')){
                //if there are any domains in the cart, do not remove the checkout button
            }else{
                //hide checkout button when no domain added in cart
                $("#domainform input[id=orderbutton]").addClass('hide');
            }
            var domainInCart = $(this).find('label').attr("value");
            removeDomainFromCart(domainInCart);
        }

    });

    /*
     * Sends a request to create a Backorder, returns the result and show the notification to the user with MODAL.
     */
    function createBackorder(domainname){
        var result;
        $.ajax({
            type: "POST",
            async: false,
            dataType: "json",
            url: "{/literal}{$backorder_module_path}{literal}backend/call.php",
            data: {
                COMMAND: "CreateBackorder",
                DOMAIN: domainname,
                TYPE: "FULL"
            },
            success: function(data) {
                result = data;
                if(data.CODE != 200){
                    if(data.CODE == 531){
                        $("#modalError").modal('show');
                        $("#modalErrorBody").html('{/literal}{$_LANG.login_required}{literal}');
                    }
                    else{
                        $("#modalError").modal('show');
                        $("#modalErrorBody").html('{/literal}{$_LANG.error_occured}{literal}');
                    }
                }
            },
            error: function(data) {
                result = data;
                $("#modalError").modal('show');
                $("#modalErrorBody").html('{/literal}{$_LANG.error_occured}{literal}');
            }
        });
        return result;
    }

    /*
     * Sends a request to delete a Backorder, returns the result and show the notification to the user with Modal.
     */
    function deleteBackorder(domainname){
        var result;
        $.ajax({
            type: "POST",
            async: false,
            dataType: "json",
            url: "{/literal}{$backorder_module_path}{literal}backend/call.php",
            data: {
                COMMAND: "DeleteBackorder",
                DOMAIN: domainname,
                TYPE: "FULL"
            },
            success: function(data) {
                result = data;
                if(data.CODE != 200){
                    if(data.CODE == 531){
                        $("#modalError").modal('show');
                        $("#modalErrorBody").html('{/literal}{$_LANG.login_required}{literal}');
                    }
                    else{
                        $("#modalError").modal('show');
                        $("#modalErrorBody").html('{/literal}{$_LANG.error_occured}{literal}');
                    }
                }
            },
            error: function(data) {
                result = data;
                $("#modalError").modal('show');
                $("#modalErrorBody").html('{/literal}{$_LANG.error_occured}{literal}');
            }
        });
        return result;
    }

    /*
     * Add domain to cart
     */
    function addDomainToCart(params, domainType){
        if(domainType == "premium"){
            $.ajax({
                //premium domain in cart
                type: "GET",
                data: params,
                url: "{/literal}{$modulepath}{literal}domain.php?"
            });
        }
        else{
            $.ajax({
                url: "{/literal}{$modulepath}{literal}../../../cart.php?a=add&domain=register",
                type: "POST",
                data: params,
            });
        }
    }

    /*
     * Delete domain from cart
     */
     function removeDomainFromCart(domainname){
         //to remove domains from cart on click
         $.ajax({
             type: "GET",
             url: "{/literal}{$modulepath}{literal}domain.php?action=removeFromCart&domain="+domainname
         });
     }

    //handle the click on the order button & order button inside the domain box
	$("#orderbutton, #orderbuttonDomainbox").bind("click", function(e){
		$("#orderbutton").hide();
        $("#orderbuttonDomainbox").hide();
		$("#orderbuttonloading").show();
		location.href = "{/literal}{$modulepath}{literal}../../../cart.php?a=confdomains";
	});

});

</script>
{/literal}


<!-- HTML PART OF THE DOMAINCHECKER -->

<div class="domain-checker-container2">
<div class="domain-checker-bg2">
<form method="post" action="index.php?m=ispapicheckdomain" id="searchform" class="search-form">
    <head>
        <link rel="stylesheet" href="{$modulepath}ispapidomaincheck.css">

         <meta name="viewport" content="width=device-width, user-scalable=no" /> {*<-- user-scalable=yes if you want user to allow zoom --> *}
    </head>

	<input type="hidden" name="tldgroup" value="">
	<input type="hidden" name="searched_domain" value="">

    <div class=" search-input-bar">
            <div class="input-group">
                <div class="inner-addon right-addon">
                    <input  id="searchfield" name="domain" class="form-control singlesearch input-box" type="text" value="{if $domain}{$domain}{/if}" placeholder="{$_LANG.domaincheckerdomainexample}"><!--padding-right:380px; -->
                    <div class="addon">
                        <button id="searchbutton" class="btn btn-default search-btn" type="button">{$_LANG.go_search}</button>
                    </div>
                </div>
            </div>
    </div>

    <!-- CATEGORY and searched domain in box-->
    <div id="categories" class="row1 row collapse-category">
        <!-- To display searched domain in a box with feedback message  -->
        <div id="domain-in-box" class="domain-box" style="display:none">
            <div class="status-text"></div>
            <div class="label-text">
                <span class="domainlabel"></span><span class="tldzone"></span>
                <span class="premium-label"></span>
                <button id="actionbutton" class="action-button" type="button"></button>
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
                <span>{$_LANG.categories_label}</span>
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
                                <div class="catcontainer" >
                                    <ul class="cat" style="text-align:center;">
                                        {foreach from=$categories item=cat}
                                            <li class="subCat" style="display:inline-block;" id="s_{$cat.id}">{$cat.name}</li>
                                        {/foreach}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <hr>
            </div>
        </div>
        {*  checkout button after categories when domain added from domain boy *}
        <p align="center"><input id="orderbuttonDomainbox" type="button" value="{$_LANG.checkoutbutton} &raquo;" class="hide btn btn-danger" /></p>
    </form>
</div>
</div>

<div class="alert alert-danger text-center" id="errorsarea" style="display:none;"></div>
<div class="domain-checker-result-headline"><p class="domain-checker-available" id="successarea" style="display:none;"></p></div>
<div id="loading" style="display:none;text-align: center;"><span><i class="fa fa-refresh fa-spin" style="color:#0033a0;font-size:22px;"></i></span></div>
<div class="result-item" id="resultsarea" style="display:none;">
	<form id="domainform" action="cart.php?a=add&domain=register" method="post">
        <div class="row row1 search-results" id="searchresults"></div> <!--  search result are appeneded here-->
		<p align="center"><input id="orderbutton" type="button" value="{$_LANG.checkoutbutton} &raquo;" class="hide btn btn-danger" /></p>
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


{include file="$template/includes/modal.tpl" name="Whois" title=$_LANG.whoisresults|cat:' <span id="whoisDomainName"></span>'}
{include file="$template/includes/modal.tpl" name="Error" title="Error"}
