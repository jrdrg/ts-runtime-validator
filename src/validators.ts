import * as ts from 'typescript';
import { TransformerContext } from './types';
import {
  getFunctionName,
  getPropertyName,
  validatorFunctionName,
} from './utils';

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
        ts.factory.createThrowStatement(
          ts.factory.createNewExpression(
            ts.factory.createIdentifier('Error'),
            undefined,
            [
              ts.factory.createBinaryExpression(
                ts.factory.createStringLiteral('Not an object: '),
                ts.factory.createToken(ts.SyntaxKind.PlusToken),
                ts.factory.createIdentifier(paramName)
              ),
            ]
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
  inputParam: string,
  propertyName: string,
  ctx: TransformerContext
): ts.IfStatement {
  const propertyTypeName = getPropertyName(property);

  const validator = ctx.validatorsByType[propertyTypeName];
  if (!validator) {
    throw new Error(
      `Failed to find a validator for ${inputParam}.${propertyName}`
    );
  }

  const functionName = getFunctionName(validator);

  return ts.factory.createIfStatement(
    ts.factory.createCallExpression(
      ts.factory.createPropertyAccessExpression(
        ts.factory.createIdentifier(inputParam),
        ts.factory.createIdentifier('hasOwnProperty')
      ),
      undefined,
      [ts.factory.createStringLiteral(propertyName)]
    ),
    ts.factory.createBlock(
      [
        ts.factory.createExpressionStatement(
          ts.factory.createCallExpression(
            ts.factory.createIdentifier(functionName),
            undefined,
            [
              ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(inputParam),
                ts.factory.createIdentifier(propertyName)
              ),
            ]
          )
        ),
      ],
      true
    ),
    undefined
  );
}

export function createPrimitiveValidator(
  type: 'string' | 'number' | 'boolean'
): ts.FunctionDeclaration {
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
