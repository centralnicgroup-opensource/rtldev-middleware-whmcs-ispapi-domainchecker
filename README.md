# WHMCS "ISPAPI" Domainchecker Add-on #

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hexonet/php-sdk/blob/master/CONTRIBUTING.md)
[![Slack Widget](https://camo.githubusercontent.com/984828c0b020357921853f59eaaa65aaee755542/68747470733a2f2f73332e65752d63656e7472616c2d312e616d617a6f6e6177732e636f6d2f6e6774756e612f6a6f696e2d75732d6f6e2d736c61636b2e706e67)](https://hexonet-sdk.slack.com/messages/CD9AVRQ6N)

This Repository covers the "ISPAPI" Domainchecker Add-on for WHMCS. It provides the following features in WHMCS:

## Supported Features ##

The ISPAPI DomainChecker addon supports the following functions and features:
* High-performance Domain Availability Checks using our registrar API
* Support of Premium Domains (Aftermarket and Registry Premium Domains)
* API Suggestion Engine integrated
* Categorization of the TLDs for an improved user experience
  * Default categories pre-configured
  * Search results based on the category selection
* Backorder button in the search results (when having also our [whmcs backorder module](https://github.com/hexonet/whmcs-ispapi-backorder) installed)
  * Add or Remove backorders instantly in the search results
  * WHOIS information for taken domains
* Featuring each domain with availability and type of premium domain name
* Featuring prices of domains
  * Registration and renewal prices
  * Premium domains with markup prices
* Adding of domains to the cart instantly possible in the search results
* Removing of domains from the cart instantly possible in the search results
* Supports multiple currencies
* Support for English and German. (If any other language is required, please contact
us)
* Ajax driven search (no page reload)
* Search trigger over the URL (helpful for landing pages)
  * For example: mydomainchecker.php?search=mydomain.com&cat=3, will trigger the search of “mydomain.com” in the category ID=3
* Easy to install and use

... and MORE!

## Resources ##

* [Usage Guide](blob/master/README.md#usage-guide)
* [Release Notes](releases)
* [Development Guide](wiki/Development-Guide)

NOTE: We introduced sematic-release starting with v8.0.0. This is why older Release Versions do not appear in the [current changelog](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/HISTORY.md). But these versions appear in the [release overview](https://github.com/hexonet/whmcs-ispapi-domainchecker/releases) and in the [old changelog](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/HISTORY.old).

## Usage Guide ##

Download the ZIP archive including the latest release version [here](https://github.com/hexonet/whmcs-ispapi-domainchecker/raw/master/whmcs-ispapi-domainchecker-latest.zip).

For a new installation: Unzip the downloaded Archive and upload the content of the "install" folder to your WHMCS root directory.
For an update: Unzip the downloaded Archive and upload the content of the "install" folder to your WHMCS root directory. Then go to "Setup > Addon Modules > ISPAPI HP DomainChecker > Configure" and click on the "Save Changes" button.

NOTE: The WHMCS root directory is the folder that contains the "configuration.php" file.

Login to the WHMCS Admin Area and navigate to `Setup > Addon Modules` to activate.

## Minimum Requirements ##

For the latest WHMCS minimum system requirements, please refer to
[https://docs.whmcs.com/System_Requirements](https://docs.whmcs.com/System_Requirements)

* WHMCS version 7.0 or higher (we recommend using the latest release)
* [ISPAPI Registrar Module](https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip) version 1.0.53 or higher
* Free Signup for a HEXONET [Test Account](https://www.hexonet.net/signup-ote) or [Live Account](https://www.hexonet.net/sign-up)

## Contributing ##

Please read [our development guide](https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Development-Guide) for details on our code of conduct, and the process for submitting pull requests to us.

## Authors ##

* **Anthony Schneider** - *development* - [AnthonySchn](https://github.com/anthonyschn)
* **Kai Schwarz** - *development* - [PapaKai](https://github.com/papakai)
* **Tulasi Seelamkurthi** - *development* - [Tulsi91](https://github.com/tulsi91)

See also the list of [contributors](https://github.com/hexonet/whmcs-ispapi-domainchecker/graphs/contributors) who participated in this project.

## License ##

This project is licensed under the MIT License - see the [LICENSE](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/LICENSE) file for details.

[HEXONET GmbH](https://hexonet.net)
