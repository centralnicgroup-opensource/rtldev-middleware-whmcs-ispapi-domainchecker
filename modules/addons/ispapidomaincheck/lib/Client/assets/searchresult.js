const SearchResult = function (row) {
	this.data = row;
	this.data.isBackorderable = false;
	if (this.data.status === 'TAKEN') {
		if (Object.prototype.hasOwnProperty.call(this.data.pricing, 'backorder')) {
			this.data.isBackorderable = true;
		}
		// FEAT not yet supported in backorder module
		// if (this.data.pricing.hasOwnProperty("backorderlite")) {
		//    this.data.isBackorderable = true
		// }
		if (this.data.isBackorderable) {
			this.data.backordered =
				Object.prototype.hasOwnProperty.call(ds.backorders, this.data.PC) ||
				Object.prototype.hasOwnProperty.call(ds.backorders, this.data.IDN);
		}
	}
};
SearchResult.prototype.fadeOut = function () {
	this.data.element.fadeOut('slow', 'linear');
};
SearchResult.prototype.fadeIn = function () {
	this.data.element.fadeIn();
};
SearchResult.prototype.getTermConfig = function (key) {
	if (!Object.prototype.hasOwnProperty.call(this.data.pricing, key)) {
		return null;
	}
	const cfg = {
		terms: Object.keys(this.data.pricing[key]).sort(),
	};
	cfg.initialTerm = cfg.terms[0];
	return cfg;
};
SearchResult.prototype.hide = function () {
	this.data.element.hide();
};
SearchResult.prototype.show = function () {
	this.data.element.show();
};
SearchResult.prototype.applyClickHandler = function () {
	const row = this.data;
	row.element.off();
	if (row.element.hasClass('clickable')) {
		row.element.click(
			{
				action: row.order || row.backordered ? 'remove' : 'add',
				sr: this,
			},
			cart.orderClickHandler.bind(cart),
		);
	}
};
SearchResult.prototype.generate = function () {
	this.data.order = cart.getOrder(this);
	switch (this.data.status) {
		case 'TAKEN':
			this.showTaken();
			break;
		case 'AVAILABLE':
			this.showAvailable();
			break;
		case 'INVALID':
			this.showInvalid();
			break;
		case 'RESERVED':
			this.showReserved();
			break;
		default:
			// status 'UNKNOWN' and error cases
			this.showError();
			break;
	}
	if (this.data.isSearchString) {
		this.data.element.addClass(
			'searchstring-' +
				(this.data.status === 'AVAILABLE' ? 'available' : 'taken'),
		);
	}
	this.applyClickHandler();
};
SearchResult.prototype.getPrice = function (pricetype, doformat, term) {
	const currency = this.data.pricing.currency;
	const price = this.data.pricing[pricetype];
	if (price) {
		if (term) {
			if (Object.prototype.hasOwnProperty.call(price, term)) {
				if (doformat) {
					return `${currency.prefix}${price[term]}${currency.suffix}`;
				}
				return `${price[term]}`;
			}
		} else {
			if (doformat) {
				return `${currency.prefix}${price}${currency.suffix}`;
			}
			return `${price}`;
		}
	}
	return '-';
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showError = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-error" data-toggle="tooltip" title="${row.REASON}">${translations.domaincheckererror}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showInvalid = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-taken" data-toggle="tooltip" title="${translations.label_descr_invaliddn}">${translations.domaincheckerinvaliddn}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showReserved = function () {
	const row = this.data;
	row.element
		.toggleClass('clickable')
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-reserved" data-toggle="tooltip" title="${translations.label_descr_reserveddn}">${translations.domaincheckerreserveddn}</span>`,
		);
	row.element.find('div.col-xs-7').removeClass('search-result-info');
	row.element
		.find('div.second-line.registerprice')
		.html('<span>—</span><br><span><br></span>');
};
// TODO move the below HTML code into Mustache templates
// idea: having for every case a complete row covered, easier to read
SearchResult.prototype.showAvailable = function () {
	const row = this.data;
	const regenerate = !!row.element.find('.hxdata').length;
	const termcfg = this.getTermConfig('register');
	if (!termcfg) {
		// registration price not configured
		row.REASON = `${translations.error_notldprice}!`;
		this.showTaken();
		return;
	}
	const group = row.pricing.group;
	const regprice = this.getPrice('register', true, termcfg.initialTerm);
	const regpriceraw = this.getPrice('register', false, termcfg.initialTerm);
	const renprice = this.getPrice('renew', true, termcfg.initialTerm);
	const multiTerms = termcfg.terms.length > 1;
	// just set this once and not again after adding to cart, we would loss the chosen term and price
	if (!regenerate) {
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.addClass('available');
		row.element
			.find('span.checkboxarea')
			.html(
				'<label><i class="far fa-square avail" aria-hidden="true"></i></label>',
			);
		row.element
			.find('div.availability')
			.html(
				`<span class="label label-hx label-hx-available">${translations.domaincheckeravailable}</span>`,
			);
		row.element.find('div.second-line.registerprice').empty();
		if (row.premiumtype) {
			// premium domain handling
			if (row.premiumtype === 'AFTERMARKET') {
				let transferhtml = '';
				if (ds.d[ds.activeCurrency].domainTransfers) {
					transferhtml = `<a href="${wr}/cart.php?a=add&domain=transfer&query=${row.IDN}" target="_blank" class="label label-hx label-hx-transfer pt">${translations.domaincheckertransfer}</a>`;
				}
				row.element
					.find('div.availability')
					.html(
						`<span class="label label-hx label-hx-taken">${translations.domaincheckertaken}</span>${transferhtml}`,
					);
			}
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-premium">${
						translations[row.premiumtype.toLowerCase()] || row.premiumtype
					}</span>`,
				);
		} else {
			if (multiTerms) {
				let opts = '';
				termcfg.terms.forEach(term => {
					opts += `<li><a href="javascript:;">${term}${translations.unit_s_year}</li>`;
				});
				row.element
					.find('div.second-line.registerprice')
					.html(
						`<button class="btn btn-default btn-xs dropdown-toggle" type="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">${termcfg.initialTerm}${translations.unit_s_year} <span class="caret"></span></button><ul class="dropdown-menu">${opts}</ul>`,
					);
				row.element
					.find('.dropdown-menu li')
					.off()
					.click(this, this.switchTerm);
			}
			if (group) {
				row.element
					.find('div.availability')
					.append(
						`<span class="label label-hx label-hx-${group}">${
							translations['group' + group]
						}</span>`,
					);
			}
		}
		// display prices
		row.element
			.find('div.second-line.registerprice')
			.append(`<span class="registerprice">${regprice}</span>`);
		row.element
			.find('div.second-line.renewalprice')
			.html(
				`<span class="renewal">${translations.renewal}: ${renprice}</span>`,
			);
		// add ADDED and price to the hidden div
		row.element
			.find('span.registerprice.added')
			.html(
				`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="${termcfg.initialTerm}">${regprice}</span>`,
			);
	}

	row.element
		.find('span.checkboxarea')
		.find('i.fa-spin')
		.removeClass('fas fa-spinner fa-spin')
		.addClass(row.order ? 'fas fa-check-square' : 'far fa-square');

	if (row.order) {
		if (multiTerms) {
			row.element
				.find(`ul.dropdown-menu > li > a:contains("${row.order.regperiod}Y")`)
				.trigger('click')
				.parent('li')
				.addClass('active');
		}
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.addClass('added');
		row.element
			.find('span.checkboxarea')
			.find('i.far')
			.removeClass('far fa-square')
			.addClass('fas fa-check-square');
		row.element
			.find('div.search-result-price')
			.addClass('hidden')
			.eq(1)
			.removeClass('hidden');
	} else {
		row.element
			.find('span.checkboxarea')
			.find('i.fas')
			.removeClass('fas fa-check-square')
			.addClass('far fa-square');
		row.element
			.find('span.domainname.domain-label, span.domainname.tld-zone')
			.removeClass('added');
		row.element
			.find('div.search-result-price')
			.removeClass('hidden')
			.eq(1)
			.addClass('hidden');
	}
};
SearchResult.prototype.showTaken = function () {
	const row = this.data;
	// TAKEN CASES
	//
	// (3) normal domain (NOT BACKORDERABLE)
	// to add Added and backorder price
	let transferhtml = '';
	if (ds.d[ds.activeCurrency].domainTransfers) {
		console.log('transfers enabled');
		transferhtml = `<a href="${wr}/cart.php?a=add&domain=transfer&query=${row.IDN}" target="_blank" class="label label-hx label-hx-transfer pt">${translations.domaincheckertransfer}</a>`;
	}
	row.element
		.find('div.availability')
		.html(
			`<span class="label label-hx label-hx-taken">${translations.domaincheckertaken}</span>${transferhtml}<span class="label label-hx label-hx-whois pt" data-domain="${row.IDN}" data-pc="${row.PC}"><i class="fa fa-question-circle"></i> ${translations.whois}</span>`,
		);
	row.element
		.find('span.domainname.domain-label, span.domainname.tld-zone')
		.removeClass('added');

	if (row.isBackorderable) {
		const renprice = this.getPrice('renew', true, 1);
		const regprice = this.getPrice('backorder', true);
		const regpriceraw = this.getPrice('backorder', false);
		row.element
			.find('span.registerprice.added')
			.html(
				`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="1">${regprice}</span>`,
			);
		row.element
			.find('div.search-result-price')
			.removeClass('hidden')
			.eq(1)
			.addClass('hidden');
		if (row.backordered) {
			// BACKORDER EXISTS
			row.element
				.find('span.domainname.domain-label, span.domainname.tld-zone')
				.addClass('added');
			row.element
				.find('span.checkboxarea')
				.html(
					'<label class="added setbackorder"><i class="fas fa-check-square avail" aria-hidden="true"></i></label>',
				);
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-backorder added">${translations.backorder}</span>`,
				)
				.find('span.taken')
				.addClass('added');
			// hide the display register and renewprice as before
			row.element
				.find('span.checkboxarea')
				.find('i.far')
				.removeClass('far fa-square')
				.addClass('fas fa-check-square');
			row.element
				.find('div.search-result-price')
				.addClass('hidden')
				.eq(1)
				.removeClass('hidden');
		} else {
			// BACKORDERABLE
			row.element
				.find('span.checkboxarea')
				.html(
					'<label class="setbackorder"><i class="far fa-square" aria-hidden="true"></i></label>',
				);
			row.element
				.find('div.availability')
				.append(
					`<span class="label label-hx label-hx-backorder">${translations.backorder}</span>`,
				);
			// display prices
			row.element
				.find('div.second-line.registerprice')
				.html(`<span class="registerprice">${regprice}</span>`);
			row.element
				.find('div.second-line.renewalprice')
				.html(
					`<span class="renewal">${translations.renewal}: ${renprice}</span>`,
				);
			// add ADDED and price to the hidden div
			row.element
				.find('span.registerprice.added')
				.html(
					`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="1">${regprice}</span>`,
				);
		}
	} else {
		// NOT BACKORDERABLE
		row.element.toggleClass('clickable');
		row.element.find('div.col-xs-7').removeClass('search-result-info');
		row.element
			.find('div.second-line.registerprice')
			.html('<span>—</span><br><span><br></span>');
	}

	row.element
		.find('.label-hx-whois')
		.off()
		.on('click', this.showWhoisInformation);
};
SearchResult.prototype.switchTerm = function (e) {
	// to prevent event bubbling to parent element
	e.stopPropagation(); // because of this we have to close dropdown menu manually
	const sr = e.data;
	const row = sr.data;
	row.element.find('div.second-line.registerprice').removeClass('open');
	row.element.find('button.dropdown-toggle').attr('aria-expanded', false);
	let chosenTerm = $(this).text();
	row.element
		.find('.dropdown-toggle:first-child')
		.html(`${chosenTerm} <span class="caret"></span>`);
	chosenTerm = parseInt(chosenTerm, 10);
	row.element.find('.dropdown-toggle:first-child').val(chosenTerm);
	// update prices
	const regprice = sr.getPrice('register', true, chosenTerm);
	const regpriceraw = sr.getPrice('register', false, chosenTerm);
	const renprice = sr.getPrice('renew', true, chosenTerm);
	row.element
		.find('div.second-line.registerprice span.registerprice')
		.html(regprice);
	row.element
		.find('div.second-line.renewalprice')
		.html(`<span class="renewal">${translations.renewal}: ${renprice}</span>`);
	// add ADDED and price to the hidden div
	row.element
		.find('span.registerprice.added')
		.html(
			`<span>${translations.domain_added_to_cart}</span><br/><span class="registerprice added hxdata" data-registerprice="${regpriceraw}" data-term="${chosenTerm}">${regprice}</span>`,
		);
};
SearchResult.prototype.showWhoisInformation = function (e) {
	// to prevent event bubbling to parent element
	e.stopPropagation();
	const domain = $(this).data('domain');
	const pc = $(this).data('pc');
	$('#modalWhois').show();
	$('#modalWhoisBody')
		.css({
			'overflow-y': 'auto',
			height: $(window).height() - 200 + 'px',
		})
		.hide();
	$('#whoisDomainName').html(domain);
	$('#modalWhois').modal('show');
	$('#modalWhoisLoader').toggleClass('w-hidden');
	$.post(`${wr}/mywhois.php`, `idn=${domain}&pc=${pc}`, function (data) {
		// fetch html contents of body element
		const m = data.match(/<body[^>]*>([\w|\W]*)<\/body>/im);
		$('#modalWhoisBody').html(m[1]);
		$('#modalWhoisLoader').toggleClass('w-hidden');
		$('#modalWhoisBody').show();
	});
};
