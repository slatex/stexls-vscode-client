# stexls-vscode-client README

This is a client for the stexls language server.


# Requirements

You need to install the language server by follwing the installation instructions
at https://gl.kwarc.info/Marian6814/stexls.git.


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
Open the Settings UI and search for "stexls". All available settings should be filtered out.
You can set the python interpreter you want to use, as well as the command used to start the language server.

## Commands

No commands are added.


# Uninstallation

To uninstall simply uninstall the extension from the extensions tab.
