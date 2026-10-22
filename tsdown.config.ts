import { defineConfig } from 'tsdown';

export default defineConfig({
	platform: 'node',
	format: ['esm'],
	dts: true,
	minify: true,
	treeshake: true,
	entry: ['./src/cli.ts'],
	deps: { neverBundle: true },
	exports: {
		bin: {
			cli: './src/cli.ts',
			'cli-template': './src/cli.ts',
		},
	},
});
