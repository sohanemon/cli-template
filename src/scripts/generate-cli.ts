import path from 'node:path';
import { Project, SyntaxKind } from 'ts-morph';

const project = new Project();
const sourceFile = project.addSourceFileAtPath(path.resolve('src/index.ts'));

type ParamInfo = { name: string; type: string; optional: boolean };
type CmdInfo = {
	name: string;
	description: string;
	fnName: string;
	params: ParamInfo[];
};

const commands: CmdInfo[] = [];

// Resolves through re-exports to the actual function declaration
const exportedDecls = sourceFile.getExportedDeclarations();

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
		fnName: exportName, // use the name as exported from index.ts, not the original decl name
		params,
	});
}
