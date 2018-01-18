# ssa-form

[![Coveralls Status][coveralls-image]][coveralls-url]
[![Build Status][travis-image]][travis-url]
[![Dependency Status][depstat-image]][depstat-url]
[![npm version][npm-image]][npm-url]
[![License][license-image]][license-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![david-dm][david-dm-image]][david-dm-url]

> Creates an flow graph in SSA form based on an initial CFG. It can also apply data flow functions and will generate a live out set for each block as default for pruned SSA.

WARNING: Work in progress, not ready to be used yet.

## Install

```sh
npm i ssa-form
```

## Usage

```js
const 
    ssa = require( 'ssa-form' );

ssa() // true
```

## License

MIT © [Julian Jensen](https://github.com/julianjensen/ssa-form)

[coveralls-url]: https://coveralls.io/github/julianjensen/ssa-form?branch=master
[coveralls-image]: https://coveralls.io/repos/github/julianjensen/ssa-form/badge.svg?branch=master

[travis-url]: https://travis-ci.org/julianjensen/ssa-form
[travis-image]: http://img.shields.io/travis/julianjensen/ssa-form.svg

[depstat-url]: https://gemnasium.com/github.com/julianjensen/ssa-form
[depstat-image]: https://gemnasium.com/badges/github.com/julianjensen/ssa-form.svg

[npm-url]: https://badge.fury.io/js/ssa-form
[npm-image]: https://badge.fury.io/js/ssa-form.svg

[license-url]: https://github.com/julianjensen/ssa-form/blob/master/LICENSE
[license-image]: https://img.shields.io/badge/license-MIT-brightgreen.svg

[snyk-url]: https://snyk.io/test/github/julianjensen/ssa-form
[snyk-image]: https://snyk.io/test/github/julianjensen/ssa-form/badge.svg

[david-dm-url]: https://david-dm.org/julianjensen/ssa-form
[david-dm-image]: https://david-dm.org/julianjensen/ssa-form.svg

