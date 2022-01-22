/// <reference types="node" />
export class Service {
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
    constructor({ cwd, args, timeout, delay }?: any);
    cwd: any;
    args: any;
    timeout: any;
    delay: any;
    child: import("child_process").ChildProcessByStdio<null, import("stream").Readable, import("stream").Readable>;
    stdout: string;
    stderr: string;
    error: any;
    status: string;
    exitCode: number;
    startTime: number;
    endTime: number;
    /**
     * Start console command
     *
     * @param {String} cwd console command path
     * @param {Array} args arguments
     */
    start(cwd?: string, args?: any[]): void;
    /**
     * Stop console command
     */
    stop(): void;
    /**
     * Get service status
     *
     * @return {String} status
     */
    get_status(): string;
    /**
     * Get command standard output
     *
     * @return {String} stdout
     */
    get_stdout(): string;
    /**
     * Get command standard error output
     *
     * @return {String} stderr
     */
    get_stderr(): string;
    /**
     * Get error
     *
     * @return {Error} error object
     */
    get_error(): Error;
    /**
     * Get command process id
     *
     * @return {Number} pid
     */
    get_pid(): number;
    /**
     * Get command executing duration
     *
     * @return {Number} miliseconds
     */
    get_duration(): number;
    /**
     * Waiting until condition met or timeout exceeded
     *
     * @param {Function} fn condition function
     * @param {Number} timeout timeout to wait
     * @param {Number} delay checking frequancy
     *
     * @return {Promise<Boolean>} true if condition is met
     */
    wait_condition(fn: Function, timeout?: number, delay?: number): Promise<boolean>;
}
export class Services extends Service {
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
    constructor(config: any);
    services: any[];
    /**
     * Update properties of base class. Copy values from the last try.
     */
    _update_properties(): void;
    /**
     * Stop all running commands
     */
    stop_all(): void;
    /**
     * Repeat command until condition met or timeout exceeded
     *
     * @param {Function} fn condition function
     * @param {Number} timeout timeout to wait
     * @param {Number} delay checking frequancy
     *
     * @return {Promise<Boolean>} true if condition is met
     */
    repeat(fn: Function, timeout?: number, delay?: number): Promise<boolean>;
}
