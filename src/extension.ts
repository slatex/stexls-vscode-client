// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient';

let client: LanguageClient;
let channel: vscode.OutputChannel;

import * as cp from 'child_process';
import { extname } from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Activating stexls client...');

    const config = vscode.workspace.getConfiguration("stexls");

    const interpreter = config.get<string>("pythonInterpreter");

    channel = vscode.window.createOutputChannel('stexls');
    channel.show(true);

    if (!interpreter) {
        throw Error("Python interpreter not selected. Unable to start language server.");
    }

    const versionCmd = `${interpreter} -m stexls --version`;
    channel.appendLine(versionCmd);
    const out = cp.execSync(versionCmd);
    channel.appendLine(out.toString());

    if (!out) {
        throw Error(`Stexls version check returned falsy "${out}".`);
    }

    const [major, minor, revision] = out.toString().split('.');
    const minMinorVersion = 3;
    const expectedMajorVersion = 4;

    if (parseInt(major) !== expectedMajorVersion) {
        throw Error(`Server major version condition not met: Is ${major}, expected ${expectedMajorVersion}`);
    }

    if (parseInt(minor) < minMinorVersion) {
        throw Error(`Server minor version condition not met: Is ${minor}, client requries minor>=${minMinorVersion}`);
    }

    const args = config.get<string[]>("command");

    if (!args) {
        throw Error(`Unable to get stexls command arguments. Settings "stexlsCommand" returned falsy: ${args}`);
    }

    const numJobs = ['--num_jobs', config.get<string>('numJobs', '1')];
    const delay = ['--update_delay_seconds', config.get<string>('delay', '1.0')];
    const logfile = ['--logfile', config.get<string>('logfile', '/tmp/stexls.log')];
    const loglevel = ['--loglevel', config.get<string>('loglevel', 'error')];
    let compileWorkspace: string[] = [];
    if (config.get<boolean>('compileWorkspace')) {
        compileWorkspace = ['--enable_global_validation'];
    }
    let lintOnStartup: string[] = [];
    if (config.get<boolean>('lintWorkspaceOnStartup', false)) {
        lintOnStartup = ['--lint_workspace_on_startup'];
    }
    let enableTrefier: string[] = [];
    if (config.get<boolean>('enableTrefier', false)) {
        enableTrefier = ['--enable_trefier'];
    }
    const sharedArgs = [...args, ...numJobs, ...delay, ...logfile, ...compileWorkspace, ...lintOnStartup, ...enableTrefier];
    const runArgs = [...sharedArgs, ...loglevel];
    const debugArgs = [...sharedArgs, "--loglevel", "debug"];

    channel.appendLine(['>>>', interpreter, ...runArgs].join(' '));

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: {
            command: interpreter,
            args: runArgs,
            transport: TransportKind.ipc,
        },
        debug: {
            command: interpreter,
            args: debugArgs,
            transport: TransportKind.ipc,
        }
    };

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'latex' }],
        outputChannel: channel,
        traceOutputChannel: channel
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'stexls',
        'stexls',
        serverOptions,
        clientOptions
    );

    console.log('Starting client...');
    client.start();
    console.log('Client started.');
}

export function deactivate(): Thenable<void> | undefined {
    if (channel) {
        channel.dispose();
    }
    if (!client) {
        return undefined;
    }
    console.log('Stopping client.');
    return client.stop();
}