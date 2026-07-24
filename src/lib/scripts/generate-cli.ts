import fs from 'node:fs';
import path from 'node:path';
import {
	type FunctionDeclaration,
	type JSDoc,
	type JSDocParameterTag,
	Project,
	SyntaxKind,
	type Type,
} from 'ts-morph';

const INDEX_PATH = path.resolve('src/index.ts');
const OUTPUT_PATH = path.resolve('src/lib/generated/cli.gen.ts');

// NOTE: Param type definitions

type ParamKind =
	| 'string'
	| 'number'
	| 'boolean'
	| 'string[]'
	| 'number[]'
	| 'enum';

interface ParamInfo {
	path: string[];
	kind: ParamKind;
	optional: boolean;
	defaultValue: string | undefined;
	description: string;
	choices?: string[];
}

interface CommandInfo {
	name: string;
	alias: string | undefined;
	description: string;
	examples: string[];
	fnName: string;
	params: ParamInfo[];
	isAsync: boolean;
}

// NOTE: Throw with export name for traceability

function fail(exportName: string, message: string): never {
	throw new Error(`[generate-cli] "${exportName}": ${message}`);
}

// NOTE: TSDoc extraction helpers

function getTagText(
	jsDoc: JSDoc | undefined,
	tagName: string,
): string | undefined {
	return jsDoc
		?.getTags()
		.find((t) => t.getTagName() === tagName)
		?.getComment()
		?.toString()
		.trim();
}

function getAllTagTexts(jsDoc: JSDoc | undefined, tagName: string): string[] {
	return (
		jsDoc
			?.getTags()
			.filter((t) => t.getTagName() === tagName)
			.map((t) => t.getComment()?.toString().trim() ?? '')
			.filter((text) => text.length > 0) ?? []
	);
}

function parseParamTag(raw: string): { name: string; description: string } {
	const dashSplit = raw.split(/\s+-\s+/);
	if (dashSplit.length >= 2) {
		// biome-ignore lint/style/noNonNullAssertion:  dashSplit[0] defined — length >= 2 ensures it exists
		const firstName = dashSplit[0]!;
		return {
			name: firstName.trim(),
			description: dashSplit.slice(1).join(' - ').trim(),
		};
	}
	const [name, ...rest] = raw.split(/\s+/);
	return { name: (name ?? '').trim(), description: rest.join(' ').trim() };
}

function getParamTagMap(jsDoc: JSDoc | undefined): Map<string, string> {
	const map = new Map<string, string>();
	if (!jsDoc) return map;

	for (const tag of jsDoc.getTags()) {
		if (tag.getTagName() !== 'param') continue;

		if (tag.getKind() === SyntaxKind.JSDocParameterTag) {
			const paramTag = tag as JSDocParameterTag;
			const name = paramTag.getName();
			const comment = paramTag.getComment()?.toString().trim() ?? '';
			const description = comment.replace(/^-\s*/, '').trim();
			if (name.length > 0 && description.length > 0) map.set(name, description);
			continue;
		}

		const raw = tag.getComment()?.toString().trim() ?? '';
		const { name, description } = parseParamTag(raw);
		if (name.length > 0 && description.length > 0) map.set(name, description);
	}

	return map;
}

// NOTE: Type resolution — parse TS types to ParamKind

function tryResolveLeafKind(
	type: Type,
): { kind: ParamKind; choices?: string[] } | null {
	const typeText = type.getText();

	if (typeText === 'string') return { kind: 'string' };
	if (typeText === 'number') return { kind: 'number' };
	if (typeText === 'boolean') return { kind: 'boolean' };
	if (typeText === 'string[]' || typeText === 'Array<string>')
		return { kind: 'string[]' };
	if (typeText === 'number[]' || typeText === 'Array<number>')
		return { kind: 'number[]' };

	// NOTE: Check union members directly instead of regex on getText() — TS can render quotes inconsistently
	if (type.isUnion()) {
		const members = type.getUnionTypes();
		const allStringLiterals = members.every((m) => m.isStringLiteral());
		if (allStringLiterals) {
			const choices = members.map((m) => {
				const literal = m.getLiteralValue();
				return typeof literal === 'string' ? literal : String(literal);
			});
			return { kind: 'enum', choices };
		}
	}

	return null;
}

function expandParam(
	exportName: string,
	fieldPath: string[],
	rawType: Type,
	parentOptional: boolean,
	paramDescriptions: Map<string, string>,
): ParamInfo[] {
	const type = rawType.getNonNullableType();
	const dottedKey = fieldPath.join('.');

	const leaf = tryResolveLeafKind(type);
	if (leaf) {
		const lastSegment = fieldPath[fieldPath.length - 1];
		const description =
			paramDescriptions.get(dottedKey) ?? `${lastSegment} (${leaf.kind})`;
		return [
			{
				path: fieldPath,
				kind: leaf.kind,
				optional: parentOptional,
				defaultValue: undefined,
				description,
				choices: leaf.choices,
			},
		];
	}

	if (type.isArray()) {
		fail(
			exportName,
			`parameter "${dottedKey}" is an array of non-primitive items. Arrays of objects aren't supported by codegen — write this command by hand instead.`,
		);
	}

	const props = type.getProperties();
	if (props.length === 0) {
		fail(
			exportName,
			`parameter "${dottedKey}" has unsupported type "${rawType.getText()}". Supported: string, number, boolean, string[], number[], string-literal unions, or flat/nested objects of the above.`,
		);
	}

	return props.flatMap((prop) => {
		const propName = prop.getName();
		const decl = prop.getDeclarations()[0];
		const propType = decl
			? prop.getTypeAtLocation(decl)
			: prop.getValueDeclaration()?.getType();
		if (!propType) {
			fail(
				exportName,
				`could not resolve type of property "${dottedKey}.${propName}".`,
			);
		}
		const propOptional = prop.isOptional() || parentOptional;
		return expandParam(
			exportName,
			[...fieldPath, propName],
			propType,
			propOptional,
			paramDescriptions,
		);
	});
}

// NOTE: Build CommandInfo from a function declaration

function extractCommandInfo(
	exportName: string,
	fn: FunctionDeclaration,
): CommandInfo {
	const jsDoc = fn.getJsDocs()[0];

	if (!jsDoc) {
		fail(
			exportName,
			'missing JSDoc block entirely. Every exported function needs at least @description.',
		);
	}

	const name = getTagText(jsDoc, 'name') ?? exportName;
	const description = getTagText(jsDoc, 'description');
	const alias = getTagText(jsDoc, 'alias');
	const examples = getAllTagTexts(jsDoc, 'example');

	if (!description) fail(exportName, 'missing required @description tag.');

	const paramDescriptions = getParamTagMap(jsDoc);
	const fnParams = fn.getParameters();

	const params: ParamInfo[] = fnParams.flatMap((p) => {
		const paramName = p.getName();
		const optional = p.isOptional() || p.hasInitializer();
		return expandParam(
			exportName,
			[paramName],
			p.getType(),
			optional,
			paramDescriptions,
		);
	});

	const positionalKinds: ParamKind[] = ['string', 'number', 'enum'];
	let seenOptional = false;
	for (const p of params) {
		if (p.path.length > 1) continue;
		const isRequiredPositional =
			positionalKinds.includes(p.kind) && !p.optional;
		if (isRequiredPositional && seenOptional) {
			fail(
				exportName,
				`required parameter "${p.path[0]}" appears after an optional parameter. Reorder so all required params come first.`,
			);
		}
		if (p.optional || p.kind === 'boolean' || p.kind.endsWith('[]'))
			seenOptional = true;
	}

	return {
		name,
		alias,
		description: description ?? '',
		examples,
		fnName: exportName,
		params,
		isAsync: fn.isAsync(),
	};
}

// NOTE: Codegen helpers

function kebabFlagName(p: ParamInfo): string {
	return p.path.join('-');
}

function camelAccessorName(p: ParamInfo): string {
	return p.path
		.map((seg, i) =>
			i === 0 ? seg : seg.charAt(0).toUpperCase() + seg.slice(1),
		)
		.join('');
}

function buildArgOrOption(p: ParamInfo): {
	kind: 'argument' | 'option';
	line: string;
} {
	const escapedDesc = JSON.stringify(p.description);
	const flag = kebabFlagName(p);
	const isNested = p.path.length > 1;

	if (isNested) {
		if (p.kind === 'boolean') {
			return { kind: 'option', line: `.option('--${flag}', ${escapedDesc})` };
		}
		if (p.kind === 'enum') {
			return {
				kind: 'option',
				line: `.addOption(new Option('--${flag} <value>', ${escapedDesc}).choices(${JSON.stringify(p.choices)}))`,
			};
		}
		if (p.kind === 'string[]' || p.kind === 'number[]') {
			return {
				kind: 'option',
				line: `.option('--${flag} <values...>', ${escapedDesc}, [])`,
			};
		}
		return {
			kind: 'option',
			line: `.option('--${flag} <value>', ${escapedDesc})`,
		};
	}

	if (p.kind === 'boolean') {
		return {
			kind: 'option',
			line: `.option('--${flag}', ${escapedDesc}${p.defaultValue ? `, ${p.defaultValue}` : ''})`,
		};
	}
	if (p.kind === 'string[]' || p.kind === 'number[]') {
		if (!p.optional)
			return {
				kind: 'argument',
				line: `.argument('<${flag}...>', ${escapedDesc})`,
			};
		return {
			kind: 'option',
			line: `.option('--${flag} <values...>', ${escapedDesc}, [])`,
		};
	}
	if (p.kind === 'enum') {
		const choicesArr = JSON.stringify(p.choices);
		if (!p.optional) {
			return {
				kind: 'argument',
				line: `.addArgument(new Argument('<${flag}>', ${escapedDesc}).choices(${choicesArr}))`,
			};
		}
		return {
			kind: 'option',
			line: `.addOption(new Option('--${flag} <value>', ${escapedDesc}).choices(${choicesArr})${p.defaultValue ? `.default(${p.defaultValue})` : ''})`,
		};
	}
	if (!p.optional)
		return { kind: 'argument', line: `.argument('<${flag}>', ${escapedDesc})` };
	return {
		kind: 'option',
		line: `.option('--${flag} <value>', ${escapedDesc}${p.defaultValue ? `, ${p.defaultValue}` : ''})`,
	};
}

function buildNestedObjectLiteral(
	prefixPath: string[],
	allParams: ParamInfo[],
): string {
	const childKeys: string[] = [];
	for (const p of allParams) {
		if (
			p.path.length > prefixPath.length &&
			prefixPath.every((seg, i) => p.path[i] === seg)
		) {
			// biome-ignore lint/style/noNonNullAssertion: Guard above ensures prefixPath.length < p.path.length → index safe
			const key = p.path[prefixPath.length]!;
			if (!childKeys.includes(key)) childKeys.push(key);
		}
	}

	const fields = childKeys.map((key) => {
		const childPath = [...prefixPath, key];
		const leaf = allParams.find(
			(p) =>
				p.path.length === childPath.length &&
				p.path.every((seg, i) => seg === childPath[i]),
		);
		if (leaf) return `${key}: opts.${camelAccessorName(leaf)}`;
		return `${key}: ${buildNestedObjectLiteral(childPath, allParams)}`;
	});

	return `{ ${fields.join(', ')} }`;
}

function buildCallExpression(fnName: string, params: ParamInfo[]): string {
	const rootNames: string[] = [];
	for (const p of params) {
		// biome-ignore lint/style/noNonNullAssertion: p.path is non-empty — every param has at least one segment
		const rootName = p.path[0]!;
		if (!rootNames.includes(rootName)) rootNames.push(rootName);
	}

	const args = rootNames.map((root) => {
		const isNested = params.some(
			(p) => p.path[0] === root && p.path.length > 1,
		);
		if (isNested) return buildNestedObjectLiteral([root], params);

		const p = params.find((pp) => pp.path.length === 1 && pp.path[0] === root);
		if (!p)
			fail(fnName, `internal error: could not find root param "${root}".`);
		const built = buildArgOrOption(p);
		return built.kind === 'argument' ? root : `opts.${camelAccessorName(p)}`;
	});

	return `${fnName}(${args.join(', ')})`;
}

function buildActionSignature(params: ParamInfo[]): string {
	const positionalRoots = params
		.filter(
			(p) => p.path.length === 1 && buildArgOrOption(p).kind === 'argument',
		)
		.map((p) => p.path[0]);
	const hasOptions = params.some((p) => buildArgOrOption(p).kind === 'option');
	return [...positionalRoots, ...(hasOptions ? ['opts'] : [])].join(', ');
}

function buildCommandBlock(c: CommandInfo): string {
	const built = c.params.map((p) => ({ p, ...buildArgOrOption(p) }));
	const argLines = built
		.filter((b) => b.kind === 'argument')
		.map((b) => b.line);
	const optionLines = built
		.filter((b) => b.kind === 'option')
		.map((b) => b.line);

	const paramList = buildActionSignature(c.params);
	const callExpr = buildCallExpression(c.fnName, c.params);
	const awaitedCall = c.isAsync ? `await ${callExpr}` : callExpr;
	const actionKeyword = c.isAsync ? 'async ' : '';

	const exampleHelp = c.examples.length
		? `\n  .addHelpText('after', ${JSON.stringify(`\nExamples:\n${c.examples.map((e) => `  $ ${e}`).join('\n')}`)})`
		: '';

	return `program
  .command('${c.name}')${c.alias ? `\n  .alias('${c.alias}')` : ''}
  .description(${JSON.stringify(c.description)})
${[...argLines, ...optionLines].map((l) => `  ${l}`).join('\n')}${exampleHelp}
  .action(${actionKeyword}(${paramList}) => {
    const result = ${awaitedCall};
    if (result !== undefined) console.log(result);
  });`;
}

// NOTE: Entry point — read index.ts exports and generate CLI

function main(): void {
	if (!fs.existsSync(INDEX_PATH)) {
		throw new Error(
			`index.ts not found at ${INDEX_PATH} (cwd: ${process.cwd()})`,
		);
	}

	const project = new Project();
	const sourceFile = project.addSourceFileAtPath(INDEX_PATH);
	const exportedDecls = sourceFile.getExportedDeclarations();

	if (exportedDecls.size === 0) {
		throw new Error(
			`No exported declarations found in ${INDEX_PATH}. Use named re-exports, not export * from './y'.`,
		);
	}

	const commands: CommandInfo[] = [];

	for (const [exportName, decls] of exportedDecls) {
		const decl = decls[0];
		if (!decl || decl.getKind() !== SyntaxKind.FunctionDeclaration) continue;
		const fn = decl.asKindOrThrow(SyntaxKind.FunctionDeclaration);
		commands.push(extractCommandInfo(exportName, fn));
	}

	if (commands.length === 0) {
		throw new Error(
			'No documented function exports found. Nothing to generate.',
		);
	}

	const usesOptionOrArgumentClass = commands.some((c) =>
		c.params.some((p) => p.kind === 'enum'),
	);
	const imports = commands.map((c) => c.fnName).join(', ');

	const outputDir = path.dirname(OUTPUT_PATH);
	const indexNoExt = INDEX_PATH.replace(/\.ts$/, '');
	let relativeImport = path.relative(outputDir, indexNoExt).replace(/\\/g, '/');
	if (!relativeImport.startsWith('.')) relativeImport = `./${relativeImport}`;

	const commandBlocks = commands.map(buildCommandBlock).join('\n\n');
	const commanderImports = [
		'Command',
		...(usesOptionOrArgumentClass ? ['Option', 'Argument'] : []),
	].join(', ');

	const output = `// AUTO-GENERATED — do not edit by hand. Run \`bun run generate:cli\` to regenerate.
import { ${commanderImports} } from 'commander';
import { ${imports} } from '${relativeImport}';

export function registerCommands(program: Command): void {
${commandBlocks
	.split('\n')
	.map((l) => `  ${l}`)
	.join('\n')}
}
`;

	fs.mkdirSync(outputDir, { recursive: true });
	project.createSourceFile(OUTPUT_PATH, output, { overwrite: true });
	project.saveSync();

	if (!fs.existsSync(OUTPUT_PATH)) {
		throw new Error(
			`Expected ${OUTPUT_PATH} to exist after saveSync(), but it doesn't.`,
		);
	}

	console.log(
		`Generated ${commands.length} command(s) in ${path.relative(process.cwd(), OUTPUT_PATH)}`,
	);
}

main();
