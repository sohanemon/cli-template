import { Command } from 'commander';
import { color } from '../utils/color';
import { sleep } from '../utils/io';

export function spinnerCommand() {
	return new Command('spinner')
		.description('Show a spinner animation')
		.action(async () => {
			const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

			for (let i = 0; i < 20; i++) {
				const frame = frames[i % frames.length];
				process.stdout.write(`\r${color.info(`${frame} Working...`)}`);
				await sleep(80);
			}

			process.stdout.write(`\r${color.success('✓ Done!')}   \n`);
		});
}
