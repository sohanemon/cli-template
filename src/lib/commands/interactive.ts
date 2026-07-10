import { Command } from 'commander';
import inquirer from 'inquirer';
import { color, colorNames } from '../utils/color';

export function interactiveCommand() {
	return new Command('interactive')
		.alias('i')
		.description('Launch an interactive prompt session')
		.action(async () => {
			const answers = await inquirer.prompt([
				{
					type: 'input',
					name: 'name',
					message: 'What is your name?',
					default: 'World',
				},
				{
					type: 'list',
					name: 'type',
					message: 'Pick a type:',
					choices: colorNames,
				},
				{
					type: 'confirm',
					name: 'shout',
					message: 'Shout it?',
					default: false,
				},
			]);

			const msg = `Hello, ${answers.name}! Your color is ${answers.color}.`;
			const output = answers.shout ? msg.toUpperCase() : msg;

			console.log(color.warn(output));
		});
}
