// 1. Basic case (yours) — required string + optional boolean, alias, no @name (falls back to export name)
/**
 * @alias g
 * @description Greet someone by name
 * @param shout lets shout out
 * @interactive
 */
export function greet(name: string, shout?: boolean) {
	const msg = `Hello, ${name}!`;
	return shout ? msg.toUpperCase() : msg;
}

// 2. Explicit @name overriding export name
/**
 * @name say-hi
 * @description Custom-named command
 */
export function sayHiInternal(name: string) {
	return `Hi ${name}`;
}

// 3. Required number
/**
 * @description Add two numbers
 * @param a first number
 * @param b second number
 */
export function add(a: number, b: number) {
	return a + b;
}

// 4. Optional number with default value
/**
 * @description Multiply with a configurable factor
 * @param value the input value
 * @param factor multiplier
 */
export function scale(value: number, factor: number = 2) {
	return value * factor;
}

// 5. Required string array (variadic positional)
/**
 * @description Join a list of words
 * @param words words to join
 */
export function joinWords(words: string[]) {
	return words.join(' ');
}

// 6. Optional string array (repeatable flag)
/**
 * @description Print optional tags
 * @param tags optional tags to include
 */
export function printTags(tags?: string[]) {
	return tags?.join(',') ?? '';
}

// 7. Required number array
/**
 * @description Sum a list of numbers
 * @param values numbers to sum
 */
export function sumAll(values: number[]) {
	return values.reduce((a, b) => a + b, 0);
}

// 8. Required enum (string-literal union) as positional
/**
 * @description Set log level
 * @param level the log level
 */
export function setLevel(level: 'debug' | 'info' | 'error') {
	return `level set to ${level}`;
}

// 9. Optional enum with default
/**
 * @description Format output
 * @param format output format
 */
export function formatOutput(text: string, format: 'json' | 'text' = 'text') {
	return format === 'json' ? JSON.stringify({ text }) : text;
}

// 10. No description on params at all — should fall back to "name (kind)"
/**
 * @description Undocumented params fallback test
 */
export function undocumented(name: string, active?: boolean) {
	return `${name}:${active}`;
}

// 11. Flat object param (your nested-object feature, one level)
/**
 * @description Create a user
 * @param user.name the user's name
 * @param user.age the user's age
 */
export function createUser(user: { name: string; age: number }) {
	return `${user.name} (${user.age})`;
}

// 12. Deeply nested object param (2+ levels)
/**
 * @description Complex nested config test
 * @param config.retries retry count
 */
export function configure(config: {
	retries: number;
	nested: { deep: { flag: boolean } };
}) {
	return JSON.stringify(config);
}

// 13. Optional object param
/**
 * @description Optional settings object
 */
export function applySettings(settings?: { verbose: boolean; level: number }) {
	return JSON.stringify(settings ?? {});
}

// 14. Async function — should generate `async` action + `await` call
/**
 * @description Fetch something asynchronously
 * @param id the resource id
 */
export async function fetchResource(id: string) {
	return Promise.resolve(`resource-${id}`);
}

// 15. Multiple @example tags — should render in --help via addHelpText
/**
 * @description Command with examples
 * @param name target name
 * @example greet-multi Alice --loud
 * @example greet-multi Bob
 */
export function greetMulti(name: string, loud?: boolean) {
	return loud ? name.toUpperCase() : name;
}

// 16. No params at all
/**
 * @description Run with zero arguments
 */
export function ping() {
	return 'pong';
}

// 17. Mixed required positional + required enum + optional flag, ordering correct
/**
 * @description Deploy to an environment
 * @param service service name
 * @param env target environment
 * @param dryRun preview only, don't apply
 */
export function deploy(
	service: string,
	env: 'staging' | 'prod',
	dryRun?: boolean,
) {
	return `deploying ${service} to ${env}${dryRun ? ' (dry run)' : ''}`;
}
