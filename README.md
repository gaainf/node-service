[![build](https://github.com/gaainf/node-service/actions/workflows/build.yml/badge.svg)](https://github.com/gaainf/node-service/actions/workflows/build.yml)
[![coverage](https://codecov.io/gh/gaainf/node-service/branch/master/graph/badge.svg)](https://codecov.io/gh/gaainf/node-service/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/gaainf/node-service/blob/master/LICENSE)

# node-service
Run console command as a service using NodeJS

## Prerequisites

This project requires NodeJS (version 10 or later) and NPM or YARN.

## Table of contents
- [node-service](#node-service)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Importing the module](#importing-the-module)
    - [Waiting til the command is finished](#waiting-til-command-is-finished)
    - [Stopping the command](#stopping-the-command)
    - [Reading stdout and stderr](#getting-stdout-and-stderr)
  - [Versioning](#versioning)
  - [Authors](#authors)
  - [License](#license)

## Installation

**BEFORE YOU INSTALL:** please read the [prerequisites](#prerequisites)

To install and set up the library, run:

```sh
$ npm install node-service
```

Or if you prefer using Yarn:

```sh
$ yarn add node-service
```

## Usage

### Importing the module

```js
const Service = require('node-service');
```

### Running console command as detached process

```js
const Service = require('node-service');

let service = new Service();
service.start('PING', ['1.1.1.1', '-c', '3']);
console.log(service.get_pid());
```

### Waiting til the command is finished

```js
const Service = require('node-service');

async () => {
    let service = new Service();
    service.start('PING', ['1.1.1.1', '-c', '3']);
    console.log(service.get_status());
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    console.log(service.get_status());
}();
```

### Stopping the command

```js
const Service = require('node-service');

let service = new Service();
service.start('PING', ['1.1.1.1', '-c', '3']);
service.stop();
```

### Getting stdout and stderr

```js
const Service = require('node-service');

(async () => {
    let service = new Service();
    service.start('PING', ['1.1.1.1', '-c', '3']);
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    console.log(service.get_stdout());
    console.log(service.get_stderr());
})();
```
## Versioning

[SemVer](http://semver.org/) is used. For the versions available, see the [tags on this repository](https://github.com/your/project/tags).

## Authors

* **Alex Grechin** - *Initial work* - [gaainf](https://github.com/gaainf)