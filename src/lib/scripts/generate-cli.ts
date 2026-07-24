import fs from 'node:fs';
import path from 'node:path';
import { Project, SyntaxKind } from 'ts-morph';

const INDEX_PATH = path.resolve('src/index.ts');
const OUTPUT_PATH = 'src/lib/generated/cli.gen.ts';

if (!fs.existsSync(INDEX_PATH)) {
	throw new Error(
		`index.ts not found at ${INDEX_PATH} (cwd: ${process.cwd()})`,
	);
}

const project = new Project();
const sourceFile = project.addSourceFileAtPath(INDEX_PATH);

type ParamInfo = { name: string; type: string; optional: boolean };
type CmdInfo = {
	name: string;
	description: string;
	fnName: string;
	params: ParamInfo[];
};

const commands: CmdInfo[] = [];

const exportedDecls = sourceFile.getExportedDeclarations();

if (exportedDecls.size === 0) {
	throw new Error(
		`No exported declarations found in ${INDEX_PATH}. Check that index.ts uses named exports (export { x } from './y'), not export * from './y'.`,
	);
}

for (const [exportName, decls] of exportedDecls) {
	const decl = decls[0];
	if (!decl || decl.getKind() !== SyntaxKind.FunctionDeclaration) continue;

	const fn = decl.asKindOrThrow(SyntaxKind.FunctionDeclaration);

	const jsDoc = fn.getJsDocs()[0];
	const nameTag = jsDoc?.getTags().find((t) => t.getTagName() === 'name');
	const descTag = jsDoc
		?.getTags()
		.find((t) => t.getTagName() === 'description');

	const params: ParamInfo[] = fn.getParameters().map((p) => ({
		name: p.getName(),
		type: p.getType().getText(),
		optional: p.isOptional(),
	}));

	commands.push({
		name: nameTag?.getComment()?.toString().trim() ?? exportName,
		description: descTag?.getComment()?.toString().trim() ?? '',
		fnName: exportName,
		params,
	});
}

if (commands.length === 0) {
	throw new Error(
		'No function exports found among exported declarations. Are they all functions?',
	);
}

const imports = commands.map((c) => c.fnName).join(', ');

const commandBlocks = commands
	.map((c) => {
		const positional = c.params.filter(
			(p) => p.type !== 'boolean' && !p.optional,
		);
		const flags = c.params.filter((p) => p.type === 'boolean' || p.optional);

		const argStr = positional.map((p) => `<${p.name}>`).join(' ');
		const optionLines = flags
			.map((p) =>
				p.type === 'boolean'
					? `  .option('--${p.name}', '${p.name}')`
					: `  .option('--${p.name} <${p.name}>', '${p.name}')`,
			)
			.join('\n');

		const actionParams = [
			...positional.map((p) => p.name),
			...(flags.length ? ['opts'] : []),
		].join(', ');
		const callArgs = actionParams;

		return `program
  .command('${c.name}${argStr ? ` ${argStr}` : ''}')
  .description('${c.description}')
${optionLines}
  .action((${actionParams}) => {
    const result = ${c.fnName}(${callArgs});
    if (result !== undefined) console.log(result);
  });`;
	})
	.join('\n\n');

const output = `// AUTO-GENERATED — do not edit. Run \`bun run generate:cli\` to regenerate.
import { type Command } from 'commander';
import { ${imports} } from './index';

export function registerCommands(program: Command) {
${commandBlocks
	.split('\n')
	.map((l) => `  ${l}`)
	.join('\n')}
}
`;

project.createSourceFile(OUTPUT_PATH, output, { overwrite: true });
project.saveSync();

if (!fs.existsSync(path.resolve(OUTPUT_PATH))) {
	throw new Error(
		`Expected ${OUTPUT_PATH} to exist after saveSync(), but it doesn't.`,
	);
}

console.log(`Generated ${commands.length} command(s) in ${OUTPUT_PATH}`);
