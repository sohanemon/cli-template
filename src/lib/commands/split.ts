import { Command } from 'commander';
import { color } from '../utils/color';

interface SplitOptions {
	first?: boolean;
	separator?: string;
}

export function splitCommand() {
	return new Command('split')
		.description('Split a string into parts')
		.argument('<string>', 'string to split')
		.option('--first', 'show only the first part')
		.option('-s, --separator <char>', 'separator character', ',')
		.action((str: string, options: SplitOptions) => {
			const limit = options.first ? 1 : undefined;
			const parts = str.split(options.separator ?? ',', limit);

			if (parts.length === 0) {
				console.log(color.muted('(empty)'));
				return;
			}

			for (const part of parts) {
				console.log(`  ${color.info(JSON.stringify(part))}`);
			}
			console.log(color.muted(`\n→ ${parts.length} part(s)`));
		});
}
