/**
 * @name greet
 * @description Greet someone by name
 */
export function greet(name: string, loud?: boolean) {
	const msg = `Hello, ${name}!`;
	return loud ? msg.toUpperCase() : msg;
}
