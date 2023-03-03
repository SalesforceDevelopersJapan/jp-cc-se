
https://github.com/oclif/oclif

oclif-hello-world
=================

oclif example Hello World CLI

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![CircleCI](https://circleci.com/gh/oclif/hello-world/tree/main.svg?style=shield)](https://circleci.com/gh/oclif/hello-world/tree/main)
[![Downloads/week](https://img.shields.io/npm/dw/oclif-hello-world.svg)](https://npmjs.org/package/oclif-hello-world)
[![License](https://img.shields.io/npm/l/oclif-hello-world.svg)](https://github.com/oclif/hello-world/blob/main/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->
# Usage
<!-- usage -->
```sh-session
$ npm install -g jpccsfdx
$ jpccsfdx COMMAND
running command...
$ jpccsfdx (--version)
jpccsfdx/0.0.0 darwin-x64 node-v18.8.0
$ jpccsfdx --help [COMMAND]
USAGE
  $ jpccsfdx COMMAND
...
```
<!-- usagestop -->
# Commands
<!-- commands -->
* [`jpccsfdx hello PERSON`](#jpccsfdx-hello-person)
* [`jpccsfdx hello world`](#jpccsfdx-hello-world)
* [`jpccsfdx help [COMMANDS]`](#jpccsfdx-help-commands)
* [`jpccsfdx plugins`](#jpccsfdx-plugins)
* [`jpccsfdx plugins:install PLUGIN...`](#jpccsfdx-pluginsinstall-plugin)
* [`jpccsfdx plugins:inspect PLUGIN...`](#jpccsfdx-pluginsinspect-plugin)
* [`jpccsfdx plugins:install PLUGIN...`](#jpccsfdx-pluginsinstall-plugin-1)
* [`jpccsfdx plugins:link PLUGIN`](#jpccsfdx-pluginslink-plugin)
* [`jpccsfdx plugins:uninstall PLUGIN...`](#jpccsfdx-pluginsuninstall-plugin)
* [`jpccsfdx plugins:uninstall PLUGIN...`](#jpccsfdx-pluginsuninstall-plugin-1)
* [`jpccsfdx plugins:uninstall PLUGIN...`](#jpccsfdx-pluginsuninstall-plugin-2)
* [`jpccsfdx plugins update`](#jpccsfdx-plugins-update)

## `jpccsfdx hello PERSON`

Say hello

```
USAGE
  $ jpccsfdx hello PERSON -f <value>

ARGUMENTS
  PERSON  Person to say hello to

FLAGS
  -f, --from=<value>  (required) Who is saying hello

DESCRIPTION
  Say hello

EXAMPLES
  $ oex hello friend --from oclif
  hello friend from oclif! (./src/commands/hello/index.ts)
```

_See code: [dist/commands/hello/index.ts](https://github.com/SalesforceDevelopersJapan/jp-cc-se/blob/v0.0.0/dist/commands/hello/index.ts)_

## `jpccsfdx hello world`

Say hello world

```
USAGE
  $ jpccsfdx hello world

DESCRIPTION
  Say hello world

EXAMPLES
  $ jpccsfdx hello world
  hello world! (./src/commands/hello/world.ts)
```

## `jpccsfdx help [COMMANDS]`

Display help for jpccsfdx.

```
USAGE
  $ jpccsfdx help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for jpccsfdx.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v5.2.5/src/commands/help.ts)_

## `jpccsfdx plugins`

List installed plugins.

```
USAGE
  $ jpccsfdx plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ jpccsfdx plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v2.3.2/src/commands/plugins/index.ts)_

## `jpccsfdx plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ jpccsfdx plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ jpccsfdx plugins add

EXAMPLES
  $ jpccsfdx plugins:install myplugin 

  $ jpccsfdx plugins:install https://github.com/someuser/someplugin

  $ jpccsfdx plugins:install someuser/someplugin
```

## `jpccsfdx plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ jpccsfdx plugins:inspect PLUGIN...

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ jpccsfdx plugins:inspect myplugin
```

## `jpccsfdx plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ jpccsfdx plugins:install PLUGIN...

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.


ALIASES
  $ jpccsfdx plugins add

EXAMPLES
  $ jpccsfdx plugins:install myplugin 

  $ jpccsfdx plugins:install https://github.com/someuser/someplugin

  $ jpccsfdx plugins:install someuser/someplugin
```

## `jpccsfdx plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ jpccsfdx plugins:link PLUGIN

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ jpccsfdx plugins:link myplugin
```

## `jpccsfdx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ jpccsfdx plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ jpccsfdx plugins unlink
  $ jpccsfdx plugins remove
```

## `jpccsfdx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ jpccsfdx plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ jpccsfdx plugins unlink
  $ jpccsfdx plugins remove
```

## `jpccsfdx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ jpccsfdx plugins:uninstall PLUGIN...

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ jpccsfdx plugins unlink
  $ jpccsfdx plugins remove
```

## `jpccsfdx plugins update`

Update installed plugins.

```
USAGE
  $ jpccsfdx plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```
<!-- commandsstop -->
