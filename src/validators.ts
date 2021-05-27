import * as ts from 'typescript';
import { TransformerContext } from './TransformerContext';
import {
  getFunctionName,
  getPropertyTypeName,
  validatorFunctionName,
} from './utils';

const inputParamName = 'input';

/*
  Create and store a validation function for the type
*/
export function createValidatorForType(
  node: ts.TypeNode,
  ctx: TransformerContext
): void {
  const { checker, validatorsByType } = ctx;

  const typeName = node.getText();
  if (ctx.getValidatorForType(node)) {
    console.log('Found validator for ' + typeName);
    return;
  }

  const type = checker.getTypeFromTypeNode(node);

  // if the node is a primitive type, create a validator
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      ctx.setValidatorForType(node, createPrimitiveValidator('string'));
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
    case ts.SyntaxKind.LiteralType: {
      const literal = (node as ts.LiteralTypeNode).literal;
      if (literal.kind === ts.SyntaxKind.NullKeyword) {
        console.log('Creating null validator for ' + typeName);
        validatorsByType[typeName] = validatorFunctionWrapper(typeName, [
          nullCheck(),
        ]);
      }
      return;
    }
    default: {
      console.log('Type node kind:', node.kind);
    }
  }

  if (ts.isUnionTypeNode(node)) {
    validatorsByType[typeName] = createUnionValidator(node, ctx);
    return;
  }

  console.log('Creating object validator for ' + typeName);
  validatorsByType[typeName] = createObjectValidator(typeName, type, ctx);
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

  createValidatorForType(property.type, ctx);
}

export function createUnionValidator(
  node: ts.UnionTypeNode,
  ctx: TransformerContext
): ts.FunctionDeclaration {
  console.log('Creating union validator for ' + node.getText());

  const typeName = node.getText();
  console.log('types', node.types);
  node.types.forEach((type) => createValidatorForType(type, ctx));

  const statements = node.types.reduce<ts.Expression>(
    (validations, type): ts.Expression => {
      const validator = ctx.getValidatorForType(type);
      if (validations) {
        return ts.factory.createBinaryExpression(
          createValidatorCallExpression(validator, [
            ts.factory.createIdentifier(inputParamName),
          ]),
          ts.factory.createToken(ts.SyntaxKind.BarBarToken),
          validations
        );
      }
      return createValidatorCallExpression(validator, [
        ts.factory.createIdentifier(inputParamName),
      ]);
    },
    null as any // this is somewhat hacky
  );

  const performCheck = ts.factory.createIfStatement(
    statements,
    ts.factory.createBlock(
      [ts.factory.createReturnStatement(ts.factory.createTrue())],
      true
    ),
    undefined
  );

  return validatorFunctionWrapper(typeName, [performCheck]);
}

/*
  Create a validation function for a complex type
*/
export function createObjectValidator(
  typeName: string,
  type: ts.Type,
  ctx: TransformerContext
): ts.FunctionDeclaration {
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
        ctx
      );
    })
    .filter((validator): validator is ts.IfStatement => !!validator);

  return validatorFunctionWrapper(typeName, [
    createObjectAssertion('input'),
    ...propValidationStatements,
  ]);
}

/*
  if (typeof <paramName> !== 'object') { throw new Error("Not an object: " + <paramName>); }
*/
export function createObjectAssertion(paramName: string) {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(ts.factory.createIdentifier(paramName)),
      ts.factory.createToken(ts.SyntaxKind.ExclamationEqualsEqualsToken),
      ts.factory.createStringLiteral('object')
    ),
    ts.factory.createBlock(
      [
        createThrowErrorStatement(
          ts.factory.createBinaryExpression(
            ts.factory.createStringLiteral('Not an object: '),
            ts.factory.createToken(ts.SyntaxKind.PlusToken),
            ts.factory.createIdentifier(paramName)
          )
        ),
      ],
      true
    ),
    undefined
  );
}

/*
  if (<inputParam>.hasOwnProperty(<propertyName>)) { <validate> }
*/
export function createPropertyValidator(
  property: ts.PropertySignature,
  parentObjectName: string,
  ctx: TransformerContext
): ts.IfStatement {
  const propertyName = property.name.getText();
  const propertyTypeName = getPropertyTypeName(property);

  const validator = ctx.validatorsByType[propertyTypeName];
  if (!validator) {
    throw new Error(
      `Failed to find a validator for ${parentObjectName}.${propertyName}`
    );
  }

  const callValidatorFunction = ts.factory.createExpressionStatement(
    createValidatorCallExpression(validator, [
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(parentObjectName),
        ts.factory.createIdentifier(propertyName)
      ),
    ])
  );

  const throwIfNotOptional = property.questionToken
    ? undefined
    : ts.factory.createBlock([
        createThrowErrorStatement(
          ts.factory.createStringLiteral(
            `Required field is missing: ${propertyName}`
          )
        ),
      ]);

  return ts.factory.createIfStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(parentObjectName),
        ts.factory.createIdentifier('hasOwnProperty')
      ),
      undefined,
      [ts.factory.createStringLiteral(propertyName)]
    ),
    ts.factory.createBlock([callValidatorFunction], true),
    throwIfNotOptional
  );
}

/*
  Creates a validation function for a primitive type
*/
export function createPrimitiveValidator(
  type: 'string' | 'number' | 'boolean'
): ts.FunctionDeclaration {
  const throwErrorStatement = createThrowErrorStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createBinaryExpression(
        ts.factory.createStringLiteral("Value '"),
        ts.factory.createToken(ts.SyntaxKind.PlusToken),
        ts.factory.createIdentifier('input')
      ),
      ts.factory.createToken(ts.SyntaxKind.PlusToken),
      ts.factory.createStringLiteral("' is not a " + type.toString())
    )
  );

  return validatorFunctionWrapper(type, [
    typeOfCheck(type),
    throwErrorStatement,
  ]);
}

function validatorFunctionWrapper(
  typeName: string,
  statements: ts.Statement[]
) {
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
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
        undefined
      ),
    ],
    undefined,
    ts.factory.createBlock(statements, true)
  );
}

function createValidatorCallExpression(
  validator: ts.FunctionDeclaration,
  args: ts.Expression[]
) {
  const functionName = getFunctionName(validator);

  return ts.factory.createCallExpression(
    ts.factory.createIdentifier(functionName),
    undefined,
    args
  );
}

function createThrowErrorStatement(...expressions: ts.Expression[]) {
  return ts.factory.createThrowStatement(
    ts.factory.createNewExpression(
      ts.factory.createIdentifier('Error'),
      undefined,
      expressions
    )
  );
}

export function nullCheck(elseBlock?: ts.Block): ts.IfStatement {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createIdentifier(inputParamName),
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      ts.factory.createNull()
    ),
    ts.factory.createBlock(
      [ts.factory.createReturnStatement(ts.factory.createTrue())],
      true
    ),
    elseBlock
  );
}

function typeOfCheck(
  type: 'string' | 'number' | 'boolean' | 'object',
  elseBlock?: ts.Block
) {
  return ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createTypeOfExpression(
        ts.factory.createIdentifier(inputParamName)
      ),
      ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
      ts.factory.createStringLiteral(type)
    ),
    ts.factory.createBlock(
      [ts.factory.createReturnStatement(ts.factory.createTrue())],
      true
    ),
    elseBlock
  );
}
