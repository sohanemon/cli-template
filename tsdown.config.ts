import { defineConfig } from 'tsdown';

export default defineConfig({
	platform: 'neutral',
	format: ['esm'],
	dts: true,
	minify: true,
	exports: true,
	skipNodeModulesBundle: true,
	entry: ['./src/cli.ts'],
	treeshake: true,
});
