ISPAPI_DC_MODULE_VERSION := $(shell php -r 'include "modules/addons/ispapidomaincheck/ispapidomaincheck.php"; print $$module_version;')
FOLDER := pkg/whmcs-ispapi-domainchecker-$(ISPAPI_DC_MODULE_VERSION)

clean:
	rm -rf $(FOLDER)

buildsources:
	mkdir -p $(FOLDER)/install/modules/addons
	cp -a modules/addons/ispapidomaincheck $(FOLDER)/install/modules/addons
	cp mydomainchecker.php mywhois.php $(FOLDER)/install/
	cp HISTORY.md HISTORY.old README.md README.pdf CONTRIBUTING.md LICENSE $(FOLDER)
	find $(FOLDER)/install -name "*~" | xargs rm -f
	find $(FOLDER)/install -name "*.bak" | xargs rm -f

buildlatestzip:
	cp pkg/whmcs-ispapi-domainchecker.zip ./whmcs-ispapi-domainchecker-latest.zip # for downloadable "latest" zip by url

zip:
	rm -rf pkg/whmcs-ispapi-domainchecker.zip
	@$(MAKE) buildsources
	cd pkg && zip -r whmcs-ispapi-domainchecker.zip whmcs-ispapi-domainchecker-$(ISPAPI_DC_MODULE_VERSION)
	@$(MAKE) clean

tar:
	rm -rf pkg/whmcs-ispapi-domainchecker.tar.gz
	@$(MAKE) buildsources
	cd pkg && tar -zcvf whmcs-ispapi-domainchecker.tar.gz whmcs-ispapi-domainchecker-$(ISPAPI_DC_MODULE_VERSION)
	@$(MAKE) clean

allarchives:
	rm -rf pkg/whmcs-ispapi-domainchecker.zip pkg/whmcs-ispapi-domainchecker.tar
	@$(MAKE) buildsources
	cd pkg && zip -r whmcs-ispapi-domainchecker.zip whmcs-ispapi-domainchecker-$(ISPAPI_DC_MODULE_VERSION) && tar -zcvf whmcs-ispapi-domainchecker.tar.gz whmcs-ispapi-domainchecker-$(ISPAPI_DC_MODULE_VERSION)
	@$(MAKE) buildlatestzip
	@$(MAKE) clean
