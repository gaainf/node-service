[![build](https://github.com/gaainf/node-service/actions/workflows/push.yml/badge.svg)](https://github.com/gaainf/node-service/actions/workflows/build.yml)
[![coverage](https://codecov.io/gh/gaainf/node-service/branch/master/graph/badge.svg)](https://codecov.io/gh/gaainf/node-service/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://github.com/gaainf/node-service/blob/master/LICENSE)

# node-service
Run console command as a service using `NodeJS`.
You can start/stop console commands, test STDOUT, STDERR, wait specific conditions, control detached process parameters.

## Prerequisites

This project requires `NodeJS` (version 10 or later) and `npm` or `yarn`.

## Table of contents
- [node-service](#node-service)
  - [Prerequisites](#prerequisites)
  - [Table of contents](#table-of-contents)
  - [Installation](#installation)
  - [Usage](#usage)
    - [Import](#Import)
    - [Service](#Service)
      - [Running console command as detached process](#Running-console-command-as-detached-process)
      - [Waiting for a command to complete in the background](#Waiting-for-a-command-to-complete-in-the-background)
      - [Stopping command](#Stopping-command)
      - [Getting stdout and stderr](#Getting-stdout-and-stderr)
      - [Parametrising input properties](#Parametrising-input-properties)
      - [Calculating duration](#Calculating-duration)
    - [Services](#Services)
      - [Run several commands and wait until all conditions met](#Run-several-commands-and-wait-until-all-conditions-met)
      - [Repeat specific command until condition met](#Repeat-specific-command-until-condition-met)
  - [Versioning](#Versioning)
  - [Authors](#Authors)
  - [License](#License)

## Installation

**Before you install:** please read the [prerequisites](#prerequisites)

Using `npm`:

```sh
$ npm install @gaainf/node-service
```

Using `yarn`:

```sh
$ yarn add @gaainf/node-service
```

## Usage

### Import
The package contains several classes:
1. *Service* is base class to control console command execution, help start it in a detached process.
2. *Services* is utility class to repeat console commands started in separate processes, help contol parameters of each of them.

Import Service
```js
const {Service} = require('@gaainf/node-service');
```
Import Services
```js
const {Services} = require('@gaainf/node-service');
```
Or import the both:
```js
const {Service, Services} = require('@gaainf/node-service');
```

### Service

#### Running console command as detached process

```js
const {Service} = require('@gaainf/node-service');

let service = new Service();
service.start('node', ['-v']);
console.log(service.get_pid()); // process ID
```

#### Waiting for a command to complete in the background

```js
const {Service} = require('@gaainf/node-service');

async () => {
    let service = new Service();
    service.start('PING', ['1.1.1.1', '-c', '3']);
    console.log(service.get_status());
    // timeout: 3 sec, delay: 1 sec
    await service.wait_condition(() => {
        return service.get_status() == 'finished'}, 3000, 1000);
    console.log(service.get_status()); // 'finished'
}();
```

#### Stopping command

```js
const {Service} = require('@gaainf/node-service');

let service = new Service();
service.start('echo', ['Hello!']);
service.stop();
console.log(service.get_status()); // 'stopped'
```

#### Getting stdout and stderr

```js
const {Service} = require('@gaainf/node-service');

(async () => {
    let service = new Service();
    service.start('node', ['-v']);
    await service.wait_condition(() => {return /v/.test(service.get_stdout())}, 1000);
    console.log(service.get_stdout()); // STDOUT
    service.start('node', ['-x']);
    await service.wait_condition(() => {return /bad option/.test(service.get_stderr())}, 1000);
    console.log(service.get_stderr()); // STDERR
})();
```

#### Parametrising input properties

Base input properties:
* `cwd` - command path
* `args` - command arguments
* `timeout` - default timeout to test custom output expression (default value is 10 seconds)
* `delay` - defualt delay between tries to test custom output expression (default value is 500 milliseconds)

```js
const {Service} = require('@gaainf/node-service');

(async () => {
    let service = new Service({
        cwd: 'node',
        args: ['-e', 'setTimeout(function(){console.log("Hi!")},1000);'],
        timeout: 2000
    });
    service.start();
    await service.wait_condition(() => {return service.get_status() == 'finished'});
    console.log(service.get_stdout());
})();
```

#### Calculating duration

```js
const {Service} = require('@gaainf/node-service');

(async () => {
    let service = new Service({cwd: 'node', args: ['-v']});
    service.start();
    await service.wait_condition(() => {return service.get_status() == 'finished'});
    console.log('Duration: ' + service.get_duration() / 1000 + ' sec');
})();
```

### Services

#### Run several commands and wait until all conditions met

It is possible to run several comands in parallel and wait until all conditions met
```js
const {Service, Services} = require('@gaainf/node-service');

(async () => {
    let services = new Services([
        {cwd: 'node', args: ['-v'], timeout: 10000},
        {cwd: 'node', args: ['--help'], timeout: 10000},
    ]);
    services.start_all();
    await services.wait_all_conditions([
        () => {return services.services[0].get_status() == 'finished'},
        () => {return services.services[1].get_status() == 'finished'}
    ]);
    for(let service of services.services) {
        console.log(service.get_stdout());
    }
    console.log("Duration time: " + services.get_duration());
})();
```

#### Repeat specific command until condition met

Following example runs HTTP server in separate process and repeats curl command until the server doesn't respond properly or timeout exceedded. At the end, it prints output data and calculates average duration.
```js
const {Service, Services} = require('@gaainf/node-service');

(async () => {
    // simple HTTP server prints Hi on each request
    let service = new Service({
        cwd: 'node',
        args: [
            '-e', `
            const http = require("http");
            const listener = (req, res) => {res.end('Hi!')};
            http.createServer(listener).listen(8888, '127.0.0.1', () => {});`
        ]
    });

    // Check output via curl
    let curl = new Services({cwd: 'curl', args: ['-m1', 'http://127.0.0.1:8888/'], delay: 1000});
    try {
        // run HTTP server
        service.start();
        // repeat curl command every second
        await curl.repeat(() => {return /Hi!/.test(curl.get_stdout())});
    } finally {
        // be sure to stop the server 
        service.stop();
    }
    // print the last try stdout
    console.log(curl.get_stdout());
    //print average duration
    console.log("Duration time: " + curl.get_duration());
})();
```

## Versioning

[SemVer](http://semver.org/) is used. For versions available, please, see [tags on this repository](https://github.com/gaainf/node-service/tags).

## Authors

* **Alex Grechin** - *Initial work* - [gaainf](https://github.com/gaainf)