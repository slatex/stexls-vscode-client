// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    TransportKind,
} from 'vscode-languageclient';

import * as cp from 'child_process';

/**
 * Get the version of the installed stexls package.
 * @param interpreter Interpreter to use.
 * @param channel Output channel.
 * @returns The version of the installed stexls package or undefined if an error happened.
 */
function checkStexlsVersion(interpreter: string, channel: vscode.OutputChannel) {
    const versionCmd = `${interpreter} -m stexls --version`;
    channel.appendLine(`> ${versionCmd}`);
    let version: string | undefined = undefined;
    try {
        version = cp.execSync(versionCmd).toString();
        channel.appendLine(version);
        const [major, minor, revision] = version.split('.');
        return {
            'major': parseInt(major),
            'minor': parseInt(minor),
            'revision': revision,
        }
    } catch (error) {
        channel.appendLine(error);
        return undefined;
    }
}

/**
 * Installs the stexls package using the selected python interpreter.
 * Allows the user to accept the auto install prompt or dismiss it which raises an exception.
 * @param interpreter Python interpreter executable.
 * @param installOptions Options used to install the stexls package.
 * @param channel Output channel for progress and diagnostics.
 * @param option Name of the option displayed to the user.
 * @returns Version of the upgraded server or undefined if the server failed to install.
 */
async function installOrUpgradeServer(
    interpreter: string,
    installOptions: string[] | undefined,
    channel: vscode.OutputChannel,
    option: string) {
    const response = await vscode.window.showInformationMessage(
        `Stexls is not installed or version did not match. Do you want to ${option.toLowerCase()} the stex language server now?`,
        `${option} now`,
    )
    if (response === `${option} now`) {
        if (installOptions === undefined) {
            throw Error(`Failed to build the stexls installation command.`)
        }
        const installArgs = [interpreter, ...installOptions];
        const installCmd = installArgs.join(' ');
        channel.appendLine(`> ${installCmd}`);
        await (async function () { undefined })();
        try {
            cp.execSync(installCmd);
        } catch (error) {
            channel.appendLine(error);
            channel.show()
            await vscode.window.showErrorMessage('Failed to install stexls.');
            return undefined;
        }
        return checkStexlsVersion(interpreter, channel);
    }
    await vscode.window.showInformationMessage('Stexls was not installed. Restart VSCode to try again.');
    throw Error('Stexls was not installed.')
}

/**
 * Asks the user to update "Python Interpreter" setting and returns the new setting after the user updated it.
 * @returns Python interpreter after the user fixed the setting.
 */
async function fixPythonInterpreter() {
    const iFixedIt = 'I fixed it';
    const response = await vscode.window.showErrorMessage(
        "You have not selected a python interpreter for Stexls. " +
        "Open your settings UI and search for 'stexls: Python Interpreter' and enter the path to your python executable.",
        iFixedIt
    )
    if (response === iFixedIt) {
        const config = vscode.workspace.getConfiguration("stexls");
        return config.get<string>("pythonInterpreter");
    } else {
        throw Error("Python interpreter not selected. Unable to start language server.");
    }
}

/**
 * Try getting the version of the "pythonInterpreter" Setting until it works or until the user dismisses the prompts.
 * @param channel Output channel to verify that something is being done.
 * @returns Python interpreter that successfully returned a version.
 */
async function checkPythonInterpreter(channel: vscode.OutputChannel) {
    do {
        const config = vscode.workspace.getConfiguration("stexls");
        let interpreter = config.get<string>("pythonInterpreter");
        if (interpreter !== undefined) {
            try {
                const versionCmd = `${interpreter} --version`;
                channel.appendLine(`> ${versionCmd}`);
                await (async function () { })()
                const version = cp.execSync(versionCmd).toString();
                channel.appendLine(version);
                await (async function () { })()
                return interpreter;
            } catch (error) {
                channel.appendLine(error);
                channel.show();
            }
        }
        interpreter = await fixPythonInterpreter();
        // Retry until user fixes it or dismisses the prompt.
    } while (true)
}

export async function activate(context: vscode.ExtensionContext) {
    console.log('Activating stexls client...');
    const channel = vscode.window.createOutputChannel('stexls');
    context.subscriptions.push(channel);
    channel.show(true);
    // Get the python interpreter and test if it works. If not, ask the user to input a new one until it works.
    const interpreter = await checkPythonInterpreter(channel);

    // initial version check.
    let version = checkStexlsVersion(interpreter, channel);

    do {
        // Getting the install options here allows changing them without restarting.
        const config = vscode.workspace.getConfiguration("stexls");
        const stexlsInstallOptions = config.get<string[]>("stexlsInstallOptions");
        if (!version) {
            // Ask to install if failed to get version
            version = await installOrUpgradeServer(interpreter, stexlsInstallOptions, channel, 'Install');
        } else {
            // Else only ask for upgrade if the version was parsed but is of unexpected value
            const expectedMajorVersion = 4;
            const minimumMinorVersion = 5;
            if (version.major != expectedMajorVersion || version.minor < minimumMinorVersion) {
                version = await installOrUpgradeServer(interpreter, stexlsInstallOptions, channel, 'Upgrade');
            }
        }
        // This loop is broken if the dismissed the stexls install prompt.
    } while (!version)

    let config = vscode.workspace.getConfiguration("stexls");

    const args = config.get<string[]>("command");

    if (!args) {
        throw Error(`Unable to get stexls command arguments. Settings "stexlsCommand" returned falsy: ${args}`);
    }

    const logfile = config.get<string>('logfile', '/tmp/stexls.log');

    const sharedArgs = [
        ...args,
        '--logfile',
        logfile
    ];

    const loglevel = config.get<string>('loglevel', 'error');
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

    const compileWorkspaceOnStartupFileLimit = config.get<number>("compileWorkspaceOnStartupFileLimit", 10000);
    const enableTrefier = config.get<string>("enableTrefier", 'disabled');
    const enableLintingOfRelatedFiles = config.get<boolean>("enableLintingOfRelatedFiles", false);
    const numJobs = config.get<number>('numJobs', 1);
    const delay = config.get<string>('delay', '1.0');
    const trefierDownloadLink = config.get<string>('trefierDownloadLink', "");
    const trefierFileSIzeLimitKB = config.get<number>('trefierFileSIzeLimitKB', 50);
    const linterFileSizeLimitKB = config.get<number>('linterFileSizeLimitKB', 100);

    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'latex' }],
        outputChannel: channel,
        traceOutputChannel: channel,
        initializationOptions: {
            "compileWorkspaceOnStartupFileLimit": compileWorkspaceOnStartupFileLimit,
            "enableTrefier": enableTrefier,
            "enableLintingOfRelatedFiles": enableLintingOfRelatedFiles,
            "numJobs": numJobs,
            "delay": delay,
            "trefierDownloadLink": trefierDownloadLink,
            "trefierFileSizeLimitKB": trefierFileSIzeLimitKB,
            "linterFileSizeLimitKB": linterFileSizeLimitKB,
        }
    };

    // Create the language client and start the client.
    const client = new LanguageClient(
        'stexls',
        serverOptions,
        clientOptions,
    );

    console.log('Starting client...');
    const client_disposable = client.start();
    context.subscriptions.push(client_disposable)
    console.log('Client started.');
}
