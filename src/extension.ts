// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import * as path from 'path';
import { workspace, ExtensionContext } from 'vscode';

import {
	LanguageClient,
	LanguageClientOptions,
	ServerOptions,
} from 'vscode-languageclient';

let client: LanguageClient;

export function activate(context: ExtensionContext) {
	console.log('Activating client...');
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		command: 'python',
		args: ['-m', 'stexls', 'lsp',],
		debug: {
			command: 'python',
			args: ['-m', 'stexls', 'lsp', '--loglevel', 'debug']
		}
	};

	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: [{ scheme: 'file', language: 'latex' }],
		synchronize: {
			// Notify the server about file changes to '.clientrc files contained in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/stexls.settings')
		}
	};

	// Create the language client and start the client.
	client = new LanguageClient(
		'stexls',
		'stexls',
		serverOptions,
		clientOptions
	);
	
	console.log('Starting client...');
	// Start the client. This will also launch the server
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