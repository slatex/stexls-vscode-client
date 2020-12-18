# stexls-vscode-client README

This is a client for the stexls language server.


# Requirements

You need to install the language server by follwing the installation instructions
at [https://github.com/slatex/stexls](https://github.com/slatex/stexls).


# Installation

Download the vsix file from this repository.

Go into VSCode and either install it using the extensions tab on the left or
press `ctrl+shift+p` and select "Install from VSIX".

Then restart VSCode.


# Usage

You don't have to do anything after you installed the language server and client.

Start VSCode and open your stex root directory.

The root must be the folder gimport and importmodule statements are relative to, else
it won't work.


# Contributions

## Settings

This extension contributes some settings you can change.

Open the Settings UI and search for "stexls".

All available settings should be filtered out.

You should set the python interpreter exectuable you want to use.

If you want to enable the trefier using the Setting "Enable Trefier" make sure you installed the
python serverside with the "ml" flag so that tensorflow and other dependencies are installed.

# Uninstallation

To uninstall simply uninstall the extension from the extensions tab,
or directly remove this extension's directory from `~/.vscode/extensions`.

# How to compile this yourself

Install `npm` (Node package manager) on your system.

Install the VSCode extension command using npm: `npm install -h vsce`

Download this extension's repository.

Run `npm install` from inside this repository to initialize the development environment.

Make your changes to the extension.

Don't forget to increment the version number in package.json for continuity's sake.

Execute `vsce package` from inside this repository in order to create an installable *.vsix package.

Install the extension.
