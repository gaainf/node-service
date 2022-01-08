const spawn = require('child_process').spawn;
const sleep = require('util').promisify(setTimeout);

class Service {
    constructor() {
        this.cwd = '';
        this.args = [];
        this.child = undefined;
        this.stdout = '';
        this.stderr = '';
        this.error = undefined;
        this.status = 'not started';
        this.exitCode = -1;
        this.defaultTimeout = 10000;
        this.delay = 500;
    }

    /**
     * Start console command
     *
     * @param {String} cwd console command path
     * @param {Array} args arguments
     */
    start(cwd, args = []) {
        this.cwd = cwd;
        this.args = args;
        this.child = spawn(cwd, args, {
            stdio: ['ignore', 'pipe', 'pipe'],
            env: { ...process.env },
            detached: true
        });
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
            if (this.status == 'stopped' || this["child"]["killed"]) {
                this.status = 'stopped';
            } else {
                this.status = 'finished';
            }
            this.exitCode = exitCode;
        }.bind(this));
        this.child.on('error', (function (err) {
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
     * Waiting until condition met or timeout exceeded
     *
     * @param {Function} fn condition function
     * @param {Number} timeout timeout to wait
     * @param {Number} delay checking frequancy
     * 
     * @return {Promise<Boolean>} true if condition is met
     */
    async wait_condition(fn, timeout = this.defaultTimeout, delay = this.delay) {
        let total_delay = 0;
        while (!fn() && total_delay < timeout && this.status == 'started') {
            await sleep(delay);
            total_delay = total_delay + delay;
        }
        return fn();
    }
}

module.exports = Service