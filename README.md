# cli-template

A minimal Bun CLI template using Commander, Chalk & Inquirer.

## Usage

```sh
# Run locally
bun src/cli.ts --help

# Dev script
bun run dev
```

## Commands

```
greet <name>     Greet someone
interactive|i    Launch an interactive prompt session
split <string>   Split a string into parts
spinner          Show a spinner animation
```

## Global install

The `bin` field in `package.json` points to `src/cli.ts` with a `#!/usr/bin/env bun` shebang, so the CLI can be installed globally:

```sh
# Install globally from local
bun install -g .

# Or link for development
bun link

# Or install from npm once published
bun install -g cli-template
```

Once installed, run from anywhere:

```sh
cli-template greet World
cli-template split "a,b,c" --first
```

You can also use it ad-hoc without installing:

```sh
bunx cli-template greet World
```

## Interactive prompts

The `interactive` command uses **Inquirer** for rich terminal prompts:

```ts
import inquirer from 'inquirer';

const answers = await inquirer.prompt([
  {
    type: 'input',
    name: 'name',
    message: 'What is your name?',
    default: 'World',
  },
  {
    type: 'select',
    name: 'color',
    message: 'Pick a color:',
    choices: ['Red', 'Green', 'Blue', 'Yellow'],
  },
  {
    type: 'confirm',
    name: 'shout',
    message: 'Shout it?',
    default: false,
  },
]);

console.log(`Hello, ${answers.name}! Your color is ${answers.color}.`);
```

Run it:

```sh
bun src/cli.ts interactive
# or
bun run dev interactive
```
