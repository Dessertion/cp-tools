import * as sub from 'child_process';
import * as fs from 'fs';
import { optionManager } from '../extension';
import { isUndefined } from 'util';

// -----------------------------------------------------------------------------------------------------------------------------
// Result Interfaces
// -----------------------------------------------------------------------------------------------------------------------------

export interface Executor {
    srcFile: string; // Source file
    execFile?: string | undefined; // Executable file.  Null if not compiled yet
    compileError?: string | undefined; // The result if there was a compile error.  Otherwise undefined
    preExec: () => void; // Compilation - Returns file name of executable created (to be run)
    exec: () => sub.ChildProcess; // Execution - Runs the file with the input, and returns the SpawnSyncBuffer returned
    postExec: () => void; // Post execution - Any 
}
// Note: If `execFile` is never defined, `compileError` should never be either as a defined `compilerError` and undefined `execFile` causes the program to think that the compile failed

function splitArgs(args: string): string[] {
    if (args === '') {
        return [];
    }
    return args.split(' ');
}

// -----------------------------------------------------------------------------------------------------------------------------
// Executors
// -----------------------------------------------------------------------------------------------------------------------------
class CPPExecutor implements Executor {
    srcFile: string;
    execFile: string | undefined;
    compileError: string | undefined;

    constructor(srcFile: string) {
        this.srcFile = srcFile;
        this.execFile = undefined;
    }

    preExec(): void {
        this.execFile = this.srcFile.substring(0, this.srcFile.length - 3) + 'exe';

        const compileProc = sub.spawnSync('g++', ['-o', this.execFile, this.srcFile].concat(splitArgs(optionManager().get('compilerArgs', 'cpp')))),
            compileProcStderr = compileProc.stderr.toString();
        
        if (compileProcStderr !== '') {
            this.execFile = undefined;
            this.compileError = compileProcStderr;
        }
    }

    exec(): sub.ChildProcess {
        if (isUndefined(this.execFile)) {
            throw new Error('File not compiled yet! (Or compile failed and you still tried to execute this)');
        }
        return sub.spawn(this.execFile);
    }

    postExec(): void {
        if (isUndefined(this.execFile)) {
            throw new Error('File not compiled yet!');
        }
        fs.unlinkSync(this.execFile);
    }
}

class PYExecutor implements Executor {
    srcFile: string;

    constructor(srcFile: string) {
        this.srcFile = srcFile;
    }

    preExec(): void {}

    exec(): sub.ChildProcess {
        return sub.spawn('py', [this.srcFile], {});
    }

    postExec(): void {}
}

export const executors: Map<string, new (srcFile: string) => Executor> = new Map([
    ['cpp', CPPExecutor],
    ['py', PYExecutor]
]);