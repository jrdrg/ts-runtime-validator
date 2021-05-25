import * as ts from 'typescript';
import { TransformerContext } from './types';
import { isValidatorFunction, validatorFunctionName } from './utils';
import {
  createPrimitiveValidator,
  createPropertyValidator,
  createObjectAssertion,
} from './validators';

// validate a complex type
function createObjectValidator(
  typeName: string,
  type: ts.Type,
  ctx: TransformerContext
): ts.FunctionDeclaration {
  const inputParamName = 'input';

  // store all the property validators in the cache if they aren't there already
  type.getProperties().forEach((prop) => {
    if (ts.isPropertySignature(prop.valueDeclaration)) {
      return validateProperty(prop.valueDeclaration, ctx);
    }

    console.log('Unknown property type', prop.valueDeclaration.getText());
  });

  const propValidationStatements = type
    .getProperties()
    .map((prop) => {
      if (!ts.isPropertySignature(prop.valueDeclaration)) {
        return null;
      }
      return createPropertyValidator(
        prop.valueDeclaration,
        inputParamName,
        prop.getName(),
        ctx
      );
    })
    .filter((validator): validator is ts.IfStatement => !!validator);

  return ts.factory.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.factory.createIdentifier(validatorFunctionName(typeName)),
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier(inputParamName),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.UnknownKeyword),
        undefined
      ),
    ],
    undefined,
    ts.factory.createBlock(
      [createObjectAssertion('input'), ...propValidationStatements],
      true
    )
  );
}

function validateProperty(
  property: ts.PropertySignature,
  ctx: TransformerContext
): void {
  console.log('Validating property', property.getText());
  if (!property.type) {
    console.error('No type found for ', property.getText());
    return;
  }

  visitTypeNode(property.type, ctx);
}

// create and store a validator for the type
function visitTypeNode(node: ts.TypeNode, ctx: TransformerContext): void {
  const { checker, validatorsByType } = ctx;

  const typeName = node.getText();
  if (validatorsByType[typeName]) {
    console.log('Found validator for ' + typeName);
    return;
  }

  const type = checker.getTypeFromTypeNode(node);

  // if the node is a primitive type, create a validator
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      validatorsByType[typeName] = createPrimitiveValidator('string');
      return;
    }
    case ts.SyntaxKind.BooleanKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      validatorsByType[typeName] = createPrimitiveValidator('boolean');
      return;
    }
    case ts.SyntaxKind.NumberKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      validatorsByType[typeName] = createPrimitiveValidator('number');
      return;
    }
    default: {
      console.log('Type node kind:', node.kind);
    }
  }

  console.log('Creating object validator for ' + typeName);
  validatorsByType[typeName] = createObjectValidator(typeName, type, ctx);
}

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

  const transformerCtx = { checker, validatorsByType };

  function replaceValidationFunction(node: ts.CallExpression) {
    const typeArg = node.typeArguments?.[0];

    if (!typeArg) {
      console.error('Invalid call of validation function:', node.getText());
      return node;
    }

    const type = checker.getTypeFromTypeNode(typeArg);
    const typeName = typeArg.getText();

    visitTypeNode(typeArg, transformerCtx);

    const callExp = ts.factory.createCallExpression(
      ts.factory.createIdentifier(validatorFunctionName(typeName)),
      [],
      node.arguments
    );

    console.log('CALLEXP', callExp);

    return callExp;
    // return ts.factory.updateCallExpression(
    //   node,
    //   // node.expression,
    //   callExp,
    //   node.typeArguments,
    //   node.arguments
    // );
  }

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
          return replaceValidationFunction(node);
        }
        //
      } else if (ts.isTypeLiteralNode(node)) {
        console.log('Type Literal: ', node.getText());
        // visitTypeNode(node);
      } else if (ts.isTypeReferenceNode(node)) {
        console.log('Type Reference: ', node.getText());
        // visitTypeNode(node);
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
