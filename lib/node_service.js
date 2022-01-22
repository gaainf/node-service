const spawn = require('child_process').spawn;
const sleep = require('util').promisify(setTimeout);

class Service {

    // the class constructor
    /**
     * constructor description
     * @param  {Object} config defalut input values
     * 
     * @example
     * ```js
     * let service = new Service();
     * ```
     * @example
     * ```js
     * let service = new Service({
     *   cwd: 'node',
     *   args: ['-v']
     * });
     * ```
     * @example
     * ```js
     * let service = new Service({
     *   cwd: 'pwd',
     *   timeout: 2000,
     *   delay: 1000
     * });
     * ```
     */
    constructor({
        cwd = '',
        args = [],
        timeout = 10000,
        delay = 500
    } = {}) {
        // define input properties
        this.cwd = cwd;
        this.args = args;
        this.timeout = timeout;
        this.delay = delay;
        // clean output properties
        this.child = undefined;
        this.stdout = '';
        this.stderr = '';
        this.error = undefined;
        this.status = 'not started';
        this.exitCode = -1;
        this.startTime = 0;
        this.endTime = 0;
    }

    /**
     * Start console command
     *
     * @param {String} cwd console command path
     * @param {Array} args arguments
     */
    start(cwd = this.cwd, args = this.args) {
        this.cwd = cwd;
        this.args = args;
        this.child = spawn(cwd, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env },
            detached: true
        });
        this.startTime = Date.now();
        this.child.unref();
        this.status = 'started';
        this.child.stdout.setEncoding('utf8');
        this.child.stdout.on('data', function (data) {
            this.stdout += data.toString();
        }.bind(this));
        this.child.stderr.setEncoding('utf8');
        this.child.stderr.on('data', function (data) {
            this.stderr += data.toString();
        }.bind(this));
        this.child.on('exit', function (exitCode) {
            this.endTime = Date.now();
            if (this.status == 'stopped' || this["child"]["killed"]) {
                this.status = 'stopped';
            } else {
                this.status = 'finished';
            }
            this.exitCode = exitCode;
        }.bind(this));
        this.child.on('error', (function (err) {
            this.endTime = Date.now();
            this.status = 'failed';
            this.exitCode = this["child"]["exitCode"];
            this.error = err;
        }).bind(this));
    }

    /**
     * Stop console command
     */
    stop() {
        try {
            process.kill(-this.child.pid, 'SIGTERM');
            process.kill(-this.child.pid, 'SIGKILL');
        } catch (err) {
            this.error = err;
        }
        this.status = 'stopped';
    }

    /**
     * Get service status
     *
     * @return {String} status
     */
    get_status() {
        return this.status;
    }

    /**
     * Get command standard output
     *
     * @return {String} stdout
     */
    get_stdout() {
        return this.stdout;
    }

    /**
     * Get command standard error output
     *
     * @return {String} stderr
     */
    get_stderr() {
        return this.stderr;
    }

    /**
     * Get error
     *
     * @return {Error} error object
     */
    get_error() {
        return this.error;
    }

    /**
     * Get command process id
     *
     * @return {Number} pid
     */
    get_pid() {
        return this.child.pid;
    }

    /**
     * Get command executing duration
     *
     * @return {Number} miliseconds
     */
    get_duration() {
        if (this.startTime != 0 && this.endTime == 0) {
            return Date.now() - this.startTime;
        }
        return this.endTime - this.startTime;
    }

    /**
     * Waiting until condition met or timeout exceeded
     *
     * @param {Function} fn condition function
     * @param {Number} timeout timeout to wait
     * @param {Number} delay checking frequancy
     * 
     * @return {Promise<Boolean>} true if condition is met
     */
    async wait_condition(fn, timeout = this.timeout, delay = this.delay) {
        let total_delay = 0;
        while (!fn() && total_delay < timeout && this.status == 'started') {
            await sleep(delay);
            total_delay = total_delay + delay;
        }
        return fn();
    }
}

class Services extends Service {

    // the class constructor
    /**
     * constructor description
     * @param  {Object} config defalut input values
     * 
     * @example
     * ```js
     * let services = new Services();
     * ```
     * @example
     * ```js
     * let services = new Services({
     *   cwd: 'node',
     *   args: ['-v']
     * });
     * ```
     * @example
     * ```js
     * let services = new Services({
     *   cwd: 'pwd',
     *   timeout: 2000,
     *   delay: 1000
     * });
     * ```
     */
    constructor(config) {
        super(config);
        this.services = [];
    }

    /**
     * Update properties of base class. Copy values from the last try.
     */
    _update_properties () {
        if (this.services.length !== 0) {
            Object.assign(this, this.services[this.services.length - 1]);
        }
    }

    /**
     * Stop all running commands
     */
    stop_all() {
        for (let element of this.services) {
            if (element.get_status() != 'finished') {
                element.stop();
            }
        }
        this._update_properties();
    }

    /**
     * Get total executing duration
     *
     * @return {Number} miliseconds
     */
     get_duration() {
        let minStartTime = Math.min(...this.services.map(o => o.startTime));
        let maxEndTime = Math.max(...this.services.map(o => o.endTime));
        return maxEndTime - minStartTime;
    }

    /**
     * Repeat command until condition met or timeout exceeded
     *
     * @param {Function} fn condition function
     * @param {Number} timeout timeout to wait
     * @param {Number} delay checking frequancy
     * 
     * @return {Promise<Boolean>} true if condition is met
     */
     async repeat(fn, timeout = this.timeout, delay = this.delay) {
        let total_delay = 0;
        try {
            do {
                if (this.services.length !== 0 && this.services[this.services.length - 1].status == 'started') {
                    this.services[this.services.length - 1].stop();
                }
                this.services.push(new Service(this));
                this._update_properties();
                this.services[this.services.length - 1].start();
                await sleep(delay);
                this._update_properties();
                total_delay = total_delay + delay;
            } while (!fn() && total_delay < timeout)
        } finally {
            this.stop_all();
        }
        return fn();
    }
}
Services.prototype.start = null;
Services.prototype.stop = null;

module.exports = {
    Service,
    Services
}