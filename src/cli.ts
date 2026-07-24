#!/usr/bin/env node

import { Command } from 'commander';
import * as packageJson from '../package.json';
import { greetCommand } from './lib/commands/greet';
import { interactiveCommand } from './lib/commands/interactive';

const program = new Command();

program
	.name(packageJson.name)
	.description(packageJson.description)
	.version(packageJson.version);

program.addCommand(greetCommand());
program.addCommand(interactiveCommand());

// INFO: Show help and exit 0 when no args
if (process.argv.length === 2) {
	program.outputHelp();
	process.exit(0);
}

await program.parseAsync(process.argv);
