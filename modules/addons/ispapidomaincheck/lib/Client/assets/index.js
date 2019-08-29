// eslint-disable-next-line no-unused-vars
const dcpath = '/modules/addons/ispapidomaincheck/'
// eslint-disable-next-line no-unused-vars
let translations
let ds
let cart

(async function () {
  translations = await $.ajax({
    url: '?action=loadtranslations',
    type: 'GET'
  })
  cart = new ShoppingCart()
  await cart.load()
  ds = new DomainSearch()
  ds.loadConfiguration()
}())
