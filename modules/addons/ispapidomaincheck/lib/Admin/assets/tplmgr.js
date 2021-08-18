const TPLMgr = {
  loadTemplates: function (tpls, type) {
    // only load templates that are not yet loaded
    tpls = tpls.filter((tpl) => {
      return !$.Mustache.has(tpl);
    });
    return new Promise((resolve) => {
      // --- https://github.com/jonnyreeves/jquery-Mustache#usage
      // --- https://github.com/janl/mustache.js
      const tplpath = `${wr}/modules/addons/ispapidomaincheck/lib/${type}/templates/`;
      const tplext = ".mustache";
      let count = tpls.length;
      if (!count) {
        resolve();
      } else {
        tpls.forEach((tpl) => {
          $.Mustache.load(`${tplpath}${tpl}${tplext}`).done((d) => {
            $.Mustache.add(tpl, d);
            count--;
            if (count === 0) {
              resolve();
            }
          });
        });
      }
    });
  },
  has: function (tpl) {
    return $.Mustache.has(tpl);
  },
  renderAppend: function (selector, tpl, data) {
    $.extend(data, { translations: translations });
    return $(selector).mustache(tpl, data).children().last();
  },
  renderBefore: function (selector, tpl, data) {
    $.extend(data, { translations: translations });
    return $(TPLMgr.renderString(tpl, data)).insertBefore(selector);
  },
  renderPrepend: function (selector, tpl, data) {
    $.extend(data, { translations: translations });
    return $(selector)
      .mustache(tpl, data, { method: "prepend" })
      .children()
      .first();
  },
  renderString: function (tpl, data) {
    $.extend(data, { translations: translations });
    return $.Mustache.render(tpl, data);
  },
};
