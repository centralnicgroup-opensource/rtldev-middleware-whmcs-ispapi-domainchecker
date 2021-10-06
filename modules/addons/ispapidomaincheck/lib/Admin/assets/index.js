// eslint-disable-next-line no-unused-vars
const translations = {};
let nagrid; // Grid "Not Assigned"
let maingrid; // Categories
let tldgrids; // TLD Lists
let dragCounter = 0; // counter for drag actions
let data; // configuration data container
const docElem = document.documentElement;
const packer = new Muuri.Packer();

/**
 * Notifications
 * @param d http response data
 * @param msg Message to display
 * @param [title] Title to display
 */
function infoOut(d, msg, title) {
	title = title || 'Error occured!';
	let infomsg = msg;
	let isError = false;
	if (Object.prototype.hasOwnProperty.call(d, 'status') && d.status !== 200) {
		isError = true;
		infomsg += ` (${d.status} ${d.statusText})`;
	}
	if (isError || /(error|fail)/i.test(title) || /(error|fail)/i.test(infomsg)) {
		return $.growl.error({
			title: title,
			message: infomsg,
		});
	}
	$.growl.notice({
		title: title,
		message: infomsg,
	});
}

/**
 * Initialize Default WHMCS' categories import feature
 */
function initImport() {
	$('#importdefaultcategories')
		.off()
		.click(() => {
			$('#dialog-confirm').dialog({
				title: "Import WHMCS' default categories",
				resizable: false,
				height: 'auto',
				width: 400,
				modal: true,
				open: function () {
					$('#contentholder').html(TPLMgr.renderString('import'));
				},
				buttons: {
					Confirm: function () {
						$(this).dialog('close');
						$('#loading').show();
						$('#tabs').tabs({disabled: [0]});
						$.ajax({
							url: '?module=ispapidomaincheck&action=importdefaults',
							type: 'POST',
							dataType: 'json',
						})
							.done(function (d) {
								$('#loading').hide();
								$('#tabs').tabs({disabled: []});
								d.defaultActiveCategories = data.categories.map(cat => cat.id);
								saveDefaultCategories(null, d.defaultActiveCategories);
								generate(d);
								generateTab1Block1();
								generateTab2();
								infoOut(
									d,
									"Import of the default WHMCS' categories finished. Please re-configure your by-default active Categories in Settings Tab.",
									'Import successful!',
								);
							})
							.fail(function (d) {
								$('#loading').hide();
								generate(d);
								generateTab1Block1();
								generateTab2();
								infoOut(
									d,
									"Import of the default WHMCS' categories failed.",
									'Import failed!',
								);
							});
					},
					Cancel: function () {
						$(this).dialog('close');
					},
				},
			});
		});
}

/**
 * Initialize Add new Category feature
 */
function initAddCategory() {
	$('#addcategory')
		.off()
		.click(() => {
			$('#dialog-confirm').dialog({
				title: 'Add a custom Category',
				resizable: false,
				height: 'auto',
				width: 400,
				modal: true,
				open: function () {
					$('#contentholder').html(TPLMgr.renderString('addcategory'));
				},
				buttons: {
					Confirm: function () {
						$('#contentholder .form-group').first().removeClass('has-error');
						const cat = $('#categoryinp')
							.val()
							.replace(/(^\s+|\s+$)/g, '');
						if (!cat.length) {
							$('#contentholder .form-group').first().addClass('has-error');
							return;
						}
						const addnatlds = $('#addunassignedtlds').prop('checked') === true;
						const tlds = addnatlds ? data.notassignedtlds : [];
						$(this).dialog('close');
						$('#loading').show();
						$.ajax({
							url: '?module=ispapidomaincheck&action=addcategory',
							type: 'POST',
							data: {
								category: cat,
								tlds: tlds,
							},
							dataType: 'json',
						})
							.done(function (d) {
								$('#loading').hide();
								infoOut(d, d.msg, 'Action succeeded!');
								if (d.success) {
									data.categories.unshift(d.category); // to correspond to view order
									if (addnatlds) {
										data.notassignedtlds = [];
										nagrid.remove(nagrid.getItems());
									}
									const $catEl = addCategory(d.category, 1);
									addTLDGrid($catEl.find('.tldgrid')[0], true);
									maingrid.refreshItems().layout();
									generateTab1Block1();
								}
							})
							.fail(function (d) {
								$('#loading').hide();
								infoOut(d, 'Failed to add the custom category.');
							});
					},
					Cancel: function () {
						$(this).dialog('close');
					},
				},
			});
		});
}

/**
 * get tldgrid instance by given category id
 * @param categoryid id of the category
 * @return tldgrid instance
 */
function getTLDGridByCategory(categoryid) {
	return tldgrids.filter(g => {
		return $(g.getElement()).data('category') === categoryid;
	})[0];
}

/**
 * Initialize Delete Category feature
 */
function initDropCategory() {
	$('.dropcat')
		.off()
		.click(function () {
			const gridEl = $(this).closest('.item');
			const name = gridEl.data('name');
			const cat = gridEl.data('category');
			$('#dialog-confirm').dialog({
				title: `Delete Category "${name}"`,
				resizable: false,
				height: 'auto',
				width: 400,
				modal: true,
				open: function () {
					$('#contentholder').html(TPLMgr.renderString('dropcategory'));
				},
				buttons: {
					Confirm: function () {
						$(this).dialog('close');
						$('#loading').show();
						$.ajax({
							url: '?module=ispapidomaincheck&action=deletecategory',
							type: 'POST',
							data: {
								category: cat,
							},
							dataType: 'json',
						})
							.done(function (d) {
								$('#loading').hide();
								infoOut(d, d.msg, 'Action succeeded!');
								if (d.success) {
									const idx = data.defaultActiveCategories.indexOf(cat);
									if (idx > -1) {
										data.defaultActiveCategories.splice(idx, 1);
										saveDefaultCategories(null, data.defaultActiveCategories);
									}
									data.categories = data.categories.filter(mycat => {
										return mycat.id !== cat;
									});
									const g = getTLDGridByCategory(
										gridEl.find('.tldgrid').data('category'),
									);
									g.getItems().forEach(item => {
										const tld = $(item.getElement()).data('tld');
										let found = false;
										for (let i = 0; i < data.categories.length; i++) {
											found =
												found || data.categories[i].tlds.indexOf(tld) !== -1;
											if (found) {
												break;
											}
										}
										if (!found) {
											data.notassignedtlds.push(tld);
											g.send(item, nagrid, 0);
										}
									});
									tldgrids.splice(tldgrids.indexOf(g), 1);
									g.destroy(true);
									maingrid.remove(gridEl[0], {
										removeElements: true,
									});
									maingrid.refreshItems().layout();
									generateTab1Block1();
								}
							})
							.fail(function (d) {
								$('#loading').hide();
								infoOut(d, 'Failed to add the custom category.');
							});
					},
					Cancel: function () {
						$(this).dialog('close');
					},
				},
			});
		});
}

/**
 * Delete TLD feature
 * @param item tldgrid item to delete
 */
function dropTLD(item) {
	const itemEl = $(item.getElement());
	const cat = $(item.getGrid().getElement()).data('category');
	const catlabel = itemEl.closest('.item').data('name');
	const tld = itemEl.data('tld');

	$('#dialog-confirm').dialog({
		title: `Remove Extension .${tld}`,
		resizable: false,
		height: 'auto',
		width: 400,
		modal: true,
		open: function () {
			$('#contentholder').html(
				TPLMgr.renderString('droptld', {tld: tld, category: catlabel}),
			);
		},
		buttons: {
			Confirm: function () {
				$(this).dialog('close');
				let found = false;
				data.categories = data.categories.map(mycat => {
					if (mycat.id !== cat) {
						found = found || mycat.tlds.indexOf(tld) !== -1;
					} else {
						mycat.tlds = mycat.tlds.filter(mytld => {
							return mytld !== tld;
						});
					}
					return mycat;
				});
				const g = item.getGrid();
				$(item.getElement()).data(
					'category',
					$(item.getGrid().getElement()).data('category'),
				);
				if (!found) {
					// tld is not in any further category
					data.notassignedtlds.unshift(tld);
					g.send(item, nagrid, 0);
				} else {
					g.remove(item, {removeElements: true});
				}
				g._emit('dragEnd', item);
			},
			Cancel: function () {
				$(this).dialog('close');
			},
		},
	});
}

/**
 * Add category (to maingrid)
 * @param cat category (object e.g. {id: 1, name: "...", tlds:[]})
 * @param index where the category has to be added
 * @returns inserted category item
 */
function addCategory(cat, index) {
	const $eL = $(TPLMgr.renderString('tldgrid', cat));
	if (cat.id < 0) {
		$eL.find('.droptld').hide();
		$eL.find('.dropcat').remove();
		$eL.find('.panel-primary').switchClass('panel-primary', 'panel-warning');
	}
	$eL.data('tlds', cat.tlds);
	if (index != null) {
		maingrid.add($eL[0], {index: index});
	} else {
		maingrid.add($eL[0]);
	}
	// hide "not assigned" when empty
	if (cat.id === -1 && !cat.tlds.length) {
		maingrid.hide($eL[0], {instant: true});
	}
	return $eL;
}

/**
 * Initialize Add TLD (to category) feature
 */
function initAddTLD() {
	$('#addtld')
		.off()
		.click(() => {
			const tlds = data.alltlds.map(tld => {
				return `.${tld}`;
			});
			let tldsavailable = tlds;
			$('#dialog-confirm').dialog({
				title: 'Add TLD to Category',
				resizable: false,
				height: 'auto',
				width: 600,
				modal: true,
				open: function () {
					$('#contentholder').html(
						TPLMgr.renderString('addtld', {
							tld: tlds[0],
							categories: data.categories,
						}),
					);
					$('#tldinp').autocomplete({
						source: tldsavailable,
					});
					$('#categoryinp').change(function () {
						let val = this.value;
						if (val !== '') {
							val = parseInt(val, 10);
							const category = data.categories.filter(cat => {
								return cat.id === val;
							})[0];
							tldsavailable = tlds.filter(function (value) {
								return category.tlds.indexOf(value.replace(/^\./, '')) === -1;
							});
						} else {
							tldsavailable = tlds;
						}
						tldsavailable.sort();
						$('#tldinp').autocomplete('option', {
							source: tldsavailable,
						});
					});
				},
				buttons: {
					Add: function () {
						const selectedCat = parseInt($('#categoryinp').val(), 10);
						const selectedTLD = $('#tldinp')
							.val()
							.toLowerCase()
							.replace(/(^\.|\s)/g, '');
						const category = data.categories.filter(cat => {
							return cat.id === selectedCat;
						})[0];
						$('#contentholder .form-group').first().removeClass('has-error');
						$('#contentholder .form-group').last().removeClass('has-error');
						if (category === undefined) {
							$('#contentholder .form-group').first().addClass('has-error');
							return;
						}
						const tldlist = category.tlds;
						const tldsav = tldsavailable.map(tld => {
							return tld.replace(/\./, '');
						});
						// if invalid input     || already part of that category       || tld not available / configured
						if (
							!selectedTLD.length ||
							tldlist.indexOf(selectedTLD) !== -1 ||
							tldsav.indexOf(selectedTLD) === -1
						) {
							$('#contentholder .form-group').last().addClass('has-error');
							return;
						}
						tldlist.unshift(selectedTLD);
						$(this).dialog('close');

						// if it is part of category "Not Assigned"
						const g = getTLDGridByCategory(selectedCat);
						const found = data.notassignedtlds.indexOf(selectedTLD) !== -1;
						if (found) {
							// move it to the category
							data.notassignedtlds = data.notassignedtlds.filter(function (
								mytld,
							) {
								return mytld !== selectedTLD;
							});
							const item = nagrid.getItems().filter(function (i) {
								return $(i.getElement()).data('tld') === selectedTLD;
							})[0];
							$(item.getElement()).data('category', -1);
							nagrid.send(item, g, 0);
							g._emit('dragEnd', item);
						} else {
							// not found, create an new item and add it
							$('#loading').show();
							$.ajax({
								url: '?module=ispapidomaincheck&action=updatecategory',
								data: {
									category: selectedCat,
									tlds: tldlist,
								},
								type: 'POST',
								dataType: 'json',
							})
								.done(function (d) {
									$('#loading').hide();
									if (d.success) {
										category.tlds = tldlist;
										const $el = TPLMgr.renderPrepend(
											`.tldgrid[data-category="${selectedCat}"]`,
											'tldgriditem',
											selectedTLD,
										);
										g.add($el[0], {index: 0});
										g.refreshItems().layout();
										infoOut(d, d.msg, 'Action successful!');
										return;
									}
									infoOut(d, 'Failed to update the category.');
								})
								.fail(function (d) {
									$('#loading').hide();
									infoOut(d, 'Failed to update the category.');
								});
						}
					},
					Cancel: function () {
						$(this).dialog('close');
					},
				},
			});
		});
}

/**
 * Update Grid "Not Assigned"
 */
function updateNACategory() {
	if (!nagrid) {
		return;
	}
	const eL = nagrid.getElement();
	const items = nagrid.getItems();
	if (items.length) {
		items.forEach(i => {
			$(i.getElement()).find('.droptld').hide();
		});
		maingrid.show($(eL).closest('.item')[0], {instant: true});
	} else {
		maingrid.hide($(eL).closest('.item')[0], {instant: true});
	}
}

function sortItemsByPriority(a, b) {
	const tldA = $(a.getElement()).data('tld');
	const tldB = $(b.getElement()).data('tld');
	const idxA = data.alltlds.indexOf(tldA);
	const idxB = data.alltlds.indexOf(tldB);
	return idxA - idxB;
}

/**
 * Add a new TLDGrid instance
 * @param elem the html element that covers the grid dom
 * @param prepend if the grid should be at the beginning. by default at the end.
 */
function addTLDGrid(elem, prepend) {
	const tldgrid = new Muuri(elem, {
		layout: function (items, width, height) {
			if (items && items.length) {
				items[0].getGrid()._items.sort(sortItemsByPriority);
				items.sort(sortItemsByPriority);
			}
			return packer.getLayout(items, width, height);
		},
		items: '.tldgrid-item',
		layoutDuration: 400,
		layoutEasing: 'ease',
		dragEnabled: true,
		dragSort: function () {
			return tldgrids.filter(g => {
				// not allowed to drag into category "Not assigned"
				return $(g.getElement()).data('category') !== -1;
			});
		},
		dragSortInterval: 0,
		// don't change the below, or tldgrid-item might be invisible when dragging
		dragContainer: document.body,
		dragReleaseDuration: 400,
		dragReleaseEasing: 'ease',
		dragStartPredicate: function (item, event) {
			const $t = $(event.target);
			if (!event.isFinal && $t.hasClass('droptld')) {
				dropTLD(item);
				return false;
			}
			return Muuri.ItemDrag.defaultStartPredicate(item, event, {
				distance: 10,
				delay: 50,
			});
		},
		dragPlaceholder: {
			enabled: true,
			duration: 300,
			easing: 'ease',
			createElement: null,
			onCreate: null,
			onRemove: null,
		},
	})
		.on('dragStart', function (item) {
			++dragCounter;
			docElem.classList.add('dragging');
			$(item.getElement()).data(
				'category',
				$(item.getGrid().getElement()).data('category'),
			);
			$(item.getElement()).css({
				width: item.getWidth() + 'px',
				height: item.getHeight() + 'px',
			});
		})
		.on('dragEnd', function (item) {
			if (--dragCounter < 1) {
				docElem.classList.remove('dragging');
			}
			const $iEL = $(item.getElement());
			const grid = item.getGrid();
			const catTo = $(grid.getElement()).data('category');
			const catFrom = $iEL.data('category');
			$iEL.removeData('category');
			const data = {
				item: item,
				toGrid: grid,
				toGridId: catTo,
				fromGridId: catFrom,
			};
			$iEL.css({
				width: '',
				height: '',
			});
			data.fromGrid = catTo === catFrom ? grid : getTLDGridByCategory(catFrom);
			saveCategoryChanges(data);
		})
		.on('layoutStart', function () {
			// necessary to repaint after dragging to another category
			maingrid.refreshItems().layout();
		});
	if ($(elem).data('category') === -1) {
		// initialize global var
		nagrid = tldgrid;
	}
	if (prepend) {
		// after nagrid, at index 1, drop 0 items
		tldgrids.splice(1, 0, tldgrid);
	} else {
		tldgrids.push(tldgrid);
	}
}

/**
 * update lookup configuration output in DOM
 */
function updateLookupConfigurationHTML() {
	$('#cfgsuggestionstatus').text(data.suggestionsOn ? 'ON' : 'OFF');
}

/**
 * update lookup registrar output in DOM
 */
function updateLookupRegistrarHTML() {
	const $lr = $('#cfglookupregistrar');
	if (data.lookupRegistrar === 'ispapi') {
		$lr.text('IS');
		$lr.removeClass('label-danger');
		$lr.addClass('label label-success');
	} else {
		$lr.text('IS NOT');
		$lr.removeClass('label-success');
		$lr.addClass('label label-danger');
	}
}

/**
 * Overwrite Native JS set by WHMCS for submit button
 * in Lookup Configuration Dialog
 */
function replaceLookupConfigurationDialogListeners() {
	const submitButton = $('#btnSaveLookupConfiguration');
	submitButton.off('click');
	submitButton.on('click', function () {
		const modalForm = $('#modalAjax').find('form');
		$('#modalAjax .loader').show();
		$.post(
			modalForm.attr('action'),
			modalForm.serialize(),
			function (d) {
				if (d.successMsg) {
					const selector =
						'input[type="checkbox"][name="providerSettings[Registrarispapi][suggestions]"]';
					data.suggestionsOn = modalForm.find(selector).prop('checked') ? 1 : 0;
					updateLookupConfigurationHTML();
				}
				updateAjaxModal(d);
			},
			'json',
		).fail(function (xhr) {
			let data = xhr.responseJSON;
			const genericErrorMsg =
				'An error occurred while communicating with the server. Please try again.';
			if (data && data.data) {
				data = data.data;
				if (data.errorMsg) {
					$.growl.warning({
						title: data.errorMsgTitle,
						message: data.errorMsg,
					});
				} else if (data.data.body) {
					$('#modalAjax .modal-body').html(data.body);
				} else {
					$('#modalAjax .modal-body').html(genericErrorMsg);
				}
			} else {
				$('#modalAjax .modal-body').html(genericErrorMsg);
			}
			$('#modalAjax .loader').fadeOut();
		});
	});
}

/**
 * Overwrite Native JS set by WHMCS for submit button
 * in Lookup Provider Dialog
 */
function replaceLookupProviderDialogListeners() {
	$(document).off('click', '.lookup-provider, .lookup-providers-registrars a');
	$(document).on(
		'click',
		'.lookup-provider, .lookup-providers-registrars a',
		function () {
			const self = $(this);
			const provider = self.data('provider');

			$('.lookup-provider').removeClass('active');
			self.addClass('active');

			if (provider === 'Registrar') {
				if ($('.lookup-providers-registrars').hasClass('hidden')) {
					$('.lookup-providers-registrars').hide().removeClass('hidden');
				}
				$('.lookup-providers-registrars').slideDown();
				return;
			}

			WHMCS.http.jqClient.post(
				'configdomains.php',
				{
					token: csrfToken,
					provider: provider,
					action: 'lookup-provider',
				},
				function (d) {
					if (d.successMsg) {
						dialogClose();
						data.lookupRegistrar = provider;
						updateLookupRegistrarHTML();
						$.growl.notice({
							title: d.successMsgTitle,
							message: d.successMsg,
						});
					} else {
						$.growl.warning({
							title: d.errorMsgTitle,
							message: d.errorMsg,
						});
					}
				},
				'json',
			);
		},
	);
}

/**
 * return list of default active catgories (as ID list)
 *
 * @return list of category ids
 */
function getDefaultSelectedCategories() {
	const actives = [];
	$('#categoriescont >li.active').each(function () {
		actives.push(parseInt($(this).attr('id').replace(/^s_/, ''), 10));
	});
	return actives;
}

/**
 * Save Configuration `Default Active Categories`
 */
function saveDefaultCategories(event, categories) {
	const actives = categories || getDefaultSelectedCategories();
	$('#loading').show();
	$.ajax({
		url: '?module=ispapidomaincheck&action=savedefaultcategories',
		type: 'POST',
		data: {
			categories: actives,
		},
		dataType: 'json',
	})
		.done(function (d) {
			$('#loading').hide();
			data.defaultActiveCategories = actives;
			infoOut(d, d.msg, 'Action successful!');
		})
		.fail(function (d) {
			$('#loading').hide();
			infoOut(d, 'Setting update failed.');
		});
}

/**
 * Save Configuration `Display taken Domains`
 * @param event the triggered event
 * @param state the checkbox state (true/false)
 */
function saveSettingTakenDomains(event, state) {
	const val = state ? 1 : 0;
	$('#loading').show();
	$.ajax({
		url: '?module=ispapidomaincheck&action=savetakendomains',
		type: 'POST',
		data: {
			takenDomains: val,
		},
		dataType: 'json',
	})
		.done(function (d) {
			$('#loading').hide();
			data.takenDomains = val;
			infoOut(d, d.msg, 'Action successful!');
		})
		.fail(function (d) {
			$('#loading').hide();
			infoOut(d, 'Setting update failed.');
		});
}

/**
 * Save Configuration `Display Premium Domains`
 * @param event the triggered event
 * @param state the checkbox state (true/false)
 */
function saveSettingPremiumDomains(event, state) {
	const val = state ? 1 : 0;
	$('#loading').show();
	$.ajax({
		url: '?module=ispapidomaincheck&action=savepremiumdomains',
		type: 'POST',
		data: {
			premiumDomains: val,
		},
		dataType: 'json',
	})
		.done(function (d) {
			$('#loading').hide();
			data.premiumDomains = val;
			infoOut(d, d.msg, 'Action successful!');
		})
		.fail(function (d) {
			$('#loading').hide();
			infoOut(d, 'Setting update failed.');
		});
}

/**
 * Generate Content of Tab `Categories`
 */
function generateTab2() {
	initImport();
	initAddCategory();
	initAddTLD();

	$('#maingrid').empty();

	// align categories correctly
	maingrid = new Muuri('.grid', {
		layoutDuration: 100,
		layoutEasing: 'ease',
		dragEnabled: true,
		dragSortInterval: 0,
		dragStartPredicate: function (item, event) {
			// Prevent "Not Assigned" from being dragged.
			if (maingrid.getItems().indexOf(item) === 0) {
				return false;
			}
			return $(event.target).hasClass('panel-heading');
		},
		dragSortPredicate: function (item) {
			const result = Muuri.ItemDrag.defaultSortPredicate(item, {
				action: 'move',
				threshold: 50,
			});
			return result && result.index === 0 ? false : result;
		},
		dragReleaseDuration: 400,
		dragReleaseEasing: 'ease',
	})
		.on('layoutStart', function () {
			updateNACategory();
		})
		.on('layoutEnd', function () {
			initDropCategory();
		});
	// add categories
	data.categories.forEach(cat => {
		addCategory(cat);
	});
	addCategory(
		{
			id: -1, // not existing id
			name: 'Not assigned',
			tlds: data.notassignedtlds,
		},
		0,
	);

	// make tlds draggable
	tldgrids = [];
	$('.tldgrid').each(function () {
		addTLDGrid(this, false);
	});
	maingrid.refreshItems().layout();
}

/**
 * (Re-)Gemerate Block 'By-default active Categories' of Tab 1
 */
function generateTab1Block1() {
	const $uri = $('#genurl');
	let url = new URL(window.location.href);
	const baseurl = `${url.origin}${url.pathname.replace(
		/[^/]+\/[^/]+$/,
		'',
	)}domainchecker.php?search=mydomain.com&`;
	url = `${baseurl}cat=${data.defaultActiveCategories}`;
	$uri.text(url);
	$uri.prop('href', url);
	const $eL = $('.catcontainer');
	$eL.empty();
	TPLMgr.renderAppend('.catcontainer', 'activecats', {
		categories: data.categories,
		cssclass: function () {
			return data.defaultActiveCategories.indexOf(this.id) === -1
				? ''
				: ' active';
		},
	});
	$eL
		.find('.subCat')
		.off('click')
		.click(function () {
			$(this).toggleClass('active');
			const url = `${baseurl}cat=${getDefaultSelectedCategories()}`;
			$uri.text(url);
			$uri.prop('href', url);
		});
	$('#savedefaultcats').off('click').click(saveDefaultCategories);
}

/**
 * Generate Content of Tab `Settings`
 */
function generateTab1() {
	// BLOCK #1 (Default Active Categories)
	generateTab1Block1();

	// BLOCK #2 (Display Taken Domains)
	$('#toggle-takendomains')
		.off()
		.bootstrapSwitch({
			state: data.takenDomains === 1,
			size: 'small',
			onColor: 'success',
			offColor: 'default',
		})
		.on('switchChange.bootstrapSwitch', saveSettingTakenDomains);

	// BLOCK #3 (Display Premium Domains)
	$('#toggle-premiumdomains')
		.off()
		.bootstrapSwitch({
			state: data.premiumDomains === 1,
			size: 'small',
			onColor: 'success',
			offColor: 'default',
		})
		.on('switchChange.bootstrapSwitch', saveSettingPremiumDomains);

	// BLOCK #4 (Lookup Provider + Configuration)
	updateLookupConfigurationHTML();
	updateLookupRegistrarHTML();

	// Change Lookup Provider & Configuration Modal - JS listener override
	// Necessary as we need to know the result of the operation
	// and the target url was wrong for the data post (lookup provider dialog).
	$('#configureLookupProvider').click(function () {
		const observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				if (!mutation.addedNodes) return;
				if ($('#btnSaveLookupConfiguration').length) {
					replaceLookupConfigurationDialogListeners();
					observer.disconnect();
				}
			});
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: false,
			characterData: false,
		});
	});
	$('#changeLookupProvider').click(function () {
		const observer = new MutationObserver(function (mutations) {
			mutations.forEach(function (mutation) {
				if (!mutation.addedNodes) return;
				if ($('.lookup-providers-registrars').length) {
					replaceLookupProviderDialogListeners();
					observer.disconnect();
				}
			});
		});
		observer.observe(document.body, {
			childList: true,
			subtree: true,
			attributes: false,
			characterData: false,
		});
	});
	$('#cfgaccordion').accordion({heightStyle: 'content'});
}

/**
 * Generate initial View
 * @param d configuration data response
 */
function generate(d) {
	$('#loading').hide();

	data = d;
	if (!Object.prototype.hasOwnProperty.call(data, 'categories')) {
		infoOut(data, 'Error loading configuration');
		$('#tabs').remove();
		TPLMgr.renderAppend('#contentarea', 'loadcfgerror');
		return;
	}
	$(document).ready(() => {
		$('#tabs').show();
		// render tabs step by step
		// Tab #1
		generateTab1();
		// Tab #2 see activate handler at #tabs
	});
}

/**
 * Save category changes by AJAX Post
 * @param cat categoryid
 * @param tlds tld list
 */
function saveCategory(cat, tlds) {
	if (cat === -1) {
		// NOT ASSIGNED
		if (!tlds.length) {
			maingrid.hide($(nagrid.getElement()).closest('.item')[0], {
				instant: true,
			});
		}
		return;
	}
	$('#loading').show();
	$.ajax({
		url: '?module=ispapidomaincheck&action=updatecategory',
		type: 'POST',
		data: {
			category: cat,
			tlds: tlds, // $ will leave this out when empty
		},
		dataType: 'json',
	})
		.done(function (d) {
			$('#loading').hide();
			infoOut(d, d.msg, 'Action successful!');
		})
		.fail(function (d) {
			$('#loading').hide();
			infoOut(d, 'Failed to update the category.');
		});
}

/**
 * Prepare saving tldgrid changes (remove, move)
 * @param data object covering the action data fromGrid, fromGridId, toGrid, toGridId, item, action
 */
function saveCategoryChanges(data) {
	let tlds = [];
	const $iEL = $(data.item.getElement());
	const mytld = $iEL.data('tld');
	const foundIndexes = [];
	$iEL.data('category', data.toGridId);
	if (data.toGridId !== -1) {
		// naGrid
		$iEL.find('.droptld').show();
	}
	data.toGrid.getItems().forEach(item => {
		const tld = $(item.getElement()).data('tld');
		if (tld === mytld) {
			foundIndexes.push(tlds.length);
		}
		tlds.push(tld);
	});
	foundIndexes.pop(); // keep one item
	if (foundIndexes.length) {
		foundIndexes.forEach(idx => {
			data.toGrid.remove(data.toGrid.getItems()[idx], {
				removeElements: true,
			});
			tlds.splice(idx, 1);
		});
	}
	saveCategory(data.toGridId, tlds); // this won't save for naGrid
	tlds = [];
	data.fromGrid.getItems().forEach(item => {
		tlds.push($(item.getElement()).data('tld'));
	});
	saveCategory(data.fromGridId, tlds); // this won't save for naGrid

	tldgrids.forEach(function (tldgrid) {
		tldgrid.refreshItems();
	});
}

/**
 * load configuration data from PHP
 */
function loadConfig() {
	$.ajax({
		url: '?module=ispapidomaincheck&action=loadconfiguration',
		type: 'GET',
		dataType: 'json',
	}).then(
		d => {
			generate(d);
		},
		d => {
			generate(d);
		},
	);
}

// Trigger initial configuration load
loadConfig();

// const wr = new URLSearchParams(document.currentScript.src.replace(/[^?]+/, '')).get('wr')

// Initial DOM Manipulation and rendering of tabs
$(document).ready(() => {
	(async function () {
		// load templates
		await TPLMgr.loadTemplates(
			[
				'activecats',
				'import',
				'tldgrid',
				'tldgriditem',
				'loading',
				'help',
				'loadcfgerror',
				'addtld',
				'addcategory',
				'droptld',
				'dropcategory',
			],
			'Admin',
		);
		// init tabs
		const generated = {};
		$('#tabs').tabs({
			beforeActivate: function (event, ui) {
				const idx = ui.newTab.index();
				if (idx === 1 && !generated[idx]) {
					$('#loading').show();
				}
			},
			activate: function (event, ui) {
				const idx = ui.newTab.index();
				if (idx === 1 && !generated[idx]) {
					generateTab2();
					generated[idx] = true;
					$('#loading').hide();
				}
			},
		});
		// modify title to save space
		TPLMgr.renderPrepend('#contentarea >div >h1', 'help', {});
		TPLMgr.renderAppend('#contentarea >div >h1', 'loading', {});
	})();
});
