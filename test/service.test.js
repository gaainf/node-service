const {Service, Services} = require('..');

afterAll(() => {
    console.log('done');
});

test('start service', () => {
    let service = new Service();
    service.start('node', ['-v']);
    expect(service.get_status()).toEqual('started');
});

test('stop service', async () => {
    let service = new Service();
    service.start('node', ['-v']);
    expect(service.get_status()).toEqual('started');
    service.stop();
    await service.wait_condition(() => {return service.get_status() == 'stopped'}, 3000);
    expect(service.get_status()).toEqual('stopped');
});

test('get pid', async () => {
    let service = new Service();
    service.start('node', ['-v']);
    expect(service.get_status()).toEqual('started');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_pid()).toBeGreaterThan(0);
});

test('wait service finished', async () => {
    let service = new Service();
    service.start('node', ['-v']);
    expect(service.get_status()).toEqual('started');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_status()).toEqual('finished');
});

test('get sdtout', async () => {
    let service = new Service();
    let cwd = 'pwd';
    let args = [];
    if (process.platform == 'win32') {
        cwd = 'cmd';
        args = ['/c', 'echo', '%cd%'];
    }
    service.start(cwd, args);
    expect(service.get_stdout()).toEqual('');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_stdout().trim()).not.toEqual('');
    console.log(service.get_stdout());
});

test('get sdterr', async () => {
    let service = new Service();
    service.start('node', ['-x']);
    expect(service.get_stderr()).toEqual('');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_stderr().trim()).not.toEqual('');
    console.log(service.get_stderr());
});

test('get error', async () => {
    let service = new Service();
    service.start('asdasd');
    expect(service.get_stderr()).toEqual('');
    await service.wait_condition(() => {return service.get_status() == 'failed'}, 3000);
    expect(service.get_status()).toEqual('failed');
    expect(service.get_error().code).toEqual('ENOENT');
    expect(service.get_stderr().trim()).toEqual('');
});

test('wait timeout', async () => {
    let service = new Service();
    service.start('node', ['-e', 'setTimeout(function(){console.log("hi")},1000);']);
    expect(service.get_stderr()).toEqual('');
    expect(await service.wait_condition(
        () => {return service.get_status() == 'finished'}, 5000
    )).toEqual(true);
    expect(service.get_status()).toEqual('finished');
    console.log(service.get_stdout());
});

test('constructor finished timings', async () => {
    let service = new Service({
        timeout: 300,
        delay: 100
    });
    service.start('node', ['-v']);
    expect(service.get_stderr()).toEqual('');
    expect(await service.wait_condition(
        () => {return service.get_status() == 'finished'}
    )).toEqual(true);
    expect(service.get_status()).toEqual('finished');
    expect(service.get_duration()).toBeLessThan(300);
});

test('constructor started timings', async () => {
    let service = new Service({
        timeout: 100,
        delay: 50
    });
    service.start('node', ['-e', 'setTimeout(function(){console.log("hi")},1000);']);
    expect(service.get_stderr()).toEqual('');
    expect(await service.wait_condition(
        () => {return service.get_status() == 'finished'}
    )).toEqual(false);
    expect(service.get_status()).toEqual('started');
    expect(service.get_duration()).toBeGreaterThan(0);
    expect(service.get_duration()).toBeLessThan(1000);
});

test('stop finished', async () => {
    let service = new Service();
    service.start('node', ['-v']);
    expect(service.get_stderr()).toEqual('');
    expect(await service.wait_condition(
        () => {return service.get_status() == 'finished'}, 5000
    )).toEqual(true);
    expect(service.get_status()).toEqual('finished');
    service.stop();
    expect(service.get_error().code).toEqual('ESRCH');
});

test('repeat', async () => {
    let service = new Service({
        cwd: 'node',
        args: [
            '-e', `
            const http = require("http");
            const listener = (req, res) => {res.end('Hi!')};
            http.createServer(listener).listen(8888, '127.0.0.1', () => {});`
        ],
        timeout: 5000
    });

    //let curl = new Services({cwd: 'curl', args: ['-m1', 'http://127.0.0.1:8888/']});
    let curl = new Services({
        cwd: 'node',
        args: [
            '-e', `
            const https = require('http')
            const options = {
                hostname: '127.0.0.1',
                port: 8888,
                path: '/',
                method: 'GET'
            }
            
            const req = https.request(options, res => {
                res.on('data', d => {
                    process.stdout.write(d);
                })
            })
            
            req.on('error', error => {
                console.error(error);
            })
            
            req.end()`
        ]});
    try {
        service.start();
        await curl.repeat(() => {return /Hi!/.test(curl.get_stdout())}, 4000, 1000);
    } finally {
        service.stop();
    }
    expect(curl.get_stdout()).toContain('Hi!');
});

test('stop repeat', async () => {
    let services = new Services({
        cwd: 'node',
        args: ['-e', 'setTimeout(function(){console.log("hi")},5000);']
    });
    await services.repeat(() => {return /hi/.test(services.get_stdout())}, 1000, 300);
    expect(services.get_status()).toEqual('stopped');
    expect(services.get_stdout()).toEqual('');
    for (let element of services.services){
        expect(element.get_status()).toEqual('stopped');
        expect(element.get_stdout()).toEqual('');
    }
    services.stop_all();
});


test('get total duration on repeat', async () => {
    let service = new Service({
        cwd: 'node',
        args: [
            '-e', `
            const http = require("http");
            const listener = (req, res) => {res.end('Hi!')};
            http.createServer(listener).listen(8889, '127.0.0.1', () => {});`
        ],
        timeout: 5000
    });

    //let curl = new Services({cwd: 'curl', args: ['-m1', 'http://127.0.0.1:8888/']});
    let curl = new Services({
        cwd: 'node',
        args: [
            '-e', `
            const https = require('http')
            const options = {
                hostname: '127.0.0.1',
                port: 8889,
                path: '/',
                method: 'GET'
            }
            
            const req = https.request(options, res => {
                res.on('data', d => {
                    process.stdout.write(d);
                })
            })
            
            req.on('error', error => {
                console.error(error);
            })
            
            req.end()`
        ],
        timeout: 4000,
        delay: 1000
    });
    try {
        service.start();
        await curl.repeat(() => {return /Hi!/.test(curl.get_stdout())});
    } finally {
        service.stop();
    }
    expect(curl.get_status()).toEqual('finished');
    expect(curl.get_duration()).toBeGreaterThan(0);
    expect(curl.get_duration()).toBeLessThan(4000);
});

test('start_all and wait_all_conditions', async () => {
    let services = new Services([
        {cwd: 'node', args: ['-v']},
        {cwd: 'node', args: ['-e', 'setTimeout(function(){console.log("hi")},1000);']}
    ]);
    services.start_all();
    await services.wait_all_conditions([
        () => {return services.services[0].get_status() == 'finished'},
        () => {return services.services[1].get_status() == 'finished'}
    ]);
    for(let service of services.services) {
        expect(service.get_status()).toEqual('finished');
    }
    expect(services.get_duration()).toBeGreaterThan(1000);
});

test('cant\'t run repeat if start_all was called', async () => {
    let services = new Services([
        {cwd: 'node', args: ['-v']},
        {cwd: 'node', args: ['--version']}
    ]);
    services.start_all();
    let result = await services.repeat(() => {return services.services[1].get_status() == 'finished'});
    await services.wait_all_conditions([
        () => {return services.services[0].get_status() == 'finished'},
        () => {return services.services[1].get_status() == 'finished'}
    ]);
    for(let service of services.services) {
        expect(service.get_status()).toEqual('finished');
    }
    expect(result).toEqual(false);
});

test('cant\'t run start_all if repeat was called', async () => {
    let services = new Services({cwd: 'node', args: ['-v'], delay: 50, timeout: 3000});
    await services.repeat(() => {return services.get_status() == 'finished'});
    services.start_all();
    expect(services.get_status()).toEqual('finished');
    expect(services.services.length).toBeGreaterThan(0);
});