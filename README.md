# WHMCS "ISPAPI" Domainchecker Add-on #

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Build Status](https://travis-ci.org/hexonet/whmcs-ispapi-domainchecker.svg?branch=master)](https://travis-ci.org/hexonet/whmcs-ispapi-domainchecker)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![PRs welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/CONTRIBUTING.md)

This Repository covers the "ISPAPI" Domainchecker Add-On for WHMCS. It provides the following features in WHMCS:

## Supported Features (>= v10.0.0) ##

The ISPAPI DomainChecker addon supports the following functions and features:

* **NEW** Supports several filters
* **NEW** Administrative Interface now allows managing of categories by drag'n'drop and provides access to all useful configurations
* **UPDATE** Search trigger over URL (helpful for landing pages, see [Usage Guide](https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Usage-Guide))
* High-performance Domain Availability Checks using our registrar API
* Support of Premium Domains (Aftermarket and Registry Premium Domains)
* Domain Name Suggestion Engine integrated
* Categorization of the TLDs for an improved user experience
  * **NEW** WHMCS' default categories can be imported
  * Search results based on the category selection
* Backorder button in the search results (when having also our [whmcs backorder module](https://github.com/hexonet/whmcs-ispapi-backorder) installed)
  * Add or Remove backorders instantly in the search results
* WHOIS information for taken domains
* Featuring each domain with availability and type of premium domain name
* Featuring prices of domains
  * Registration and renewal prices
  * Premium domains with markup prices
* Add or Remove domains to the cart instantly in the search results
* Supports multiple currencies
* Support for English and German. (If any other language is required, please contact
us)
* Ajax driven search (no page reload)
* Easy to install and use

... and MORE!

## Resources ##

* [Usage Guide](https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Usage-Guide)
* [Release Notes](https://github.com/hexonet/whmcs-ispapi-domainchecker/releases)
* [Development Guide](https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Development-Guide)

NOTE: We introduced sematic-release starting with v8.0.0. This is why older Release Versions do not appear in the [current changelog](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/HISTORY.md). But these versions appear in the [release overview](https://github.com/hexonet/whmcs-ispapi-domainchecker/releases) and in the [old changelog](https://github.com/hexonet/whmcs-ispapi-domainchecker/blob/master/HISTORY.old).

## Usage Guide ##

Download the ZIP archive including the latest release version [here](https://github.com/hexonet/whmcs-ispapi-domainchecker/raw/master/whmcs-ispapi-domainchecker-latest.zip).

Read the following to get more information ...

* [Getting started](https://github.com/hexonet/whmcs-ispapi-domainchecker/wiki/Usage-Guide#getting-started)

## Minimum Requirements ##

For the latest WHMCS minimum system requirements, please refer to
[https://docs.whmcs.com/System_Requirements](https://docs.whmcs.com/System_Requirements)

* WHMCS version 7.2.0 or higher (we recommend using the latest release)
* Free Signup for a HEXONET [Test Account](https://www.hexonet.net/signup-ote) or [Live Account](https://www.hexonet.net/sign-up)
* [ISPAPI Registrar Module](https://github.com/hexonet/whmcs-ispapi-registrar/raw/master/whmcs-ispapi-registrar-latest.zip) in the below version dependency

| Domainchecker version | ISPAPI Registrar Module version |
|-----------------------|---------------------------------|
| >= 10.0.0             | >= 1.8.1                        |
| >= 9.0.0 < 10.0.0     | >= 1.7.1                        |
| >= 8.3.0 < 9.0.0      | >= 1.0.53                       |

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
