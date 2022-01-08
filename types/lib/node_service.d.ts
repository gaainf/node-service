/// <reference types="node" />
export = Service;
declare class Service {
    constructor({ cwd, args, timeout, delay }?: {
        cwd?: string;
        args?: any[];
        timeout?: number;
        delay?: number;
    });
    cwd: string;
    args: any[];
    timeout: number;
    delay: number;
    child: import("child_process").ChildProcessByStdio<null, import("stream").Readable, import("stream").Readable>;
    stdout: string;
    stderr: string;
    error: any;
    status: string;
    exitCode: number;
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
