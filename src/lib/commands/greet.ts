import { Command } from 'commander';
import { color } from '../utils/color';

interface GreetOptions {
	formal?: boolean;
}

export function greetCommand() {
	return new Command('greet')
		.description('Greet someone')
		.argument('<name>', 'person to greet')
		.option('-f, --formal', 'use formal greeting')
		.action((name: string, options: GreetOptions) => {
			if (options.formal) {
				console.log(color.bold(`Good day, ${name}.`));
			} else {
				console.log(color.bold(`Hello, ${name}!`));
			}
		});
}
