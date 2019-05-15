let nagrid // Grid "Not Assigned"
let maingrid // Categories
let tldgrids // TLD Lists
let dragCounter = 0 // counter for drag actions
let data // configuration data container
const docElem = document.documentElement

/**
 * Notifications
 * @param d http response data
 * @param msg Message to display
 * @param [title] Title to display
 */
function infoOut (d, msg, title) {
  title = title || 'Error occured!'
  let infomsg = msg
  let isError = false
  if (d.hasOwnProperty('status') && d.status !== 200) {
    isError = true
    infomsg += ` (${d.status} ${d.statusText})`
  }
  if (isError || /(error|fail)/i.test(title) || /(error|fail)/i.test(infomsg)) {
    return $.growl.error({
      title: title,
      message: infomsg
    })
  }
  $.growl.notice({
    title: title,
    message: infomsg
  })
}

/**
 * Initialize Default WHMCS' categories import feature
 */
function initImport () {
  $('#importdefaultcategories').off().click(() => {
    $('#dialog-confirm').dialog({
      title: 'Import WHMCS\' default categories',
      resizable: false,
      height: 'auto',
      width: 400,
      modal: true,
      open: function () {
        $('#contentholder').html(
          '<span class="ui-icon ui-icon-alert"></span> This will overwrite your current configuration. Are you sure?'
        )
      },
      buttons: {
        Confirm: function () {
          $(this).dialog('close')
          $('#loading').show()
          $('#tabs').tabs({ disabled: [0] })
          $.ajax({
            url: '?module=ispapidomaincheck&action=importdefaults',
            type: 'POST',
            dataType: 'json'
          }).done(function (d) {
            $('#loading').hide()
            $('#tabs').tabs({ disabled: [] })
            generate(d)
            generateTab1Block1()
            generateTab2()
            infoOut(d, "Import of the default WHMCS' categories finished.", 'Import successful!')
          }).fail(function (d) {
            $('#loading').hide()
            generate(d)
            generateTab1Block1()
            generateTab2()
            infoOut(d, "Import of the default WHMCS' categories failed.", 'Import failed!')
          })
        },
        Cancel: function () {
          $(this).dialog('close')
        }
      }
    })
  })
}

/**
 * Initialize Add new Category feature
 */
function initAddCategory () {
  $('#addcategory').off().click(() => {
    $('#dialog-confirm').dialog({
      title: 'Add a custom Category',
      resizable: false,
      height: 'auto',
      width: 400,
      modal: true,
      open: function () {
        $('#contentholder').html(
          `<div class="navbar-form">
            <div class="form-group">
              <label for="categoryinp">Category:</label> <input type="text" id="categoryinp" class="form-control" value=""/>
            </div>
            <div class="form-group checkbox">
              <label for="addunassignedtlds"><input type="checkbox" id="addunassignedtlds" value="1"/> Add all unassigned TLDs</label>
            </div>
          </div>`
        )
      },
      buttons: {
        Confirm: function () {
          $('#contentholder .form-group').first().removeClass('has-error')
          const cat = $('#categoryinp').val().replace(/(^\s+|\s+$)/g, '')
          if (!cat.length) {
            $('#contentholder .form-group').first().addClass('has-error')
            return
          }
          const addnatlds = $('#addunassignedtlds').prop('checked') === true
          const tlds = addnatlds ? data.notassignedtlds : []
          $(this).dialog('close')
          $('#loading').show()
          $.ajax({
            url: '?module=ispapidomaincheck&action=addcategory',
            type: 'POST',
            data: {
              category: cat,
              tlds: tlds
            },
            dataType: 'json'
          }).done(function (d) {
            $('#loading').hide()
            infoOut(d, d.msg, 'Action succeeded!')
            if (d.success) {
              data.categories.unshift(d.category)// to correspond to view order
              if (addnatlds) {
                data.notassignedtlds = []
                nagrid.remove(nagrid.getItems())
              }
              addCategory(d.category, 1)
              addTLDGrid($(`#cat_${d.category.id}`)[0], true)
              maingrid.refreshItems().layout()
              generateTab1Block1()
            }
          }).fail(function (d) {
            $('#loading').hide()
            infoOut(d, 'Failed to add the custom category.')
          })
        },
        Cancel: function () {
          $(this).dialog('close')
        }
      }
    })
  })
}

/**
 * get tldgrid instance by given element id
 * @param id html element id
 * @return tldgrid instance
 */
function getTLDGridByID (id) {
  return tldgrids.filter(g => {
    return $(g.getElement()).attr('id') === id
  })[0]
}

/**
 * Initialize Delete Category feature
 */
function initDropCategory () {
  $('.dropcat').off().click(function () {
    const cat = parseInt($(this).attr('id').replace(/^dcat_/, ''), 10)
    const name = $(this).parent().text().replace(/^\s+/, '').replace(/\s+$/, '')
    const gridEl = $(this).closest('.item')
    $('#dialog-confirm').dialog({
      title: `Delete Category '${name}'`,
      resizable: false,
      height: 'auto',
      width: 400,
      modal: true,
      open: function () {
        $('#contentholder').html(
          '<span class="ui-icon ui-icon-alert"></span> This will delete the category and all the assigned TLDs. Are you sure?'
        )
      },
      buttons: {
        Confirm: function () {
          $(this).dialog('close')
          $('#loading').show()
          $.ajax({
            url: '?module=ispapidomaincheck&action=deletecategory',
            type: 'POST',
            data: {
              category: cat
            },
            dataType: 'json'
          }).done(function (d) {
            $('#loading').hide()
            infoOut(d, d.msg, 'Action succeeded!')
            if (d.success) {
              data.categories = data.categories.filter((mycat) => {
                return mycat.id !== cat
              })
              const g = getTLDGridByID(gridEl.find('.tldgrid').attr('id'))
              g.getItems().forEach(item => {
                const id = $(item.getElement()).attr('id')
                const tld = id.replace(/.+_/, '')
                let found = false
                data.categories.forEach(mycat => {
                  found = found || mycat.tlds.indexOf(tld) !== -1
                })
                if (!found) {
                  data.notassignedtlds.unshift(tld)
                  g.send(item, nagrid, 0)
                  let oldid = $(item.getElement()).attr('id')
                  oldid = oldid.split('_')
                  oldid[1] = -1
                  $(item.getElement()).attr('id', oldid.join('_'))
                }
              })
              tldgrids.forEach(function (tldgrid) {
                tldgrid.refreshItems().layout()
              })
              maingrid.remove(gridEl[0], { removeElements: true })
              maingrid.refreshItems().layout()
              generateTab1Block1()
            }
          }).fail(function (d) {
            $('#loading').hide()
            infoOut(d, 'Failed to add the custom category.')
          })
        },
        Cancel: function () {
          $(this).dialog('close')
        }
      }
    })
  })
}

/**
 * Delete TLD feature
 * @param item tldgrid item to delete
 */
function dropTLD (item) {
  const gridEl = $(item.getElement()).closest('.tldgrid-item')
  const tmp = gridEl.attr('id').split('_')
  const cat = parseInt(tmp[1], 10)
  const tld = tmp[2]

  $('#dialog-confirm').dialog({
    title: `Remove TLD '${tld}' from Category`,
    resizable: false,
    height: 'auto',
    width: 400,
    modal: true,
    open: function () {
      $('#contentholder').html(
        `<span class="ui-icon ui-icon-alert"></span> This will remove '${tld}' from the category. Are you sure?`
      )
    },
    buttons: {
      Confirm: function () {
        $(this).dialog('close')
        let found = false
        data.categories = data.categories.map((mycat) => {
          if (mycat.id !== cat) {
            found = found || (mycat.tlds.indexOf(tld) !== -1)
          } else {
            mycat.tlds = mycat.tlds.filter((mytld) => {
              return mytld !== tld
            })
          }
          return mycat
        })
        const g = item.getGrid()
        if (!found) { // tld is not in any further category
          data.notassignedtlds.unshift(tld)
          g.send(item, nagrid, 0)
        } else {
          g.remove(item, { removeElements: true })
        }
        g._emit('dragReleaseEnd', item, true)
      },
      Cancel: function () {
        $(this).dialog('close')
      }
    }
  })
}

/**
 * Add category (to maingrid)
 * @param cat category (object e.g. {id: 1, name: "...", tlds:[]})
 * @param index where the category has to be added
 */
function addCategory (cat, index) {
  let html
  html = `<div class="item">
                <div class="item-content">
                    <div class="panel panel-primary">
                        <div class="panel-heading">
                            <span class="dropcat glyphicon glyphicon-remove" id="dcat_${cat.id}"></span> ${cat.name}
                        </div>
                        <div class="panel-body">
                            <div class="tldgrid" id="cat_${cat.id}">`
  cat.tlds.forEach(tld => {
    html += `<div class="tldgrid-item" id="tld_${cat.id}_${tld}">
                    <div class="item-content">
                        <span class="droptld glyphicon glyphicon-remove"></span> .${tld}
                    </div>
                </div>`
  })
  html += `              </div>
                        </div>
                    </div>
                </div>
            </div>`

  const eL = $.parseHTML(html)
  if (cat.id < 0) {
    $(eL).find('.droptld').hide()
    $(eL).find('.dropcat').remove()
    $(eL).find('.panel-primary').switchClass('panel-primary', 'panel-warning')
  }
  if (index != null) {
    maingrid.add(eL, { index: index })
  } else {
    maingrid.add(eL)
  }
  // hide "not assigned" when empty
  if (cat.id === -1 && !cat.tlds.length) {
    maingrid.hide(eL, { instant: true })
  }
}

/**
 * Initialize Add TLD (to category) feature
 */
function initAddTLD () {
  $('#addtld').off().click(() => {
    let tlds = data.alltlds.map(tld => {
      return `.${tld}`
    })
    let tldsavailable = tlds
    $('#dialog-confirm').dialog({
      title: 'Add TLD to Category',
      resizable: false,
      height: 'auto',
      width: 600,
      modal: true,
      open: function () {
        $('#contentholder').html(
          `<div class="form-inline">
            <div class="form-group">
              <label for="categorylabel" class="sr-only">Category </label> <select id="categoryinp" class="form-control" aria-describedby="helpCatInp"><option value="">Select a Category ...</option>
              </select><span id="helpCatInp" class="help-block">&nbsp;</span>
            </div>
            <div class="form-group">
              <label for="tldinp" class="sr-only">TLD</label> <input type="text" id="tldinp" class="form-control" placeHolder="${tlds[0]}" value="" aria-describedby="helpTLDInp"/><span id="helpTLDInp" class="help-block">Provide a <u>configured</u> TLD that is <u>not</u> yet part of the selected category.</span>
            </div>
          </div>`
        )
        data.categories.forEach(cat => {
          $('#categoryinp').append(`<option value="${cat.id}">${cat.name}</option>`)
        })
        $('#tldinp').autocomplete({
          source: tldsavailable
        })
        $('#categoryinp').change(function () {
          const val = this.value
          if (val !== '') {
            const category = data.categories.filter((cat) => {
              return cat.id === parseInt(val, 10)
            })[0]
            tldsavailable = tlds.filter(function (value) {
              return category.tlds.indexOf(value.replace(/^\./, '')) === -1
            })
          } else {
            tldsavailable = tlds
          }
          tldsavailable.sort()
          $('#tldinp').autocomplete('option', { source: tldsavailable })
        })
      },
      buttons: {
        Add: function () {
          const selectedCat = parseInt($('#categoryinp').val(), 10)
          const selectedTLD = $('#tldinp').val().toLowerCase().replace(/(^\.|\s)/g, '')
          const category = data.categories.filter((cat) => {
            return cat.id === selectedCat
          })[0]
          $('#contentholder .form-group').first().removeClass('has-error')
          $('#contentholder .form-group').last().removeClass('has-error')
          if (category === undefined) {
            $('#contentholder .form-group').first().addClass('has-error')
            return
          }
          const tldlist = category.tlds
          const tldsav = tldsavailable.map(tld => {
            return tld.replace(/\./, '')
          })
          // if invalid input     || already part of that category       || tld not available / configured
          if (!selectedTLD.length || tldlist.indexOf(selectedTLD) !== -1 || tldsav.indexOf(selectedTLD) === -1) {
            $('#contentholder .form-group').last().addClass('has-error')
            return
          }
          tldlist.unshift(selectedTLD)
          $(this).dialog('close')

          // if it is part of category "Not Assigned"
          const g = getTLDGridByID(`cat_${selectedCat}`)
          const found = data.notassignedtlds.indexOf(selectedTLD) !== -1
          if (found) {
            // move it to the category
            data.notassignedtlds = data.notassignedtlds.filter(function (mytld) {
              return mytld !== selectedTLD
            })
            const item = nagrid.getItems().filter(function (i) {
              return $(i.getElement()).attr('id') === `tld_-1_${selectedTLD}`
            })[0]
            nagrid.send(item, g, 0)
            g._emit('dragReleaseEnd', item, false)
          } else {
            // not found, create an new item and add it
            $('#loading').show()
            $.ajax({
              url: '?module=ispapidomaincheck&action=updatecategory',
              data: {
                category: selectedCat,
                tlds: tldlist
              },
              type: 'POST',
              dataType: 'json'
            }).done(function (d) {
              $('#loading').hide()
              if (d.success) {
                category.tlds = tldlist
                $(`#cat_${selectedCat}`).prepend(`<div class="tldgrid-item" id="tld_${selectedCat}_${selectedTLD}">
                    <div class="item-content">
                        <span class="droptld glyphicon glyphicon-remove"></span> .${selectedTLD}
                    </div>
                </div>`)
                g.add($(`#tld_${selectedCat}_${selectedTLD}`)[0], { index: 0 })
                g.refreshItems().layout()
                infoOut(d, d.msg, 'Action successful!')
                return
              }
              infoOut(d, 'Failed to update the category.')
            }).fail(function (d) {
              $('#loading').hide()
              infoOut(d, 'Failed to update the category.')
            })
          }
        },
        Cancel: function () {
          $(this).dialog('close')
        }
      }
    })
  })
}

/**
 * Update Grid "Not Assigned"
 */
function updateNACategory () {
  if (!nagrid) {
    return
  }
  const eL = nagrid.getElement()
  const items = nagrid.getItems()
  if (items.length) {
    items.forEach(i => {
      $(i.getElement()).find('.droptld').hide()
    })
    maingrid.show($(eL).closest('.item')[0], { instant: true })
  } else {
    maingrid.hide($(eL).closest('.item')[0], { instant: true })
  }
}

/**
 * Add a new TLDGrid instance
 * @param elem the html element that covers the grid dom
 * @param prepend if the grid should be at the beginning. by default at the end.
 */
function addTLDGrid (elem, prepend) {
  const tldgrid = new Muuri(elem, {
    items: '.tldgrid-item',
    layoutDuration: 400,
    layoutEasing: 'ease',
    dragEnabled: true,
    dragSort: function () {
      // not allowed to drag into category "Not assigned"
      return tldgrids.filter((g) => {
        return $(g.getElement()).attr('id') !== 'cat_-1'
      })
    },
    dragSortInterval: 0,
    // don't change the below, or tldgrid-item might be invisible when dragging
    dragContainer: document.body,
    dragReleaseDuration: 400,
    dragReleaseEasing: 'ease',
    dragStartPredicate: function (item, event) {
      const $t = $(event.target)
      if (!event.isFinal && $t.hasClass('droptld')) {
        dropTLD(item)
        return false
      }
      return Muuri.ItemDrag.defaultStartPredicate(item, event, {
        distance: 10,
        delay: 50
      })
    },
    dragPlaceholder: {
      enabled: true,
      duration: 300,
      easing: 'ease',
      createElement: null,
      onCreate: null,
      onRemove: null
    }
  }).on('dragStart', function (item) {
    ++dragCounter
    docElem.classList.add('dragging')
    $(item.getElement()).css({
      width: item.getWidth() + 'px',
      height: item.getHeight() + 'px'
    })
  }).on('dragEnd', function () {
    if (--dragCounter < 1) {
      docElem.classList.remove('dragging')
    }
  }).on('dragReleaseEnd', function (item, isRemoved) {
    const $iEL = $(item.getElement())
    const grid = item.getGrid()
    const catTo = parseInt($(grid.getElement()).attr('id').replace(/^.+_/, ''), 10)
    const catFrom = parseInt($iEL.attr('id').replace(/(^[^_]+_|_[^_]+$)/g, ''), 10)
    let data = {
      item: item,
      toGrid: grid,
      toGridId: catTo,
      fromGridId: catFrom
    }
    if (isRemoved) {
      data.action = 'remove'
      // nagrid when unassigned; otherwise fromGrid
      data.fromGrid = getTLDGridByID(`cat_${catFrom}`)
    } else {
      $iEL.css({
        width: '',
        height: ''
      })
      data.action = 'move'
      data.fromGrid = (catTo === catFrom) ? grid : getTLDGridByID(`cat_${catFrom}`)
    }
    saveCategoryChanges(data)
  }).on('layoutStart', function () {
    // necessary to repaint after dragging to another category
    maingrid.refreshItems().layout()
  })
  if ($(elem).attr('id') === 'cat_-1') {
    // initialize global var
    nagrid = tldgrid
  }
  if (prepend) { // after nagrid, at index 1, drop 0 items
    tldgrids.splice(1, 0, tldgrid)
  } else {
    tldgrids.push(tldgrid)
  }
}

/**
 * update lookup configuration output in DOM
 */
function updateLookupConfigurationHTML () {
  $('#cfgsuggestionstatus').text(data.suggestionsOn ? 'ON' : 'OFF')
}

/**
 * update lookup registrar output in DOM
 */
function updateLookupRegistrarHTML () {
  const $lr = $('#cfglookupregistrar')
  if (data.lookupRegistrar === 'ispapi') {
    $lr.text('IS')
    $lr.removeClass('label-danger')
    $lr.addClass('label label-success')
  } else {
    $lr.text('IS NOT')
    $lr.removeClass('label-success')
    $lr.addClass('label label-danger')
  }
}

/**
 * Overwrite Native JS set by WHMCS for submit button
 * in Lookup Configuration Dialog
 */
function replaceLookupConfigurationDialogListeners () {
  var submitButton = $('#btnSaveLookupConfiguration')
  submitButton.off('click')
  submitButton.on('click', function () {
    var modalForm = $('#modalAjax').find('form')
    $('#modalAjax .loader').show()
    $.post(
      modalForm.attr('action'),
      modalForm.serialize(),
      function (d) {
        if (d.successMsg) {
          const selector = 'input[type="checkbox"][name="providerSettings[Registrarispapi][suggestions]"]'
          data.suggestionsOn = modalForm.find(selector).prop('checked') ? 1 : 0
          updateLookupConfigurationHTML()
        }
        updateAjaxModal(d)
      },
      'json'
    ).fail(function (xhr) {
      var data = xhr.responseJSON
      var genericErrorMsg = 'An error occurred while communicating with the server. Please try again.'
      if (data && data.data) {
        data = data.data
        if (data.errorMsg) {
          $.growl.warning({ title: data.errorMsgTitle, message: data.errorMsg })
        } else if (data.data.body) {
          $('#modalAjax .modal-body').html(data.body)
        } else {
          $('#modalAjax .modal-body').html(genericErrorMsg)
        }
      } else {
        $('#modalAjax .modal-body').html(genericErrorMsg)
      }
      $('#modalAjax .loader').fadeOut()
    })
  })
}

/**
 * Overwrite Native JS set by WHMCS for submit button
 * in Lookup Provider Dialog
 */
function replaceLookupProviderDialogListeners () {
  $(document).off('click', '.lookup-provider, .lookup-providers-registrars a')
  $(document).on('click', '.lookup-provider, .lookup-providers-registrars a', function () {
    const self = $(this)
    const provider = self.data('provider')

    $('.lookup-provider').removeClass('active')
    self.addClass('active')

    if (provider === 'Registrar') {
      if ($('.lookup-providers-registrars').hasClass('hidden')) {
        $('.lookup-providers-registrars').hide().removeClass('hidden')
      }
      $('.lookup-providers-registrars').slideDown()
      return
    }

    WHMCS.http.jqClient.post('configdomains.php', {
      token: $('#frmmynotes input[name="token"]').val(),
      provider: provider,
      action: 'lookup-provider'
    }, function (d) {
      if (d.successMsg) {
        dialogClose()
        data.lookupRegistrar = provider
        updateLookupRegistrarHTML()
        $.growl.notice({
          title: d.successMsgTitle,
          message: d.successMsg
        })
      } else {
        $.growl.warning({
          title: d.errorMsgTitle,
          message: d.errorMsg
        })
      }
    }, 'json')
  })
}

/**
 * return list of default active catgories (as ID list)
 *
 * @return list of category ids
 */
function getDefaultSelectedCategories () {
  const actives = []
  $('#categoriescont >li.active').each(function () {
    actives.push(parseInt($(this).attr('id').replace(/^s_/, ''), 10))
  })
  return actives
}

/**
 * Save Configuration `Default Active Categories`
 */
function saveDefaultCategories () {
  const actives = getDefaultSelectedCategories()
  $('#loading').show()
  $.ajax({
    url: '?module=ispapidomaincheck&action=savedefaultcategories',
    type: 'POST',
    data: {
      categories: actives
    },
    dataType: 'json'
  }).done(function (d) {
    $('#loading').hide()
    data.defaultActiveCategories = actives
    infoOut(d, d.msg, 'Action successful!')
  }).fail(function (d) {
    $('#loading').hide()
    infoOut(d, 'Setting update failed.')
  })
}

/**
 * Save Configuration `Display taken Domains`
 * @param event the triggered event
 * @param state the checkbox state (true/false)
 */
function saveSettingTakenDomains (event, state) {
  const val = state ? 1 : 0
  $('#loading').show()
  $.ajax({
    url: '?module=ispapidomaincheck&action=savetakendomains',
    type: 'POST',
    data: {
      takenDomains: val
    },
    dataType: 'json'
  }).done(function (d) {
    $('#loading').hide()
    data.takenDomains = val
    infoOut(d, d.msg, 'Action successful!')
  }).fail(function (d) {
    $('#loading').hide()
    infoOut(d, 'Setting update failed.')
  })
}

/**
 * Save Configuration `Display Premium Domains`
 * @param event the triggered event
 * @param state the checkbox state (true/false)
 */
function saveSettingPremiumDomains (event, state) {
  const val = state ? 1 : 0
  $('#loading').show()
  $.ajax({
    url: '?module=ispapidomaincheck&action=savepremiumdomains',
    type: 'POST',
    data: {
      premiumDomains: val
    },
    dataType: 'json'
  }).done(function (d) {
    $('#loading').hide()
    data.premiumDomains = val
    infoOut(d, d.msg, 'Action successful!')
  }).fail(function (d) {
    $('#loading').hide()
    infoOut(d, 'Setting update failed.')
  })
}

/**
 * Generate Content of Tab `Categories`
 */
function generateTab2 () {
  initImport()
  initAddCategory()
  initAddTLD()

  $('#maingrid').empty()

  // align categories correctly
  maingrid = new Muuri('.grid', {
    layoutDuration: 400,
    layoutEasing: 'ease',
    dragEnabled: true,
    dragSortInterval: 0,
    dragStartPredicate: function (item, event) {
      // Prevent "Not Assigned" from being dragged.
      if (maingrid.getItems().indexOf(item) === 0) {
        return false
      }
      return $(event.target).hasClass('panel-heading')
    },
    dragSortPredicate: function (item) {
      const result = Muuri.ItemDrag.defaultSortPredicate(item, {
        action: 'move',
        threshold: 50
      })
      return result && result.index === 0 ? false : result
    },
    dragReleaseDuration: 400,
    dragReleaseEasing: 'ease'
    /* https://github.com/haltu/muuri/issues/301
      dragPlaceholder: {
      enabled: true,
      duration: 300,
      easing: 'ease',
      createElement: null,
      onCreate: null,
      onRemove: null
    } */
  }).on('layoutStart', function () {
    updateNACategory()
  }).on('layoutEnd', function () {
    initDropCategory()
  })
  // add categories
  data.categories.forEach((cat) => {
    addCategory(cat)
  })
  addCategory({
    id: -1, // not existing id
    name: 'Not assigned',
    tlds: data.notassignedtlds
  }, 0)

  // make tlds draggable
  tldgrids = []
  $('.tldgrid').each(function () {
    addTLDGrid(this, false)
  })
  maingrid.refreshItems().layout()
}

/**
 * (Re-)Gemerate Block 'By-default active Categories' of Tab 1
 */
function generateTab1Block1 () {
  const $uri = $('#genurl')
  let url = new URL(window.location.href)
  const baseurl = `${url.origin}${url.pathname.replace(/[^/]+\/[^/]+$/, '')}domainchecker.php?search=mydomain.com&`
  url = `${baseurl}cat=${data.defaultActiveCategories}`
  $uri.text(url)
  $uri.prop('href', url)
  const $eL = $('#categoriescont')
  $eL.empty()
  data.categories.forEach(cat => {
    const cl = (data.defaultActiveCategories.indexOf(cat.id) === -1) ? '' : ' active'
    $eL.append(`<li class="subCat${cl}" id="s_${cat.id}">${cat.name}</li>`)
  })
  $eL.find('.subCat').off('click').click(function () {
    $(this).toggleClass('active')
    const url = `${baseurl}cat=${getDefaultSelectedCategories()}`
    $uri.text(url)
    $uri.prop('href', url)
  })
  $('#savedefaultcats').off('click').click(saveDefaultCategories)
}

/**
 * Generate Content of Tab `Settings`
 */
function generateTab1 () {
  // BLOCK #1 (Default Active Categories)
  generateTab1Block1()

  // BLOCK #2 (Display Taken Domains)
  $('#toggle-takendomains').off().bootstrapSwitch({
    state: data.takenDomains === 1,
    size: 'small',
    onColor: 'success',
    offColor: 'default'
  }).on('switchChange.bootstrapSwitch', saveSettingTakenDomains)

  // BLOCK #3 (Display Premium Domains)
  $('#toggle-premiumdomains').off().bootstrapSwitch({
    state: data.premiumDomains === 1,
    size: 'small',
    onColor: 'success',
    offColor: 'default'
  }).on('switchChange.bootstrapSwitch', saveSettingPremiumDomains)

  // BLOCK #4 (Lookup Provider + Configuration)
  updateLookupConfigurationHTML()
  updateLookupRegistrarHTML()

  // Change Lookup Provider & Configuration Modal - JS listener override
  // Necessary as we need to know the result of the operation
  // and the target url was wrong for the data post (lookup provider dialog).
  $('#configureLookupProvider').click(function () {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation.addedNodes) return
        if ($('#btnSaveLookupConfiguration').length) {
          replaceLookupConfigurationDialogListeners()
          observer.disconnect()
        }
      })
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    })
  })
  $('#changeLookupProvider').click(function () {
    const observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        if (!mutation.addedNodes) return
        if ($('.lookup-providers-registrars').length) {
          replaceLookupProviderDialogListeners()
          observer.disconnect()
        }
      })
    })
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
      characterData: false
    })
  })
  $('#cfgaccordion').accordion({ heightStyle: 'content' })
}

/**
 * Generate initial View
 * @param d configuration data response
 */
function generate (d) {
  $('#loading').hide()

  data = d
  if (!data.hasOwnProperty('categories')) {
    infoOut(data, 'Error loading configuration')
    $('#tabs').remove()
    $('#contentarea').append('<div><span class="label label-danger">Error: Loading configuration data failed</span></div>')
    return
  }
  $(document).ready(() => {
    $('#tabs').show()
    // render tabs step by step
    // Tab #1
    generateTab1()
    // Tab #2 see activate handler at #tabs
  })
}

/**
 * Save category changes by AJAX Post
 * @param cat categoryid
 * @param tlds tld list
 */
function saveCategory (cat, tlds) {
  if (cat === -1) { // NOT ASSIGNED
    if (!tlds.length) {
      maingrid.hide($(nagrid.getElement()).closest('.item')[0], { instant: true })
    }
    return
  }
  $('#loading').show()
  $.ajax({
    url: '?module=ispapidomaincheck&action=updatecategory',
    type: 'POST',
    data: {
      category: cat,
      tlds: tlds // $ will leave this out when empty
    },
    dataType: 'json'
  }).done(function (d) {
    $('#loading').hide()
    infoOut(d, d.msg, 'Action successful!')
  }).fail(function (d) {
    $('#loading').hide()
    infoOut(d, 'Failed to update the category.')
  })
}

/**
 * Prepare saving tldgrid changes (remove, move)
 * @param data object covering the action data fromGrid, fromGridId, toGrid, toGridId, item, action
 */
function saveCategoryChanges (data) {
  if (data.action === 'remove') {
    // category not changed, position changed or item deleted
    const tlds = []
    data.fromGrid.getItems().forEach(item => {
      tlds.push($(item.getElement()).attr('id').replace(/.+_/, ''))
    })
    // if this tld is no longer assigned to any category
    // it switches category to nagrid
    if (data.toGridId === -1) {
      let oldid = $(data.item.getElement()).attr('id')
      oldid = oldid.split('_')
      oldid[1] = data.toGridId
      $(data.item.getElement()).attr('id', oldid.join('_'))
    }
    saveCategory(data.fromGridId, tlds)
  } else {
    if (data.fromGrid === data.toGrid) {
      // category not changed, position changed or item deleted
      const tlds = []
      data.fromGrid.getItems().forEach(item => {
        tlds.push($(item.getElement()).attr('id').replace(/.+_/, ''))
      })
      saveCategory(data.fromGridId, tlds)
    } else {
      // category changed, care about duplicates
      let tlds = []
      data.fromGrid.getItems().forEach(item => {
        tlds.push($(item.getElement()).attr('id').replace(/.+_/, ''))
      })
      saveCategory(data.fromGridId, tlds)// this won't save for nagrid

      tlds = []
      data.toGrid.getItems().forEach(item => {
        const $iEL = $(item.getElement())
        const iOldID = $iEL.attr('id')
        const tld = iOldID.replace(/.+_/, '')
        const iNewID = `tld_${data.toGridId}_${tld}`
        if (iOldID === iNewID) {
          tlds.push(tld)
        } else {
          const $dupl = $(`#${iNewID}`)
          if ($dupl.length) {
            data.toGrid.remove($dupl[0], { removeElements: true })
          } else {
            tlds.push(tld)
          }
          $iEL.attr('id', iNewID)
        }
        $iEL.find('.droptld').show()
      })
      saveCategory(data.toGridId, tlds)// this won't save for nagrid
    }
  }

  tldgrids.forEach(function (tldgrid) {
    tldgrid.refreshItems()
  })
}

/**
 * load configuration data from PHP
 */
function loadConfig () {
  $.ajax({
    url: '?module=ispapidomaincheck&action=loadconfiguration',
    type: 'GET',
    dataType: 'json'
  }).then((d) => {
    generate(d)
  }, (d) => {
    generate(d)
  })
}

// Trigger initial configuration load
loadConfig()

// Initial DOM Manipulation and rendering of tabs
$(document).ready(() => {
  // init tabs
  const generated = {}
  $('#tabs').tabs({
    beforeActivate: function (event, ui) {
      const idx = ui.newTab.index()
      if (idx === 1 && !generated[idx]) {
        $('#loading').show()
      }
    },
    activate: function (event, ui) {
      const idx = ui.newTab.index()
      if (idx === 1 && !generated[idx]) {
        generateTab2()
        generated[idx] = true
        $('#loading').hide()
      }
    }
  })
  // modify title to save space
  const $ca = $('#contentarea')
  $ca.find('>div >h1').prepend(
    '<a target="_blank" href="https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Usage-Guide"><i class="glyphicon glyphicon-question-sign"></i></a> '
  ).append(
    '<div id="loading"><span><i class="fas fa-sync fa-spin"></i></span></div>'
  )
})
