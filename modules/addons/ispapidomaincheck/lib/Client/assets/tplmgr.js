const TPLMgr = function () {
}
TPLMgr.loadTemplates = function (tpls) {
  // only load templates that are not yet loaded
  tpls = tpls.filter((tpl) => {
    return !$.Mustache.has(tpl)
  })
  return new Promise(resolve => {
    // --- https://github.com/jonnyreeves/jquery-Mustache#usage
    // --- https://github.com/janl/mustache.js
    const tplpath = `${wr}/modules/addons/ispapidomaincheck/lib/Client/templates/`
    const tplext = '.mustache'
    let count = tpls.length
    if (!count) {
      resolve()
    } else {
      tpls.forEach(tpl => {
        $.Mustache.load(`${tplpath}${tpl}${tplext}`).done((d) => {
          $.Mustache.add(tpl, d)
          count--
          if (count === 0) {
            resolve()
          }
        })
      })
    }
  })
}
TPLMgr.has = function (tpl) {
  return $.Mustache.has(tpl)
}
TPLMgr.renderAppend = function (selector, tpl, data) {
  $.extend(data, { translations: translations })
  return $(selector).mustache(tpl, data).children().last()
}
TPLMgr.renderBefore = function (selector, tpl, data) {
  $.extend(data, { translations: translations })
  return $(TPLMgr.renderString(tpl, data)).insertBefore(selector)
}
TPLMgr.renderPrepend = function (selector, tpl, data) {
  $.extend(data, { translations: translations })
  return $(selector).mustache(tpl, data, { method: 'prepend' }).children().first()
}
TPLMgr.renderString = function (tpl, data) {
  $.extend(data, { translations: translations })
  return $.Mustache.render(tpl, data)
}
