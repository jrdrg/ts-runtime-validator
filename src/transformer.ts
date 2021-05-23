import * as ts from 'typescript';

// export const transformNode = (
//   node: ts.Node,
//   visitor: ts.Visitor | undefined
// ) => {};

// export const transformer: ts.TransformerFactory<ts.SourceFile> = (ctx) => {
//   return (sourceFile) => {
//     const visitor: ts.Visitor = <T>(node: ts.Node): ts.VisitResult<ts.Node> => {
//       console.log('NODE', node);
//       return ts.visitEachChild(node, visitor, ctx);
//     };
//     return ts.visitNode(sourceFile, visitor);
//   };
// };

function validatorFunctionName(type: string) {
  return `validate__${type}`;
}

function createPrimitiveValidatorFn(type: 'string' | 'boolean' | 'number') {
  return ts.factory.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.factory.createIdentifier(`generateValidator__${type}`),
    undefined,
    [],
    undefined,
    ts.factory.createBlock(
      [
        ts.factory.createReturnStatement(
          ts.factory.createFunctionExpression(
            undefined,
            undefined,
            ts.factory.createIdentifier(validatorFunctionName(type)),
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                ts.factory.createIdentifier('value'),
                undefined,
                ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
                undefined
              ),
            ],
            undefined,
            ts.factory.createBlock(
              [
                ts.factory.createIfStatement(
                  ts.factory.createBinaryExpression(
                    ts.factory.createTypeOfExpression(
                      ts.factory.createIdentifier('value')
                    ),
                    ts.factory.createToken(
                      ts.SyntaxKind.EqualsEqualsEqualsToken
                    ),
                    ts.factory.createStringLiteral('string')
                  ),
                  ts.factory.createBlock(
                    [ts.factory.createReturnStatement(ts.factory.createTrue())],
                    true
                  ),
                  undefined
                ),
                ts.factory.createThrowStatement(
                  ts.factory.createNewExpression(
                    ts.factory.createIdentifier('Error'),
                    undefined,
                    [
                      ts.factory.createBinaryExpression(
                        ts.factory.createBinaryExpression(
                          ts.factory.createStringLiteral("Value '"),
                          ts.factory.createToken(ts.SyntaxKind.PlusToken),
                          ts.factory.createIdentifier('value')
                        ),
                        ts.factory.createToken(ts.SyntaxKind.PlusToken),
                        ts.factory.createStringLiteral(
                          "' is not a " + type.toString()
                        )
                      ),
                    ]
                  )
                ),
              ],
              true
            )
          )
        ),
      ],
      true
    )
  );
}

function createPrimitiveValidator(type: 'string' | 'number' | 'boolean') {
  return ts.factory.createFunctionDeclaration(
    undefined,
    undefined,
    undefined,
    ts.factory.createIdentifier(validatorFunctionName(type)),
    undefined,
    [
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier('value'),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        undefined
      ),
    ],
    undefined,
    ts.factory.createBlock(
      [
        ts.factory.createIfStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createTypeOfExpression(
              ts.factory.createIdentifier('value')
            ),
            ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
            ts.factory.createStringLiteral(type)
          ),
          ts.factory.createBlock(
            [ts.factory.createReturnStatement(ts.factory.createTrue())],
            true
          ),
          undefined
        ),
        ts.factory.createThrowStatement(
          ts.factory.createNewExpression(
            ts.factory.createIdentifier('Error'),
            undefined,
            [
              ts.factory.createBinaryExpression(
                ts.factory.createBinaryExpression(
                  ts.factory.createStringLiteral("Value '"),
                  ts.factory.createToken(ts.SyntaxKind.PlusToken),
                  ts.factory.createIdentifier('value')
                ),
                ts.factory.createToken(ts.SyntaxKind.PlusToken),
                ts.factory.createStringLiteral("' is not a " + type.toString())
              ),
            ]
          )
        ),
      ],
      true
    )
  );
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

  console.log(
    'Transforming files:',
    program
      .getSourceFiles()
      .map((f) => f.fileName)
      .filter((name) => name.includes('src'))
  );

  const validatorsByType: Record<string, ts.Statement> = {};

  const checker = program.getTypeChecker();

  function validateProperty(property: ts.PropertySignature) {
    console.log('Validating property', property.getText());

    const propType = property.type.getText();
    if (validatorsByType[propType]) {
      return validatorsByType[propType];
    }

    if (property.type.kind === ts.SyntaxKind.StringKeyword) {
      console.log('Creating string validator for ', propType);
      validatorsByType[propType] = createPrimitiveValidatorFn('string');
    }

    return validatorsByType[propType];
  }

  function visitTypeNode(node: ts.TypeNode) {
    const typeName = node.getText();
    if (validatorsByType[typeName]) {
      console.log('Found validator for ' + typeName);
      return validatorsByType[typeName];
    }

    const type = checker.getTypeFromTypeNode(node);

    switch (node.kind) {
      case ts.SyntaxKind.StringKeyword: {
        console.log('Creating primitive validator for ' + node.getText());
        validatorsByType[typeName] = createPrimitiveValidatorFn('string');
        return;
      }
      case ts.SyntaxKind.BooleanKeyword: {
        console.log('Creating primitive validator for ' + node.getText());
        validatorsByType[typeName] = createPrimitiveValidatorFn('boolean');
        return;
      }
      case ts.SyntaxKind.NumberKeyword: {
        console.log('Creating primitive validator for ' + node.getText());
        validatorsByType[typeName] = createPrimitiveValidatorFn('number');
        return;
      }
      default: {
        console.log('Type node kind:', node.kind);
      }
    }

    console.log('TYPE NODE', typeName);
    console.log('type properties', type.getProperties());

    type.getProperties().forEach((prop) => {
      console.log('prop kind', prop.valueDeclaration.kind);
      if (ts.isPropertySignature(prop.valueDeclaration)) {
        return validateProperty(prop.valueDeclaration);
      }

      console.log('Unknown property type', prop.valueDeclaration.getText());
    });

    // FIXME
    console.log('FIXME, creating validator for ' + node.getText());
    validatorsByType[typeName] = createPrimitiveValidator('boolean');
  }

  function visitImportDeclaration(node: ts.ImportDeclaration) {
    console.log('IMPORT', node);
    const importIdentifier = node.importClause?.name;
    const symbol = checker.getSymbolAtLocation(importIdentifier);

    console.log('IMPORTSYMBOL', symbol);

    const modSpec = checker.getSymbolAtLocation(node.moduleSpecifier);
    console.log('MODSPEC', modSpec);
  }

  // Transformer factory
  return (ctx) => (sourceFile) => {
    const visitor: ts.Visitor = <T>(node: ts.Node): ts.VisitResult<ts.Node> => {
      console.log('NODE', ts.SyntaxKind[node.kind], '__', node.getText());

      if (ts.isImportDeclaration(node)) {
        visitImportDeclaration(node);
        //
      } else if (ts.isCallExpression(node)) {
        console.log('CALLEXPRESSION', node);
        const signature = checker.getResolvedSignature(node);

        console.log('SIGNATURE', signature);

        const name = checker
          .getTypeAtLocation(signature.getDeclaration())
          .getSymbol()
          .getName();

        console.log('FN NAME', name, name === 'generateValidator');

        if (name === 'generateValidator') {
          const typeArg = node.typeArguments[0];
          const type = checker.getTypeFromTypeNode(typeArg);
          const typeName = typeArg.getText();

          console.log('TYPE ARGS', type);
          console.log('TYPE ARGS NAME', typeArg.getText());

          visitTypeNode(typeArg);

          const validatorForType = validatorsByType[typeName];

          console.log(
            'Validator: ',
            validatorForType,
            'All validators:',
            validatorsByType
          );

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
        //
      } else if (ts.isTypeLiteralNode(node)) {
        console.log('Type Literal: ', node.getText());
        // visitTypeNode(node);
      } else if (ts.isTypeReferenceNode(node)) {
        console.log('Type Reference: ', node.getText());
        visitTypeNode(node);
      } else if (ts.isImportSpecifier(node)) {
        //
      } else if (ts.isNamedImports(node)) {
        //
      }

      return ts.visitEachChild(node, visitor, ctx);
    };
    const transformed = ts.visitNode(sourceFile, visitor);

    const validationFunctions = Object.values(validatorsByType);

    const result = ts.factory.updateSourceFile(
      transformed,
      [...validationFunctions, ...transformed.statements],
      transformed.isDeclarationFile,
      transformed.referencedFiles,
      transformed.typeReferenceDirectives,
      transformed.hasNoDefaultLib,
      transformed.libReferenceDirectives
    );

    console.log('VALIDATORS', validatorsByType);

    console.log('RESULT', result);

    return result;
  };
}
