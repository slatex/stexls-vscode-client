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

export function activate(context: ExtensionContext) {
    console.log('Activating stexls client...');

    console.log('Checking stexls version:');
    
    console.log('>>> python -m stexls --version');

    let out = cp.execSync('python -m stexls --version');

    console.log(out.toString());

    // If the extension is launched in debug mode then the debug server options are used
    // Otherwise the run options are used
    let serverOptions: ServerOptions = {
        run: {
            command: "python",
            args: ['-m', 'stexls', 'lsp', '--loglevel', 'error'],
            transport: TransportKind.ipc,
        },
        debug: {
            command: 'python',
            args: ['-m', 'stexls', 'lsp', '--loglevel', 'debug'],
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