import * as ts from 'typescript';
import {
  createOrExpression,
  createStringRepresentation,
  createValidatorCallExpression,
  nullCheck,
  typeOfCheck,
  validatorFunctionWrapper,
  returnFalseOrThrow,
} from './astHelpers';
import { TransformerContext } from './TransformerContext';

// constants for variable names used in generated code
const inputParamName = 'input';
const doNotThrowErrorsArg = 'noThrow';

/*
  Create and store a validation function for the type
*/
export function generateValidatorForType(
  node: ts.TypeNode,
  ctx: TransformerContext
): void {
  const { checker } = ctx;

  const typeName = node.getText();
  if (ctx.getValidatorForType(node)) {
    console.log('Found validator for ' + typeName);
    return;
  }

  // if the node is a primitive type, create a validator
  switch (node.kind) {
    case ts.SyntaxKind.StringKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      ctx.setValidatorForType(node, createPrimitiveValidator('string'));
      return;
    }
    case ts.SyntaxKind.BooleanKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      ctx.setValidatorForType(node, createPrimitiveValidator('boolean'));
      return;
    }
    case ts.SyntaxKind.NumberKeyword: {
      console.log('Creating primitive validator for ' + typeName);
      ctx.setValidatorForType(node, createPrimitiveValidator('number'));
      return;
    }
    case ts.SyntaxKind.LiteralType: {
      const literal = (node as ts.LiteralTypeNode).literal;
      switch (literal.kind) {
        case ts.SyntaxKind.NullKeyword: {
          console.log('Creating null validator for ' + typeName);
          ctx.setValidatorForType(
            node,
            validatorFunctionWrapper(typeName, [
              nullCheck(
                ts.factory.createBlock(
                  [ts.factory.createReturnStatement(ts.factory.createFalse())],
                  true
                )
              ),
            ])
          );
          return;
        }
        case ts.SyntaxKind.StringLiteral:
        case ts.SyntaxKind.NumericLiteral:
        case ts.SyntaxKind.TrueKeyword:
        case ts.SyntaxKind.FalseKeyword:
        default: {
          // TODO: validate other literal types
          console.warn('Unsupported literal type: ' + typeName);
        }
      }
      return;
    }
    case ts.SyntaxKind.TypeLiteral:
    case ts.SyntaxKind.TypeReference: {
      console.log('Creating object validator for ' + typeName);
      const type = checker.getTypeFromTypeNode(node);
      ctx.setValidatorForType(node, createObjectValidator(typeName, type, ctx));
      return;
    }
    default: {
      if (ts.isUnionTypeNode(node)) {
        ctx.setValidatorForType(node, createUnionValidator(node, ctx));
        return;
      } else if (ts.isArrayTypeNode(node)) {
        ctx.setValidatorForType(node, createArrayValidator(node, ctx));
        return;
      }

      console.warn('Unknown type node kind:', node.kind);
      console.log('Creating object validator for ' + typeName);

      const type = checker.getTypeFromTypeNode(node);
      ctx.setValidatorForType(node, createObjectValidator(typeName, type, ctx));
    }
  }
}

export function createUnionValidator(
  node: ts.UnionTypeNode,
  ctx: TransformerContext
): ts.FunctionDeclaration {
  console.log('Creating union validator for ' + node.getText());

  const typeName = node.getText();
  node.types.forEach((type) => generateValidatorForType(type, ctx));

  const [firstType, ...otherTypes] = node.types;

  // create "if (validateA() || validateB() || validateC() ..."
  const statements = otherTypes.reduce<ts.Expression>(
    (validations, type): ts.Expression => {
      const validator = ctx.getValidatorForType(type);
      return createOrExpression(
        createValidatorCallExpression(validator, [
          ts.factory.createIdentifier(inputParamName),
          ts.factory.createTrue(),
        ]),
        validations
      );
    },
    createValidatorCallExpression(ctx.getValidatorForType(firstType), [
      ts.factory.createIdentifier(inputParamName),
      ts.factory.createTrue(),
    ])
  );

  return validatorFunctionWrapper(typeName, [
    ts.factory.createIfStatement(
      statements,
      ts.factory.createBlock(
        [ts.factory.createReturnStatement(ts.factory.createTrue())],
        true
      ),
      ts.factory.createBlock([
        returnFalseOrThrow(
          ts.factory.createBinaryExpression(
            ts.factory.createStringLiteral(
              `Value is not of type ${node.getText()}: `
            ),
            ts.factory.createToken(ts.SyntaxKind.PlusToken),
            ts.factory.createIdentifier(inputParamName)
          )
        ),
      ])
    ),
  ]);
}

export function createArrayValidator(
  node: ts.ArrayTypeNode,
  ctx: TransformerContext
): ts.FunctionDeclaration {
  const typeName = node.getText();
  console.log('Creating array validator for ' + typeName);

  // make sure we have a validator for whatever the elements of the array are
  generateValidatorForType(node.elementType, ctx);

  const check = ts.factory.createIfStatement(
    ts.factory.createBinaryExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('Array'),
          ts.factory.createIdentifier('isArray')
        ),
        undefined,
        [ts.factory.createIdentifier('input')]
      ),
      ts.factory.createToken(ts.SyntaxKind.AmpersandAmpersandToken),
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('input'),
          ts.factory.createIdentifier('every')
        ),
        undefined,
        [
          ts.factory.createArrowFunction(
            undefined,
            undefined,
            [
              ts.factory.createParameterDeclaration(
                undefined,
                undefined,
                undefined,
                ts.factory.createIdentifier('i'),
                undefined,
                undefined,
                undefined
              ),
            ],
            undefined,
            ts.factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
            createValidatorCallExpression(
              ctx.getValidatorForType(node.elementType),
              [ts.factory.createIdentifier('i'), ts.factory.createTrue()]
            )
          ),
        ]
      )
    ),
    ts.factory.createBlock(
      [ts.factory.createReturnStatement(ts.factory.createTrue())],
      true
    ),
    ts.factory.createBlock([
      returnFalseOrThrow(
        ts.factory.createBinaryExpression(
          ts.factory.createStringLiteral(`Not of type ${node.getText()}: `),
          ts.factory.createToken(ts.SyntaxKind.PlusToken),
          createStringRepresentation(inputParamName)
        )
      ),
    ])
  );

  return validatorFunctionWrapper(typeName, [check]);
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

    throw new Error(
      'Unknown property type: ' + prop.valueDeclaration.getText()
    );
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
        returnFalseOrThrow(
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
  const validator = ctx.getValidatorForProperty(property);
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
      ts.factory.createIdentifier(doNotThrowErrorsArg),
    ])
  );

  const throwIfNotOptional = property.questionToken
    ? undefined
    : ts.factory.createBlock([
        returnFalseOrThrow(
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
  const throwErrorStatement = returnFalseOrThrow(
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

function validateProperty(
  property: ts.PropertySignature,
  ctx: TransformerContext
): void {
  console.log('Validating property', property.getText());
  if (!property.type) {
    console.error('No type found for ', property.getText());
    return;
  }

  generateValidatorForType(property.type, ctx);
}
