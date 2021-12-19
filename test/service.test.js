const Service = require('..')


test('start service', () => {
    let service = new Service();
    service.start('cd', ['.']);
    expect(service.get_status()).toEqual('started');
});

test('stop service', async () => {
    let service = new Service();
    service.start('cd', ['.']);
    expect(service.get_status()).toEqual('started');
    service.stop();
    await service.wait_condition(() => {return service.get_status() == 'stopped'}, 3000);
    expect(service.get_status()).toEqual('stopped');
});

test('get pid', async () => {
    let service = new Service();
    service.start('cd', ['.']);
    expect(service.get_status()).toEqual('started');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_pid()).toBeGreaterThan(0);
});

test('wait service finished', async () => {
    let service = new Service();
    service.start('cd', ['.']);
    expect(service.get_status()).toEqual('started');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(service.get_status()).toEqual('finished');
});

test('get sdtout', async () => {
    let service = new Service();
    service.start('pwd');
    expect(service.get_stdout()).toEqual('');
    await service.wait_condition(() => {return service.get_status() == 'finished'}, 3000);
    expect(__dirname).toContain(service.get_stdout().trim());
    console.log(service.get_stdout());
});

test('get sdterr', async () => {
    let service = new Service();
    service.start('cd', ['asdasd']);
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
});