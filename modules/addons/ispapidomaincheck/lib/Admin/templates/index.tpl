<div id="tabs" style="display:none">
  <ul>
    <li><a href="#tabs-1">Settings</a></li>
    <li><a href="#tabs-2">Categories</a></li>
  </ul>
  <div id="tabs-1">
    <div id="cfgaccordion" class="accordion">
      <h3>By-default active Categories</h3>
      <div>
        <p>Click on the category boxes to select or deselect categories to fit your needs. The active ones (highlighted in orange) will be activated by default when your clients initially visit the domain search form.</p>
        <p>If you have the use for it, here a pre-configured search url. Find further available parameters documented in the <a class="hx" href="https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Usage-Guide" target="_blank">Usage Guide</a>.<br/><small>Your production link: <a id="genurl" href="" target="_blank" class="hx"></a><br/>Your direct script link: <a id="genurl2" href="" target="_blank" class="hx"></a></small></p>
        <div id="categories" class="row1 row collapse-category">
          <div class="col col-12 col-xs-12 category-setting">
            <button class="category-button collapsed" type="button" data-toggle="collapse" data-target="#category" aria-expanded="false">
              <span>CATEGORIES</span><br/><i class="category fa fa-angle-up"></i>
            </button>
          </div>
          <div class="col col-12 col-xs-12">
            <div class="catcontainer"></div>
          </div>
        </div>
        <button type="button" id="savedefaultcats" class="btn btn-default">Save Changes</button>
      </div>
      <h3>Taken Domains</h3>
      <div>
        <p>Show taken Domains in Domain Search results. This is useful if you use our <a href="https://github.com/hexonet/whmcs-ispapi-backorder" class="btn-link hx" target="_blank">Domain Backorder Module.</a></p>
        <div class="row">
          <div class="col col-md-2 text-center">
            <input id="toggle-takendomains" type="checkbox"/>
          </div>
        </div>
      </div>
      <h3>Premium Domains</h3>
      <div>
        <p>Show Premium Domains in Domain Search results. This covers Aftermarket Premium Domains as well as Registry Premium Domains.</p>
        <div class="row">
          <div class="col col-md-2 text-center">
            <input id="toggle-premiumdomains" type="checkbox"/>
          </div>
          <div class="col col-md-2 text-center">
              <a id="linkConfigurePremiumMarkup" href="configdomains.php?action=premium-levels" class="btn btn-default btn-sm btn-block open-modal" data-modal-title="Configure Premium Domain Levels" data-btn-submit-id="btnSavePremium" data-btn-submit-label="Save">Configure</a>
          </div>
        </div>
      </div>
      <h3>Lookup Provider</h3>
      <div>
        <div class="row">
          <div class="col col-md-4">
            <p>Domain Suggestions are turned <b><span id="cfgsuggestionstatus"></span></b>.</p>
            <p>Domain Lookup Registrar <span id="cfglookupregistrar" style="font-size:75%;font-weight:700;"></span> HEXONET/<small>ISPAPI</small>. <br/>This is necessary to have this module correctly running.</p>
          </div>
          <div class="col col-md-2">
            <p><a id="configureLookupProvider" class="btn btn-sm btn-default btn-block open-modal" href="configdomainlookup.php?action=configure" data-modal-title="Configure Lookup Provider" data-btn-submit-id="btnSaveLookupConfiguration" data-btn-submit-label="Save" onclick="return false;" data-modal-size="modal-lg">Configure</a></p>
            <p><a id="changeLookupProvider" class="btn btn-sm btn-default btn-block open-modal" href="configdomains.php?action=lookup-provider" data-modal-title="Choose Lookup Provider" onclick="return false;" data-modal-size="modal-lg">Change</a></p>
          </div>
        </div>
      </div>
      <h3>Additional Settings</h3>
      <div>
        <p>Show Transfer Button in Search Results. Transfer Request Form will be opened in a new Tab.</p>
        <div class="row">
          <div class="col col-md-2 text-center">
            <input id="toggle-domaintransfers" type="checkbox"/>
          </div>
        </div>
      </div>
    </div>    
  </div>
  <div id="tabs-2">
    <button class="btn btn-default" id="importdefaultcategories"><i class="fa fa-download"></i> Import Default Categories</button>
    <button class="btn btn-default" id="addcategory"><i class="fa fa-plus"></i> Add Category</button>
    <button class="btn btn-default" id="addtld"><i class="fa fa-plus"></i> Add TLD to Category</button>
    <br/><br/>
    <div id="maingrid" class="grid"></div>
  </div>
</div>

<div id="dialog-confirm"><p id="contentholder"></p></div>