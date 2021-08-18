const Category = function (name, id, tlds, isActive) {
  this.tlds = tlds;
  this.id = id;
  this.name = name;
  this.active = isActive;
  this.className = isActive ? "subCat active" : "subCat";
  this.element = null; // will be set by categorymgr in generate method
};
Category.prototype.toString = function () {
  return TPLMgr.renderString("category", { category: this });
};
