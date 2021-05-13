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
    const stexlsInstallOptions = config.get<string[]>("stexlsInstallOptions");
    const logfile = config.get<string>('logfile', '/tmp/stexls.log');
    const loglevel = config.get<string>('loglevel', 'error');

    channel = vscode.window.createOutputChannel('stexls');
    context.subscriptions.push(channel);
    channel.show(true);

    if (!interpreter) {
        vscode.window.showErrorMessage("You have not selected a python interpreter for Stexls. Open your settings UI and search for 'stexls>pythonInterpreter'.")
        throw Error("Python interpreter not selected. Unable to start language server.");
    }

    const versionCmd = `${interpreter} -m stexls --version`;
    channel.appendLine(`> ${versionCmd}`);
    let out: string = "";
    try {
        const out = cp.execSync(versionCmd);
    } catch {
        vscode.window.showErrorMessage(
            "Stexls does not seem to be installed with your interpreter. Do you want to automatically install it?",
            "No",
            "Yes"
        ).then(
            value => {
                console.log(`Install stexls selection was: ${value}`)
                if (value == "Yes" && stexlsInstallOptions !== undefined) {
                    const installArgs = [interpreter, ...stexlsInstallOptions];
                    const installCmd = installArgs.join(' ');
                    console.log(`stexls install cmd: ${installCmd}`);
                    channel.appendLine(`> ${installCmd}`);
                    channel.show();
                    cp.exec(installCmd).on("exit", (code, signal) => {
                        vscode.window.showInformationMessage('If the stexls installation was successfull (view output channel "stexls"), you can restart the application and it should work.');
                        channel.appendLine(`> ${versionCmd}`)
                        const version = cp.execSync(versionCmd);
                        channel.appendLine(version.toString());
                        if (!version) {
                            vscode.window.showInformationMessage('Failed to install stexls.')
                        }
                    });
                }
            }
        )
        return
    }
    channel.appendLine(out.toString());
    if (!out) {
        throw Error(`Stexls version check returned falsy "${out}".`);
    }
    const [major, minor, revision] = out.toString().split('.');
    const minMinorVersion = 4;
    const expectedMajorVersion = 5;

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
    const sharedArgs = [
        ...args,
        '--logfile',
        logfile
    ];
    const runArgs = [...sharedArgs, "--loglevel", loglevel];
    const debugArgs = [...sharedArgs, "--loglevel", "debug"];

    channel.appendLine(['>', interpreter, ...runArgs].join(' '));

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

    const compileWorkspaceOnStartupFileLimit = config.get<number>("compileWorkspaceOnStartupFileLimit");
    const enableTrefier = config.get<string>("enableTrefier");
    const enabelLintingOfRelatedFiles = config.get<boolean>("enabelLintingOfRelatedFiles");
    const numJobs = config.get<number>('numJobs', 1);
    const delay = config.get<string>('delay', '5.0');

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'latex' }],
        outputChannel: channel,
        traceOutputChannel: channel,
        initializationOptions: {
            "compileWorkspaceOnStartupFileLimit": compileWorkspaceOnStartupFileLimit,
            "enableTrefier": enableTrefier,
            "enableLintingOfRelatedFiles": enabelLintingOfRelatedFiles,
            "numJobs": numJobs,
            "delay": delay,
        }
    };

    // Create the language client and start the client.
    client = new LanguageClient(
        'stexls',
        serverOptions,
        clientOptions,
    );

    console.log('Starting client...');
    const client_disposable = client.start();
    context.subscriptions.push(client_disposable)
    console.log('Client started.');
}
