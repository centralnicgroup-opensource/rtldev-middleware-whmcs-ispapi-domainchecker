# [11.0.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.6...v11.0.0) (2019-08-29)


### Bug Fixes

* **backend:** re-introduce jquery-ui ([5dca2b9](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/5dca2b9)), closes [#101](https://github.com/hexonet/whmcs-ispapi-domainchecker/issues/101)


### BREAKING CHANGES

* **backend:** WHMCS 7.8.x drops JQuery-UI in build process or in admin theme (was available in
WHMCS 7.7.x)

## [10.0.6](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.5...v10.0.6) (2019-08-23)


### Bug Fixes

* **whois information:** reviewed script ([e943fc9](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/e943fc9))

## [10.0.5](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.4...v10.0.5) (2019-08-22)


### Bug Fixes

* **availability:** add ' to exceptional parameters; return `DOMAIN NAME NOT VALID` as reason ([af039cb](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/af039cb))

## [10.0.4](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.3...v10.0.4) (2019-08-21)


### Bug Fixes

* **whois:** fix whois info service request url ([942bee2](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/942bee2))

## [10.0.3](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.2...v10.0.3) (2019-08-20)


### Bug Fixes

* **pkg:** fix request url of checkout button ([6e94d31](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/6e94d31))

## [10.0.2](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.1...v10.0.2) (2019-08-20)


### Bug Fixes

* **pkg:** fix calls to our backorder module if present ([d653dbc](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/d653dbc))
* **pkg:** fix paths of header includes to consider WEB_ROOT ([381d5c9](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/381d5c9))
* **pkg:** fix shopping cart url calls ([4174395](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/4174395))
* **pkg:** fix template paths and shopping cart paths ([2ce54ef](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/2ce54ef))

## [10.0.1](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v10.0.0...v10.0.1) (2019-08-19)


### Bug Fixes

* **domainsearch:** fix ownKeys configuration for Proxy ([6aef3f1](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/6aef3f1))

# [10.0.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.2.2...v10.0.0) (2019-08-14)


### Code Refactoring

* **pkg:** review from scratch ([9d69cb7](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/9d69cb7))


### BREAKING CHANGES

* **pkg:** Check Pull Request #63 for updates and changes. Closes #27.

## [9.2.2](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.2.1...v9.2.2) (2019-05-13)


### Bug Fixes

* **suggestion engine:** fix activation check ([ace2204](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/ace2204))

## [9.2.1](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.2.0...v9.2.1) (2019-05-10)


### Bug Fixes

* **load more:** fix logic to be able to step through/display all results ([32362ab](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/32362ab))

# [9.2.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.1.0...v9.2.0) (2019-05-10)


### Bug Fixes

* **DB:** set collation to utf8; review SQLCall usage for inserts; ([123cf71](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/123cf71))


### Features

* **IDN:** review support for IDN TLDs and IDN domain search ([5033a5b](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/5033a5b))

# [9.1.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.0.3...v9.1.0) (2019-05-08)


### Features

* **load more:** added load more button feature to the search results ([ac152a7](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/ac152a7))

## [9.0.3](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.0.2...v9.0.3) (2019-05-07)


### Performance Improvements

* **DomainCheck:** class code review ([7287444](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/7287444))

## [9.0.2](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.0.1...v9.0.2) (2019-05-07)


### Bug Fixes

* **CSS:** review category margin css ([aab34a7](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/aab34a7))

## [9.0.1](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v9.0.0...v9.0.1) (2019-05-03)


### Bug Fixes

* **pkg:** typo in function call ([cd0670f](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/cd0670f))

# [9.0.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.3.0...v9.0.0) (2019-05-03)


### Bug Fixes

* **test:** deactivated structure tests ([1567127](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/1567127))


### Code Refactoring

* **restructure:** by using our shared libraries ([3f41020](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/3f41020))


### BREAKING CHANGES

* **restructure:** Moved classes LoadRegistrars and Helper to shared folder. Depending now on ispapi
registrar module v1.7.1 or higher.

# [8.3.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.2.4...v8.3.0) (2019-04-29)


### Features

* **IDN:** review IDN domain check and whois ([2f7c8fc](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/2f7c8fc))

## [8.2.4](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.2.3...v8.2.4) (2019-03-14)


### Bug Fixes

* **init.php:** path detection ([5cfe663](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/5cfe663))

## [8.2.3](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.2.2...v8.2.3) (2019-03-11)


### Bug Fixes

* **init.php:** review path detection ([b59edde](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/b59edde))

## [8.2.2](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.2.1...v8.2.2) (2018-11-19)


### Bug Fixes

* **symlinks:** added support for integration of the module via symlinks ([b082b60](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/b082b60))

## [8.2.1](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.2.0...v8.2.1) (2018-11-05)


### Bug Fixes

* **semantic-release:** update new version in php file ([f3a4bd4](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/f3a4bd4))

# [8.2.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.1.0...v8.2.0) (2018-10-24)

# [8.1.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v8.0.0...v8.1.0) (2018-10-19)


### Features

* **releaseInfo:** add json file covering repository info ([2ab53b9](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/2ab53b9))

# [8.0.0](https://github.com/hexonet/whmcs-ispapi-domainchecker/compare/v7.3.3...v8.0.0) (2018-10-12)


### Bug Fixes

* **pkg:** migrated to github ([39874de](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/39874de))
* **script:** add x-bit ([7c6d072](https://github.com/hexonet/whmcs-ispapi-domainchecker/commit/7c6d072))


### BREAKING CHANGES

* **pkg:** we need to trigger a major release because of the new release process.
