import * as ts from 'typescript';
import { TransformerContext } from './TransformerContext';
import { isValidatorFunction, validatorFunctionName } from './utils';
import { createValidatorForType } from './validators';

function visitImportDeclaration(
  node: ts.ImportDeclaration,
  { checker }: TransformerContext
): void {
  console.log('IMPORT', node.getText());
  const importIdentifier = node.importClause?.name;
  if (!importIdentifier) {
    console.error('No import identifier');
    return;
  }

  const symbol = checker.getSymbolAtLocation(importIdentifier);

  console.log('IMPORTSYMBOL', symbol?.getName());

  const modSpec = checker.getSymbolAtLocation(node.moduleSpecifier);
  console.log('Module specifier', modSpec);
}

function replaceValidationFunction(
  node: ts.CallExpression,
  ctx: TransformerContext
) {
  const { checker } = ctx;
  const typeArg = node.typeArguments?.[0];

  if (!typeArg) {
    console.error('Invalid call of validation function:', node.getText());
    return node;
  }

  const typeName = typeArg.getText();

  createValidatorForType(typeArg, ctx);

  const callExp = ts.factory.createCallExpression(
    ts.factory.createIdentifier(validatorFunctionName(typeName)),
    [],
    node.arguments
  );

  console.log('CALLEXP', callExp);

  return callExp;
}

export default function createTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  /*
  create a map of typename to validator
  for each node
  - if it's "validateType"
    - figure out the type it's validating
    - check if the validator exists in the map
    - if not, create it and store in the map
    - update the import statement to point to wherever the generated validator module is
  */

  // console.log(
  //   'Transforming files:',
  //   program
  //     .getSourceFiles()
  //     .map((f) => f.fileName)
  //     .filter((name) => name.includes('src'))
  // );

  const validatorsByType: Record<string, ts.FunctionDeclaration> = {};
  const checker = program.getTypeChecker();

  const transformerCtx = new TransformerContext({ checker, validatorsByType });

  // Transformer factory
  return (ctx) => (sourceFile) => {
    const visitor: ts.Visitor = (node: ts.Node): ts.VisitResult<ts.Node> => {
      if (ts.isImportDeclaration(node)) {
        visitImportDeclaration(node, transformerCtx);
        //
      } else if (ts.isCallExpression(node)) {
        const signature = checker.getResolvedSignature(node);

        if (!signature) {
          return ts.visitEachChild(node, visitor, ctx);
        }

        const name =
          checker
            .getTypeAtLocation(signature?.getDeclaration())
            .getSymbol()
            ?.getName() || '<unknown>';

        console.log('FN NAME', name, isValidatorFunction(name));

        if (isValidatorFunction(name)) {
          return replaceValidationFunction(node, transformerCtx);
        }
        //
      } else if (ts.isTypeLiteralNode(node)) {
        console.log('Type Literal: ', node.getText());
        // createValidatorForType(node);
      } else if (ts.isTypeReferenceNode(node)) {
        console.log('Type Reference: ', node.getText());
        // createValidatorForType(node);
      } else if (ts.isImportSpecifier(node)) {
        //
      } else if (ts.isNamedImports(node)) {
        //
      }

      return ts.visitEachChild(node, visitor, ctx);
    };

    const transformed = ts.visitNode(sourceFile, visitor);

    const validationFunctions = Object.values(validatorsByType);

    const result = ctx.factory.updateSourceFile(
      transformed,
      [...validationFunctions, ...transformed.statements],
      transformed.isDeclarationFile,
      transformed.referencedFiles,
      transformed.typeReferenceDirectives,
      transformed.hasNoDefaultLib,
      transformed.libReferenceDirectives
    );

    return result;
  };
}
