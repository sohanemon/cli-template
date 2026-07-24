// AUTO-GENERATED — do not edit. Run `bun run generate:cli` to regenerate.
import { type Command } from 'commander';
import { greet } from './index';

export function registerCommands(program: Command) {
  program
    .command('greet <name>')
    .description('Greet someone by name')
    .option('--loud <loud>', 'loud')
    .action((name, opts) => {
      const result = greet(name, opts);
      if (result !== undefined) console.log(result);
    });
}
