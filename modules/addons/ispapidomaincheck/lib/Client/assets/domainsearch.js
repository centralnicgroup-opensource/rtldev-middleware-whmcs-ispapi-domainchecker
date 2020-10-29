const DomainSearch = function () {
  this.connections = []// queue for pending / queued xhr requests
  this.activeCurrency = null
  this.catmgr = new CategoryManager()
  this.mode = 0// 1 -> suggestions, 0 -> normal search
  this.searchcfg = {
    cacheJobID: null,
    maxCacheTTL: 600000, // 10 minutes in ms
    base: 2,
    initExp: 1,
    maxExp: 4,
    maxGroupsPerPage: 3,
    maxEntriesPerPage: 14, // (2 + 4 + 8)
    // to know if a searchresult corresponds to the search string
    searchString: { IDN: '', PC: '' }
  }
  this.searchGroups = {}
  this.searchResults = []
  this.searchResultsCache = {}
  this.d = {}
  this.handleXHRQueue()
  this.handleResultCache()

  // -------------------------------------------
  // --- init sessionStorage and searchStore ---
  // -------------------------------------------
  // sessionStorage will keep all search settings until browser or
  // the tab is getting closed
  // searchStore is saved json encoded in sessionStorage as it only allows
  // key value pairs as String (toString()!)
  // --- BEGIN
  // (1) check if GET parameters are used
  // e.g. domainchecker.php?search=test.com&cat=5
  const url = new URL(window.location.href)
  const search = url.searchParams.get('search')
  const categories = url.searchParams.get('cat')
  if (search !== null) {
    this.searchStore = {
      domain: DomainSearch.cleanupSearchString(search),
      activeCategories: (categories === null)
        ? []
        : categories.split(',').map(c => {
          return parseInt(c, 10)
        }),
      sug_ip_opt: url.searchParams.get('ip') || '0',
      sug_lang_opt: url.searchParams.get('lang') || '',
      showPremiumDomains: url.searchParams.get('showpremium') || '1',
      showTakenDomains: url.searchParams.get('showtaken') || '1'
    }
    sessionStorage.setItem('ispapi_searchStore', JSON.stringify(this.searchStore))
    this.initFromSessionStorage = 2 // filters can be overwritten by reseller settings
  } else {
    // (2) if sessionStore provides a configuration
    if (sessionStorage.getItem('ispapi_searchStore')) {
      this.searchStore = JSON.parse(sessionStorage.getItem('ispapi_searchStore'))
      this.initFromSessionStorage = 1
      const tmp = $('#searchfield').val()
      if (tmp) {
        this.searchStore.domain = tmp
      }// do not override searchstr that got posted
    } else {
      // (3) otherwise, start with defaults / empty config
      this.searchStore = {}
      sessionStorage.setItem('ispapi_searchStore', '{}')
      this.initFromSessionStorage = 0
    }
  }
  // --- END
}
DomainSearch.cleanupSearchString = function (str) {
  return str.replace(/(^\s+|\s+$|^http(s)?:\/\/)/g, '').toLowerCase()
}
DomainSearch.prototype.handleResultCache = function () {
  this.searchcfg.cacheJobID = setInterval(function () {
    const keys = Object.keys(this.searchResultsCache)
    keys.forEach(function (k) {
      const d = this.searchResultsCache[k]
      if ((Date.now() - d.ts) > this.searchcfg.maxCacheTTL) {
        delete this.searchResultsCache[k]
      }
    }.bind(this))
  }.bind(this), 60000)
}
DomainSearch.prototype.handleXHRQueue = function () {
  // handling connection queue
  // to abort pending / queued xhr requests on demand
  // to save resources on PHP- and API-end
  $(document).ajaxSend(function (event, jqxhr, settings) {
    ds.addToQueue(...arguments)
  })
  $(document).ajaxComplete(function (event, jqxhr, settings) {
    // this should also cover aborted requests
    ds.removeFromQueue(...arguments)
  })
  $(window).off('beforeunload').on('beforeunload', function () {
    ds.clearSearch()
    clearInterval(ds.searchcfg.cacheJobID)
  })
}
// TODO periodically reload
// ensure not to override active categories
// and not to override searchGroups
// but reflect price changes! <-- impossible for premium domains
// for premium domains we would have to again trigger domain check
// idea: working with sessionstorage to store all rows and to populate it from there
// in the way of a TTL cache
// allows to merge the searched domainlist and the results into one place for reuse
DomainSearch.prototype.loadConfiguration = function (currencyid) {
  let cfgurl = '?action=loadconfiguration'
  const currencychanged = currencyid !== undefined
  if (currencychanged) {
    this.clearSearch()
    cfgurl += `&currency=${currencyid}`// to change the currency in session
  }
  if (Object.prototype.hasOwnProperty.call(this.d, currencyid)) {
    this.generate(this.d[currencyid], 'success', currencychanged)
    cfgurl += '&nodata=1'
    $.ajax(cfgurl)
    return
  }
  $.ajax({
    url: cfgurl,
    type: 'GET',
    dataType: 'json'
  }).then((d, statusText) => {
    ds.generate(d, statusText, currencychanged)
  }, (d, statusText) => {
    ds.generate(d, statusText, currencychanged)
  })
}
DomainSearch.prototype.getTLDPricing = function (idndomain) {
  const tld = idndomain.replace(/^[^.]+\./, '')
  const prices = this.d[this.activeCurrency].pricing
  // to have at least the currency for premium domains (see processresults fn)
  let pricing = $.extend({}, { currency: prices.currency })
  if (Object.prototype.hasOwnProperty.call(prices.tlds, tld)) {
    pricing = $.extend(pricing, prices.tlds[tld])
    if (Object.prototype.hasOwnProperty.call(pricing, 'backorder')) {
      pricing.backorder = parseFloat(pricing.backorder).toFixed(2)
    }
    if (Object.prototype.hasOwnProperty.call(pricing, 'backorderlite')) {
      pricing.backorderlite = parseFloat(pricing.backorderlite).toFixed(2)
    }
  }
  return pricing
}
DomainSearch.prototype.clearCache = function () {
  this.searchResultsCache = {}
}
DomainSearch.prototype.clearSearch = function () {
  $('#searchresults').empty()
  this.searchGroups = {}
  this.searchResults = []
  $.each(this.connections, function (idx, jqxhr) {
    if (jqxhr) {
      jqxhr.abort()
    }
  })
}
DomainSearch.prototype.addToQueue = function (event, jqxhr, settings) {
  this.connections.push(jqxhr)
}
DomainSearch.prototype.removeFromQueue = function (event, jqxhr, settings) {
  this.connections.splice($.inArray(jqxhr, ds.connections), 1)
}
DomainSearch.prototype.initForm = function () {
  const data = this.d[this.activeCurrency]
  // when rebuilding dom / form from scratch
  // because currency or something else changed,
  // we have to care about setting searchStore back to
  // an object, otherwise the proxy would trigger new search
  // on every property change
  if (this.searchStore.isProxy) {
    const tmp = {}
    const self = this
    Object.keys(this.searchStore).forEach(k => {
      tmp[k] = self.searchStore[k]
    })
    this.searchStore = tmp
  }
  if (this.initFromSessionStorage) {
    // loop over all form elements (select is also considered under scope of an :input)
    $('#searchform *').filter(':input').each(function () {
      $(this).val(ds.searchStore[this.name])
    })
    $('#searchform').serializeArray().forEach(entry => {
      ds.searchStore[entry.name] = entry.value
    })
    if (!this.searchStore.activeCategories.length) {
      this.searchStore.activeCategories = data.defaultActiveCategories
    }
    this.catmgr.setCategories(data.categories, this.searchStore.activeCategories).generate()
  } else {
    this.searchStore.activeCategories = data.defaultActiveCategories
    this.catmgr.setCategories(data.categories, this.searchStore.activeCategories).generate()
    $('#searchform').serializeArray().forEach(entry => {
      ds.searchStore[entry.name] = entry.value
    })
    sessionStorage.setItem('ispapi_searchStore', JSON.stringify(this.searchStore))
  }
  if (Object.prototype.hasOwnProperty.call(this.searchStore, 'domain')) {
    const tmp = ispapiIdnconverter.convert([this.searchStore.domain])
    this.searchcfg.searchString = { IDN: tmp.IDN[0], PC: tmp.PC[0] }
  }
  $('#showPremiumDomains i').addClass(this.searchStore.showPremiumDomains === '1' ? 'fa-toggle-off' : 'fa-toggle-on')
  $('#showTakenDomains i').addClass(this.searchStore.showTakenDomains === '1' ? 'fa-toggle-off' : 'fa-toggle-on')
  $('#datafilters .filter').off('click').on('click', function () {
    const $eL = $(this).find('i')
    const isOn = $eL.hasClass('fa-toggle-on')
    const filterId = $(this).attr('id')
    const isInverse = $(this).hasClass('filterInverse')
    $eL.toggleClass('fa-toggle-on', !isOn)
    $eL.toggleClass('fa-toggle-off', isOn)
    if (isInverse) {
      ds.searchStore[filterId] = isOn ? '1' : '0'
    } else {
      ds.searchStore[filterId] = isOn ? '0' : '1'
    }
  })
  $('#datafilters').show()

  // Read about proxy here:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/set
  // For IE / Safari?, we use proxy-polyfill (proxy.min.js)
  this.searchStore = new Proxy(this.searchStore, {
    set: function (target, key, value) {
      const isViewFilter = /^showTakenDomains$/i.test(key)
      // rewrite the value as necessary for search input field
      if (key === 'domain') {
        value = DomainSearch.cleanupSearchString(value)
      }
      // trigger search
      if (target[key] !== value) {
        // config has changed, trigger completely new search
        // TODO -> just re-request rows that have not been requested yet!
        if (/^showPremiumDomains$/i.test(key)) {
          ds.clearCache()// as this filter changes the data returned from API
        }
        if (!isViewFilter) {
          ds.clearSearch()
        }
      }
      const result = Reflect.set(...arguments)
      sessionStorage.setItem('ispapi_searchStore', JSON.stringify(ds.searchStore))
      if (!isViewFilter) {
        ds.search()
      } else {
        ds.filter(key, value)
      }
      return result
    },
    get: function (target, key) {
      if (key === 'isProxy') {
        return true
      }
      return Reflect.get(...arguments)
    },
    ownKeys: function (target) {
      return Reflect.ownKeys(target)
    }
  })
  // category changes are subscribed in categorymgr code
  $('#transferbutton').off('click').click(() => {
    const domain = $('#searchfield').val()
    if (/\./.test(domain)) {
      window.location.href = `${wr}/cart.php?a=add&domain=transfer&query=${domain}`
    }
  })
  // category changes are subscribed in categorymgr code
  $('#searchbutton, #loadmorebutton').off('click').click(() => {
    ds.search()
  })
  // starts the search when enterkey is pressed
  $('#searchfield').off('keypress').on('keypress', function (e) {
    const keyCode = e.keyCode || e.which
    if (keyCode === 13 && this.value.length) {
      this.blur()
    }
  })
  $('#searchfield').off('change').change(function () {
    const val = DomainSearch.cleanupSearchString(this.value)
    const tmp = ispapiIdnconverter.convert([val])
    ds.searchcfg.searchString = { IDN: tmp.IDN[0], PC: tmp.PC[0] }
    ds.searchStore[this.name] = val
  })
  if (ds.mode) { // domain suggestions
    $('#sug_lang_opt, #sug_ip_opt').off('change').change(function () {
      ds.searchStore[this.name] = this.value
    })
  }
}
DomainSearch.prototype.generate = async function (d, statusText, currencychanged) {
  const self = this
  // handle the click on the category-button
  $('#legend-button').off('click').click(function () {
    $(this).find('i.legend').toggleClass('fa-angle-up fa-angle-down')
  })
  if (currencychanged) {
    this.clearCache()
  }
  if (d.lookupprovider !== 'ispapi') {
    // show error just in case we have not canceled it
    if (!/^abort$/i.test(statusText)) {
      $('#loading, #resultsarea, #errorcont').hide()
      $('#searchresults').empty()
      $.growl.error({
        title: `${translations.error_occured}!`,
        message: translations.error_lookupprovider
      })
    }
    this.catmgr = null
    return
  }
  if (!Object.prototype.hasOwnProperty.call(d, 'categories')) {
    // show error just in case we have not canceled it
    if (!/^abort$/i.test(statusText)) {
      $('#loading, #resultsarea, #errorcont').hide()
      $('#searchresults').empty()
      $.growl.error({
        title: `${translations.error_occured}!`,
        message: `${translations.error_loadingcfg} (${d.status} ${d.statusText})`
      })
    }
    this.catmgr = null
    return
  }
  this.activeCurrency = d.pricing.currency.id
  this.mode = d.suggestionsOn
  this.backorders = d.backorders
  this.paths = {
    dc: d.path_to_dc_module,
    bo: d.path_to_bo_module
  }
  // apply reseller's filter settings if applicable
  if (this.initFromSessionStorage === 2 || !this.initFromSessionStorage) {
    this.searchStore.showPremiumDomains = d.premiumDomains + ''
    this.searchStore.showTakenDomains = d.takenDomains + ''
  }
  // commented out below lines to be able to reuse response for currency switch
  /* delete d.backorders;
  delete d.cartitems;
  delete d.lang;
  delete d.suggestionsOn;
  delete d.premiumDomains;
  delete d.takenDomains; */

  this.d[this.activeCurrency] = d

  // this.mode = 1 -> domain suggestions
  const tpls = ['resultRow'].concat(this.mode ? ['suggestionscfg', 'suggestionscfgbttn'] : [])
  await TPLMgr.loadTemplates(tpls, 'Client')

  $(document).ready(function () {
    $('#loading').hide()
    if (!currencychanged && self.mode) { // domain suggestions
      // render the specific DOM
      TPLMgr.renderPrepend('#searchform div.addon', 'suggestionscfgbttn')
      TPLMgr.renderBefore('#categories', 'suggestionscfg', {
        locales: d.locales
      })
    }

    self.initForm()
    self.search()

    $('.currencychooser button').off('click').click(function () {
      const eL = $(this)
      if (eL.hasClass('active')) {
        return
      }
      const bttns = $('.currencychooser button')
      bttns.removeClass('active')
      eL.toggleClass('active')
      ds.loadConfiguration(parseInt(eL.attr('id').replace(/^curr_/, ''), 10))
    })
  })
}
DomainSearch.prototype.getDomainSuggestions = function (searchstr) {
  const data = {
    useip: this.searchStore.sug_ip_opt,
    zones: this.catmgr.getSelectedZones(),
    keyword: searchstr,
    language: this.searchStore.sug_lang_opt
  }
  const errmsg = {
    title: `${translations.error_occured}!`,
    message: translations.error_loadingsuggestions
  }
  return new Promise(resolve => {
    $.ajax({
      url: '?action=getsuggestions',
      type: 'POST',
      data: JSON.stringify(data),
      contentType: 'application/json; charset=utf-8',
      dataType: 'json'
    }).then((d, textStatus) => {
      if (!d.length) {
        $.growl.error(errmsg)
      }
      resolve(d)
    }, (d, textStatus) => {
      // show error message only if we have not aborted
      // the xhr requests
      if (!/^abort$/.test(textStatus)) {
        $.growl.error(errmsg)
      }
      resolve(d)// empty array
    })
  }).catch(() => { return [] })
}

DomainSearch.prototype.buildRows = function (list) {
  const group = []
  const self = this
  const l = $.extend(true, {}, list)
  l.PC.forEach((pc, idx) => {
    group.push({
      IDN: l.IDN[idx],
      PC: pc,
      registrar: self.getRegistrar(pc)
    })
  })
  return group
}

DomainSearch.prototype.buildDomainlist = async function () {
  // suggestionlist only works well with IDN keyword (FTASKS-2442)
  const searchstr = this.searchcfg.searchString.IDN
  const searchLabel = searchstr.replace(/\..+$/, '')
  let searchTld = ''
  if (/\./.test(searchstr)) {
    searchTld = searchstr.replace(/^[^.]+\./, '')
  }
  const tldsbyprio = this.d[this.activeCurrency].tldsbyprio
  let domainlist
  let priodomainlist = []
  if (this.mode) {
    // domain suggestions search
    // (1) fetch list of domain suggestions from API
    domainlist = await this.getDomainSuggestions(searchstr)
    // (2) reorder them by by priority of the TLD (reorder by ascii by option)
    const regex = /^[^.]+\./
    priodomainlist = domainlist.sort(function (a, b) {
      const indexA = tldsbyprio.indexOf(a.replace(regex, ''))
      const indexB = tldsbyprio.indexOf(b.replace(regex, ''))
      return (indexA - indexB)
    })
  } else {
    // default search
    // (1) build domain list out of selected categories
    domainlist = this.catmgr.buildDomainlist(searchLabel)
    // (2) build domain list out of ALL available TLDs
    tldsbyprio.forEach((tld) => {
      const entry = `${searchLabel}.${tld}`
      priodomainlist.push(entry)
    })
  }
  if (searchTld.length) {
    priodomainlist.unshift(searchstr)
  }

  // now remove duplicates (case: search for domain including tld)
  // and filter against the selected TLDs (domainlist)
  priodomainlist = priodomainlist.filter((el, index, arr) => {
    return (
      (
        domainlist.indexOf(el) !== -1 || // entry is part of search
        el === this.searchcfg.searchString.IDN || // or matches the IDN search term
        el === this.searchcfg.searchString.PC // or matches the PunyCode search term
      ) &&
      (index === arr.indexOf(el))
    )
  })
  return priodomainlist
}
DomainSearch.prototype.getCachedResult = function (domain) {
  const d = this.searchResultsCache[domain]
  if (d) {
    if ((Date.now() - d.ts) <= this.searchcfg.maxCacheTTL) {
      return d.row
    } else {
      delete this.searchResultsCache[domain]
    }
  }
  return null
}
DomainSearch.prototype.getSearchGroups = async function (searchterm) {
  const newSearchTerm = (searchterm !== this.searchGroups.searchterm)
  if (!Object.prototype.hasOwnProperty.call(this.searchGroups, 'open') || newSearchTerm) {
    $('#searchresults').empty()
    const domainlist = await this.buildDomainlist()
    if (!domainlist.length) {
      this.searchGroups.finished = true
      return []
    }
    this.searchGroups = {
      searchterm: searchterm,
      open: this.buildRows(ispapiIdnconverter.convert(domainlist)),
      finished: false
    }
  }
  const cachedgroup = []
  const result = []
  let groups = this.searchGroups.open.splice(0, this.searchcfg.maxEntriesPerPage)
  groups = groups.filter(row => {
    // append rows to DOM that we request later on
    row.pricing = ds.getTLDPricing(row.IDN)
    row.domainlabel = row.IDN.replace(/\..+$/, '')
    row.extension = row.IDN.replace(/^[^.]+/, '')
    row.isSearchString = (
      row.PC === ds.searchcfg.searchString.PC ||
      row.IDN === ds.searchcfg.searchString.IDN
    )// maybe we could bring this with the above `searchterm` together
    // avoid duplicates
    // jquery v3 provides $.escapeSelector, this can be replaced when
    // WHMCS six template's dependency jquery upgrades from v1 to v3 one day :-(
    const selector = row.PC.replace(/([$%&()*+,./:;<=>?@[\\\]^{|}~'])/g, '\\$1')
    row.element = $(`#${selector}`)
    if (!row.element.length) {
      row.element = TPLMgr.renderAppend('#searchresults', 'resultRow', { row: row })
    }
    const cachedRow = ds.getCachedResult(row.PC)
    if (cachedRow) {
      cachedgroup.push($.extend(true, row, cachedRow))
      return false
    }
    return true
  })
  if (cachedgroup.length) {
    this.processCachedResults(cachedgroup)
  }
  let exp = ds.searchcfg.initExp
  while (groups.length) {
    result.push(groups.splice(0, ds.searchcfg.base ** exp))
    if (++exp > ds.searchcfg.maxExp) {
      exp = ds.searchcfg.initExp
    }
  }
  this.searchGroups.finished = !this.searchGroups.open.length
  return result
}
DomainSearch.prototype.checkTaken = function (sr, val) {
  const row = sr.data
  if (val === undefined) {
    val = ds.searchStore.showTakenDomains
  }
  if (!row.isSearchString && row.status === 'TAKEN' && val === '0') {
    sr.fadeOut()
  } else {
    sr.show()
  }
}
DomainSearch.prototype.processCachedResults = function (list) {
  list.forEach(function (row) {
    const sr = new SearchResult(row)
    this.searchResults.push(sr) // NOTE: this no longer represents the order in DOM
    sr.generate()
    // hide taken ones if applicable
    this.checkTaken(sr)
  }.bind(this))
}
DomainSearch.prototype.processResults = function (grp, d) {
  if (Object.prototype.hasOwnProperty.call(d, 'statusText') && /^abort$/i.test(d.statusText)) {
    // skip aborted connections, new search results are incoming
    return
  }
  grp.forEach((row, idx) => {
    row.status = 'UNKNOWN'
    if (Object.prototype.hasOwnProperty.call(d, status)) { // client http error
      row.REASON = d.statusText
    }
    if (d.success === false) {
      row.REASON = d.errormsg
    } else {
      if (d.results && d.results.length && d.results[idx]) {
        $.extend(row, d.results[idx])
        if (row.CLASS && row.PREMIUMCHANNEL) {
          if (row.CLASS.indexOf(row.PREMIUMCHANNEL) === -1) {
            row.premiumtype = row.PREMIUMCHANNEL
          } else {
            row.premiumtype = 'PREMIUM'
          }
        } else if (row.PREMIUMCHANNEL) {
          row.premiumtype = 'AFTERMARKET'
        }
        // override by returned registrar prices and cleanup row data
        if (Object.prototype.hasOwnProperty.call(row, 'PRICE')) {
          row.pricing.register = { 1: row.PRICE.toFixed(2) }
          delete row.PRICE
        }
        if (Object.prototype.hasOwnProperty.call(row, 'PRICERENEW')) {
          row.pricing.renew = { 1: row.PRICERENEW.toFixed(2) }
          delete row.PRICERENEW
        }
      }
    }
    const sr = new SearchResult(row)
    this.searchResults.push(sr) // NOTE: this no longer represents the order in DOM
    this.searchResultsCache[row.PC] = {
      row: $.extend(true, {}, row),
      ts: Date.now()
    }
    // to ensure we use the one that is created by the next search batch
    delete this.searchResultsCache[row.PC].row.element
    sr.generate()
    // hide taken ones if applicable
    this.checkTaken(sr)
    // no need to care about hiding premiums as this is different
    // (api command changes when using the filter, premiums won't get returned as such)
  })
}
DomainSearch.prototype.filter = function (key, val) {
  switch (key) {
    case 'showTakenDomains':
      this.searchResults.forEach(function (sr) {
        this.checkTaken(sr, val)
      }.bind(this))
      this.checkAllTaken()
      break
  }
}
DomainSearch.prototype.getRegistrar = function (domain) {
  const tld = domain.replace(/^[^.]+\./, '')
  return this.d[this.activeCurrency].registrars[tld]
}
DomainSearch.prototype.requestGroupCheck = function (group) {
  const data = {
    idn: [],
    pc: [],
    registrars: [],
    premiumDomains: parseInt(this.searchStore.showPremiumDomains, 10)
  }
  group.forEach(row => {
    data.idn.push(row.IDN)
    data.pc.push(row.PC)
    data.registrars.push(row.registrar)
  })
  return $.ajax({
    url: '?action=checkdomains',
    type: 'POST',
    data: JSON.stringify(data),
    contentType: 'application/json; charset=utf-8',
    dataType: 'json'
  }).then((d) => {
    ds.processResults(group, d)
  }, (d) => {
    ds.processResults(group, d)
  })
}

DomainSearch.prototype.checkAllTaken = function () {
  if (
    !this.searchResults.length ||
    ds.searchStore.showTakenDomains === '1'
  ) {
    $('#errorcont').hide()
    return
  }
  for (let i = 0; i < this.searchResults.length; i++) {
    const row = this.searchResults[i].data
    if (row.isSearchString || row.status !== 'TAKEN') {
      return // we found a row not being TAKEN
    }
  }
  if (this.searchGroups.finished) {
    if (!$('div.domainbox.clickable').length) {
      $('#errorcont').show()
    }
  } else {
    this.search()
  }
}

DomainSearch.prototype.search = async function () {
  const search = this.searchStore.domain
  if (!search.length) {
    return
  }
  const groups = await this.getSearchGroups(search)
  const promises = []
  $('#resultsarea').show()
  $('#errorcont').hide()
  groups.forEach((grp) => {
    // keep in mind if replacing that fat-arrow fn with
    // this.requestGroupCheck then this context will be window
    promises.push(ds.requestGroupCheck(grp))
  })
  if (this.searchGroups.finished) {
    $('#loadmorebutton').hide()
  } else {
    $('#loadmorebutton').show()
  }
  await Promise.all(promises) // wait for requests to finish
  this.checkAllTaken()
}
