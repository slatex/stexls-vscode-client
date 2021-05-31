# stexls-vscode-client README

This is a client for the stexls language server.


# Installation

Download the vsix file from this repository.

Go into VSCode and either install it using the extensions tab on the left or
press `ctrl+shift+p` and select "Install from VSIX".

Then restart VSCode.


# First Steps

Here are some thing you should do after you first installed the extension.


## The Settings


First thing you should do after installing is to open the settings UI and search for `stexls`.


Then confirm that your `stexls: Python Interpreter` setting points to the python executable you want to use.


You can disable the machine learning drifen trefier package
with the `stexls: Enable Trefier` setting.


If you're planning on working with modules that many other files
depend on, you may want to disable the `stexls: Enable Linting Of Related Files` setting, which will automatically lint all files
that depend on the file you work on.


The `stexls: Num Jobs` setting should be set to your machine's number
of cores. Multiprocesing is only used at each startup of the extension
and gathers information in all files of your workspace.


There are more settings you can adjust to your liking.
If you experience slowdown because of large files you can adjust the `file size limit` settings. Or if you think you have to wait too long for updates after a save then adjust the `stexls: Delay` setting, which 
shortens or increases the buffering delay after which the linter is run against your edited files.

# Usage

You don't have to do anything after you installed the language server and client.

Start VSCode and open your stex root directory.

## Flow

The server starts after you open a file assosiated with
the LaTeX language ID. You can confirm and change the language for the file you current have open by pressing the
button in the bottom right corner, in case LaTeX is not
automatically selected for you.

The server will initially compile all files in the workspace (up to the limit from `stexls: Compile Workspace On Startup File Limit`) and report a `Compiling: xxxx files` on the bottom status bar. This number will not until everything is done. This proces is using all the cores specified in `stexls: Num Jobs`, so it may make your computer slow for the time. The server is completely unresponsive until this notification is done.

After the `Compiling: xxxx files` notification is finished,
a `Linting: xxxx files (eta...)` will appear. This
progress notification is dynamic and updated regularly.
You can start editing now and the server will automatically
prioritize your newly edited files in the linting queue.

# Installing The Backend

This extension runs using a python package located at (https://github.com/slatex/stexls)

Make sure you have properly set python interpreter you want to use.

After you start the extension, it will prompt you to install the server for you. Press the install button and
everything will done automatically.


# Updating the backend

In order to update to the newest version from the git master, you only have to `pip uninstall stexls` using the `pip` from the python interpreter you selected in the settings.

# The Root Directory

The `root directory` is the only directory you should have open in your
workspace.

Modern editors like VSCode allow for multi-root workspaces, but
this extension only handles a single root.

The `root directory` is the directory from which imports are resolved.
If the imports in your projects look like `\gimport[smglom/arithmetics]{...}` then your `root` is the parent folder of `smglom/`.

## Ignorefile

The root directory can also contain a `.stexlsignore` file.
Each line in the ignorefile is a glob pattern that prevents files
that match any one from being linted by user input.

The syntax is the same as in for example `.gitignore` files, but
only the basics are implemented:

```
file.tex
parent/*/file2.tex
parent/**/file3.tex
*substr*
!sub-dir/file.tex
!substr
```

This example file contains in each line:
1. Glob that ignores _any_ file _and_ directory with the full name `file.tex`, irregardless of it's path.
2. Any file named `file2.tex` that is contained in a sub-directory of `parent`. For example `parent/sub/file2.tex`, but not `parent/sub1/sub2/file2.tex`.
3. This is a globstar that matches any number of subdirectories. This would ignore `parent/sub1/sub2/file3.tex`, but also `parent/file3.tex`.
4. `*substr*` ignores any file or directory and it's contents that contain the substring `substr` in its name.
5. Patterns that start with a `!` will include the specified pattern if it was ignored by another line before or after. `sub-dir/file.tex` will not be ignored even though the pattern `file.tex` was speified before.
6. This would include the file or directory with the full name `substr` even though it was ignored by the `*substr*` pattern before.

Any other syntax `.gitignore` supports is probably not supported here.


# Uninstallation

To uninstall simply uninstall the extension from the extensions tab,
or directly remove this extension's directory from `~/.vscode/extensions`.


The extension also generates cache files in the root directory `<root>/.stexls`. You can delete this folder at any time.


The tensorflow model is downloaded to `~/.stexls`.


# How to compile this yourself

Install `npx` (Node package manager) on your system.

Download this extension's repository.

Run `npm install` from inside this repository to initialize the development environment.

Don't forget to increment the version number in `package.json` for continuity's sake.

Execute `npx vsce package` from inside this repository in order to create an installable *.vsix package.

Install the extension from vsix.
