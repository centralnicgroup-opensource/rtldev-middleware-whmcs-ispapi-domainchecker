module.exports = {
  env: {
    mocha: true,
    node: true,
    browser: true,
    jquery: true
  },
  globals: {
    ds: 'readonly',
    Muuri: 'readonly',
    Category: 'readonly',
    CategoryManager: 'readonly',
    DomainSearch: 'readonly',
    ispapiIdnconverter: 'readonly',
    updateAjaxModal: 'readonly',
    dialogClose: 'readonly',
    WHMCS: 'readonly',
    TPLMgr: 'readonly',
    SearchResult: 'readonly',
    translations: 'readonly',
    ShoppingCart: 'readonly',
    dcpath: 'readonly',
    cart: 'readonly',
    csrfToken: 'readonly',
    wr: 'readonly'
  },
  extends: ['standard', 'plugin:json/recommended'],
  plugins: [
    'markdown'
  ]
}
