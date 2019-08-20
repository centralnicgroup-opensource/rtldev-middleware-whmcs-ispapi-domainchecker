const ShoppingCart = function () {
  this.items = {}
}
ShoppingCart.prototype.load = async function () {
  try {
    this.items = await $.ajax({
      url: `?action=getcartitems`,
      type: 'GET'
    })
    if (Array.isArray(this.items)) { // empty list
      this.items = {}
    }
  } catch (error) {
    this.items = {}
  }
  if (Object.keys(this.items).length) {
    $('.orderbutton').removeClass('hide')
  } else {
    $('.orderbutton').addClass('hide').off('click')
  }
}
ShoppingCart.prototype.getOrder = function (sr) {
  if (this.items[sr.data.PC]) {
    return this.items[sr.data.PC]
  }
  if (this.items[sr.data.IDN]) {
    return this.items[sr.data.IDN]
  }
  return null
}
ShoppingCart.prototype.addOrderPremium = function (sr, successmsg, errmsg) {
  // WHMCS adds premium domain data to session in their standard domain availability check
  // when calling the `addToCart` action this is being reused to put a premium domain into cart
  // We directly write the data into shopping cart to skip that part
  // This can for sure be replaced with WHMCS' standard logic one day, but needs time for
  // analysis how they set the data and how the call for every premium domain case looks like
  const row = sr.data
  const term = parseInt(row.element.find('.hxdata').data('term'), 10)
  $.ajax(`?action=addPremiumToCart`, {
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      IDN: row.IDN,
      PC: row.PC,
      registrar: row.registrar,
      registerprice: row.element.find('.hxdata').data('registerprice'),
      term: term
    })
  }).done(d => {
    (async function () {
      await cart.load()
      sr.generate()
      $.growl.notice(successmsg)
    }())
  }).fail(() => {
    $.growl.error(errmsg)
  })
}
ShoppingCart.prototype.addOrderDomain = function (sr, successmsg, errmsg) {
  const row = sr.data
  $.post(
    `${wr}/cart.php`,
    {
      a: 'addToCart',
      domain: row.IDN,
      token: csrfToken,
      whois: 0,
      sideorder: 0
    },
    'json'
  ).done(function (data) {
    if (data.result !== 'added') {
      $.growl.error(errmsg)
      return
    }
    // check if the chosen term is different to the lowest term
    // WHMCS creates the order using the lowest term
    // in that case update the order item accordingly
    const termcfg = sr.getTermConfig('register')
    const term = parseInt(row.element.find('.hxdata').data('term'), 10)
    if (term > termcfg.initialTerm) {
      $.post(
        `${wr}/cart.php`,
        {
          a: 'updateDomainPeriod',
          domain: row.IDN,
          period: term,
          token: csrfToken
        },
        'json'
      ).done(function (data) {
        const rows = data.domains.filter((d) => {
          return (d.domain === row.IDN || d.domain === row.PC)
        })
        if (rows.length && rows[0].regperiod === (term + '')) {
          (async function () {
            await cart.load()
            sr.generate()
            $.growl.notice(successmsg)
          }())
        } else {
          $.growl.error(errmsg)
        }
      }).fail(() => {
        $.growl.error(errmsg)
      })
    } else {
      (async function () {
        await cart.load()
        sr.generate()
        $.growl.notice(successmsg)
      }())
    }
  }).fail(() => {
    $.growl.error(errmsg)
  })
}
ShoppingCart.prototype.addOrder = function (sr) {
  const errmsg = {
    title: `${translations.error_occured}!`,
    message: translations.error_addtocart
  }
  const successmsg = {
    title: `${translations.success_occured}!`,
    message: translations.success_addtocart
  }
  // PREMIUM DOMAIN
  if (sr.data.premiumtype) {
    this.addOrderPremium(sr, successmsg, errmsg)
    return
  }
  // BACKORDER
  if (sr.data.status === 'TAKEN') {
    this.addBackorder(sr)
    return
  }
  // STANDARD DOMAIN
  cart.addOrderDomain(sr, successmsg, errmsg)
}
ShoppingCart.prototype.removeOrder = function (sr) {
  const errmsg = {
    title: `${translations.error_occured}!`,
    message: translations.error_removefromcart
  }
  const successmsg = {
    title: `${translations.success_occured}!`,
    message: translations.success_removefromcart
  }
  // BACKORDER
  if (sr.data.status === 'TAKEN') {
    this.deleteBackorder(sr)
    return
  }
  // PREMIUM DOMAIN
  // STANDARD DOMAIN
  cart.removeOrderDomain(sr, successmsg, errmsg)
}
ShoppingCart.prototype.removeOrderDomain = function (sr, successmsg, errmsg) {
  $.ajax(`?action=deleteorder`, {
    type: 'POST',
    dataType: 'json',
    contentType: 'application/json; charset=utf-8',
    data: JSON.stringify({
      PC: sr.data.PC,
      IDN: sr.data.IDN
    })
  }).done(d => {
    if (d.success) {
      (async function () {
        await cart.load()
        sr.generate()
        $.growl.notice(successmsg)
      }())
      return
    }
    $.growl.error(errmsg)
  }).fail(() => {
    $.growl.error(errmsg)
  })
}
ShoppingCart.prototype.orderClickHandler = function (e) {
  // TODO what about domains where NO registrar/autoreg is configured
  // or registrar module is deactivated? see @DCHelper::getTLDRegistrars
  // We can add them to cart, but how does whmcs handle them later on?
  // what about premium domains with special class? how do they get registered?
  if (/^BUTTON$/.test(e.target.nodeName)) {
    return
  }
  if (/^SPAN$/.test(e.target.nodeName)) {
    if ($(e.target).hasClass('caret')) {
      return
    }
  }
  if (e.data.action === 'add') {
    this.addOrder(e.data.sr)
  } else {
    this.removeOrder(e.data.sr)
  }
}
ShoppingCart.prototype.addBackorder = async function (sr) {
  // we can't process the backorder product through
  // the shopping cart as only in case a backorder
  // application succeeds, an invoice has to be created
  await TPLMgr.loadTemplates(['modalboadd'])
  TPLMgr.renderAppend('body', 'modalboadd', {
    row: sr.data,
    price: sr.data.element.find('.hxdata').text()
  })
  $('#backorderaddModal').modal({
    backdrop: 'static',
    keyboard: false
  })
  $('#doCreateBackorder').off().click(function () {
    this.requestBackorderAction(sr, 'Create', {
      title: `${translations.success_occured}!`,
      message: translations.backorder_created
    })
  }.bind(this))
}
ShoppingCart.prototype.deleteBackorder = function (sr) {
  this.requestBackorderAction(sr, 'Delete', {
    title: `${translations.success_occured}!`,
    message: translations.backorder_deleted
  })
}
ShoppingCart.prototype.requestBackorderAction = function (sr, action, successmsg) {
  $.post(
    `${ds.paths.bo}backend/call.php`,
    {
      COMMAND: `${action}Backorder`,
      DOMAIN: sr.data.PC,
      TYPE: 'FULL'
    },
    'json'
  ).done(data => {
    // TODO: why do we have to parse this? BUG:
    // (looks like response is text/html and not json!)
    data = JSON.parse(data)
    if (data.CODE === 200) {
      if (action === 'Create') {
        sr.data.backordered = true
        ds.backorders[sr.data.PC] = true // TODO: data.PROPERTY.ID[0]
      } else {
        sr.data.backordered = false
        delete ds.backorders[sr.data.PC]
      }
      sr.generate()
      $.growl.notice(successmsg)
    } else if (data.CODE === 531) {
      $.growl.error({ message: translations.login_required })
    } else {
      $.growl.error({ message: translations.error_occured })
    }
  }).fail(() => {
    $.growl.error({ message: translations.error_occured })
  })
}
