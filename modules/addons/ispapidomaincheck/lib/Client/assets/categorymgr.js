const CategoryManager = function () {};
CategoryManager.prototype.setCategories = function (
  categories,
  activeCategories
) {
  $('#categoriescont').empty();
  this.categoriesMap = {}; // access by id, faster
  this.categories = [];
  this.activeCategories = activeCategories;
  const all = {
    id: -1,
    name: 'All',
    tlds: [],
    active: true
  };
  categories
    .sort(function (a, b) {
      const namea = a.name.toUpperCase();
      const nameb = b.name.toUpperCase();
      return namea < nameb ? -1 : namea > nameb ? 1 : 0;
    })
    .forEach((d) => {
      const cat = new Category(
        d.name,
        d.id,
        d.tlds,
        activeCategories.indexOf(d.id) !== -1
      );
      this.categoriesMap[d.id] = cat;
      this.categories.push(cat);
      all.tlds = all.tlds.concat(d.tlds);
      all.active = all.active && cat.active;
    });
  all.tlds = all.tlds.filter(function (item, pos, self) {
    return self.indexOf(item) === pos;
  });
  const cat = new Category(all.name, all.id, all.tlds, all.active);
  this.categoriesMap[all.id] = cat;
  this.categories.unshift(cat);
  return this;
};
CategoryManager.prototype.handleClicks = function () {
  $('.subCat')
    .off('click')
    .click(
      function (e) {
        const cat = this.getCategoryByDomId($(e.target).attr('id'));
        if (!cat) {
          return;
        }
        cat.element.toggleClass('active');
        cat.active = cat.element.hasClass('active');
        // NOTE: we need to create a new array so that proxy.set handler reacts as necessary
        // ALL === -1 -> put all cats to active or remove them all
        if (cat.id === -1) {
          if (cat.active) {
            const activecats = [];
            this.categories.forEach((cat) => {
              cat.active = true;
              cat.element.addClass('active');
              activecats.push(cat.id);
            });
            ds.searchStore.activeCategories = activecats;
          } else {
            this.categories.forEach((cat) => {
              cat.active = false;
              cat.element.removeClass('active');
            });
            ds.searchStore.activeCategories = [];
          }
        } else {
          if (cat.active) {
            const activecats = ds.searchStore.activeCategories.concat(cat.id);
            let allactive = true;
            this.categories.forEach((c) => {
              if (c.id !== -1) {
                allactive = allactive && c.active;
              }
            });
            if (allactive) {
              this.categoriesMap[-1].active = true;
              this.categoriesMap[-1].element.addClass('active');
              activecats.push(-1);
            }
            ds.searchStore.activeCategories = activecats;
          } else {
            this.categoriesMap[-1].active = false;
            this.categoriesMap[-1].element.removeClass('active');
            ds.searchStore.activeCategories =
              ds.searchStore.activeCategories.filter((catid) => {
                return catid !== cat.id && catid !== -1;
              });
          }
        }
      }.bind(this)
    );
  // handle the click on the category-button
  $('.category-button')
    .off('click')
    .click(function () {
      $(this).find('i.category').toggleClass('fa-angle-up fa-angle-down');
    });
  return this;
};
CategoryManager.prototype.getCategoryIdByDomId = function (domid) {
  return parseInt(domid.substring(2), 10);
};
CategoryManager.prototype.getCategoryByDomId = function (domid) {
  const id = this.getCategoryIdByDomId(domid);
  return this.categoriesMap[id];
};
CategoryManager.prototype.generate = async function () {
  if (!this.categories.length) {
    return $.growl.error({
      title: `${translations.error_occured}!`,
      message: translations.error_noprices
    });
  }
  await TPLMgr.loadTemplates(['category'], 'Client');
  const $eL = $('#categoriescont');
  $eL.empty();
  this.categories.forEach((category) => {
    category.element = $(category + '').appendTo($eL);
  });
  $('#categories').show();
  $('#searchbutton').prop('disabled', false);
  this.handleClicks();
  return this;
};
CategoryManager.prototype.getTLDsByCategory = function (categoryid) {
  const cat = this.categoriesMap[categoryid];
  if (cat) {
    return cat.tlds;
  }
  return [];
};
CategoryManager.prototype.getSelectedTLDs = function () {
  if (this.categoriesMap[-1].active) {
    return this.categoriesMap[-1].tlds;
  }
  let tlds = [];
  this.categories
    .filter((category) => {
      return category.active;
    })
    .forEach((category) => {
      tlds = tlds.concat(
        category.tlds.filter((item) => {
          return tlds.indexOf(item) < 0; // no duplicates
        })
      );
    });
  return tlds;
};
CategoryManager.prototype.getSelectedZones = function (suggestionsnoweighted) {
  return this.getSelectedTLDs()
    .filter((tld) => {
      // filter out high weighted TLDs like .com, .net
      if (suggestionsnoweighted && /^(COM|NET)$/i.test(tld)) {
        return false;
      }
      // filter out 3rd level extensions as not supported by QueryDomainSuggestionList
      return /^[^.]+$/.test(tld);
    })
    .map((tld) => {
      return tld.toUpperCase();
    });
};
CategoryManager.prototype.buildDomainlist = function (searchLabel) {
  const domainlist = [];
  if (searchLabel.length) {
    this.getSelectedTLDs().forEach((tld) => {
      const entry = `${searchLabel}.${tld}`;
      domainlist.push(entry);
    });
  }
  return domainlist;
};
