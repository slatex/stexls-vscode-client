// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient';

let client: LanguageClient;

import * as cp from 'child_process';
import { settings } from 'cluster';

export function activate(context: ExtensionContext) {
    console.log('Activating stexls client...');
    
    const config = vscode.workspace.getConfiguration("stexls");

    const interpreter = config.get<string>("pythonInterpreter");

    if (!interpreter) {
        throw Error("Python interpreter not selected. Unable to start language server.");
    }

    console.log('Checking stexls version:');
    
    console.log(`>>> ${interpreter} -m stexls --version`);

    const out = cp.execSync(`${interpreter} -m stexls --version`);

    console.log(out.toString());

    if (!out) {
        throw Error(`Stexls version check returned falsy "${out}".`);
    }

    const args = config.get<string[]>("stexlsCommand");

    if (!args) {
        throw Error(`Unable to get stexls command arguments. Settings "stexlsCommand" returned falsy: ${args}`);
    }

    const debugArgs = [...args, "--loglevel", "debug"];

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: {
            command: interpreter,
            args: args,
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
    if (!client) {
        return undefined;
    }
    console.log('Stopping client.');
    return client.stop();
}