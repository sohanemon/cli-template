import chalk from 'chalk';

export const color = {
	info: chalk.cyan,
	success: chalk.green,
	warn: chalk.yellow,
	error: chalk.red,
	muted: chalk.dim,
	bold: chalk.bold,
} as const;

export const colorNames = Object.keys(color);

export type Color = keyof typeof color;
