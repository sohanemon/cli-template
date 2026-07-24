// AUTO-GENERATED — do not edit by hand. Run `bun run generate:cli` to regenerate.
import { Command, Option, Argument } from 'commander';
import { greet, sayHiInternal, add, scale, joinWords, printTags, sumAll, setLevel, formatOutput, undocumented, createUser, configure, applySettings, fetchResource, greetMulti, ping, deploy } from '../../index';

export function registerCommands(program: Command): void {
  program
    .command('greet')
    .alias('g')
    .description("Greet someone by name")
    .argument('<name>', "name (string)")
    .option('--shout', "lets shout out")
    .action((name, opts) => {
      const result = greet(name, opts.shout);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('say-hi')
    .description("Custom-named command")
    .argument('<name>', "name (string)")
    .action((name) => {
      const result = sayHiInternal(name);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('add')
    .description("Add two numbers")
    .argument('<a>', "first number")
    .argument('<b>', "second number")
    .action((a, b) => {
      const result = add(a, b);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('scale')
    .description("Multiply with a configurable factor")
    .argument('<value>', "the input value")
    .option('--factor <value>', "multiplier")
    .action((value, opts) => {
      const result = scale(value, opts.factor);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('joinWords')
    .description("Join a list of words")
    .argument('<words...>', "words to join")
    .action((words) => {
      const result = joinWords(words);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('printTags')
    .description("Print optional tags")
    .option('--tags <values...>', "optional tags to include", [])
    .action((opts) => {
      const result = printTags(opts.tags);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('sumAll')
    .description("Sum a list of numbers")
    .argument('<values...>', "numbers to sum")
    .action((values) => {
      const result = sumAll(values);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('setLevel')
    .description("Set log level")
    .addArgument(new Argument('<level>', "the log level").choices(["debug","info","error"]))
    .action((level) => {
      const result = setLevel(level);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('formatOutput')
    .description("Format output")
    .argument('<text>', "text (string)")
    .addOption(new Option('--format <value>', "output format").choices(["json","text"]))
    .action((text, opts) => {
      const result = formatOutput(text, opts.format);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('undocumented')
    .description("Undocumented params fallback test")
    .argument('<name>', "name (string)")
    .option('--active', "active (boolean)")
    .action((name, opts) => {
      const result = undocumented(name, opts.active);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('createUser')
    .description("Create a user")
    .option('--user-name <value>', "the user's name")
    .option('--user-age <value>', "the user's age")
    .action((opts) => {
      const result = createUser({ name: opts.userName, age: opts.userAge });
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('configure')
    .description("Complex nested config test")
    .option('--config-retries <value>', "retry count")
    .option('--config-nested-deep-flag', "flag (boolean)")
    .action((opts) => {
      const result = configure({ retries: opts.configRetries, nested: { deep: { flag: opts.configNestedDeepFlag } } });
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('applySettings')
    .description("Optional settings object")
    .option('--settings-verbose', "verbose (boolean)")
    .option('--settings-level <value>', "level (number)")
    .action((opts) => {
      const result = applySettings({ verbose: opts.settingsVerbose, level: opts.settingsLevel });
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('fetchResource')
    .description("Fetch something asynchronously")
    .argument('<id>', "the resource id")
    .action(async (id) => {
      const result = await fetchResource(id);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('greetMulti')
    .description("Command with examples")
    .argument('<name>', "target name")
    .option('--loud', "loud (boolean)")
    .addHelpText('after', "\nExamples:\n  $ greet-multi Alice --loud\n  $ greet-multi Bob")
    .action((name, opts) => {
      const result = greetMulti(name, opts.loud);
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('ping')
    .description("Run with zero arguments")
  
    .action(() => {
      const result = ping();
      if (result !== undefined) console.log(result);
    });
  
  program
    .command('deploy')
    .description("Deploy to an environment")
    .argument('<service>', "service name")
    .addArgument(new Argument('<env>', "target environment").choices(["staging","prod"]))
    .option('--dryRun', "preview only, don't apply")
    .action((service, env, opts) => {
      const result = deploy(service, env, opts.dryRun);
      if (result !== undefined) console.log(result);
    });
}
