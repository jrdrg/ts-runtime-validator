import * as ts from 'typescript';

import { getFunctionName, validatorFunctionName } from './utils';

// constants for variable names used in generated code
const inputParamName = 'input';
const doNotThrowErrorsArg = 'noThrow';

/*
  function <name>(input, doNotThrow) { <statements> }
*/
export function validatorFunctionWrapper(
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
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        undefined,
        ts.factory.createIdentifier(doNotThrowErrorsArg),
        undefined,
        ts.factory.createKeywordTypeNode(ts.SyntaxKind.BooleanKeyword),
        undefined
      ),
    ],
    undefined,
    ts.factory.createBlock(statements, true)
  );
}

export function createOrExpression(left: ts.Expression, right: ts.Expression) {
  return ts.factory.createBinaryExpression(
    left,
    ts.factory.createToken(ts.SyntaxKind.BarBarToken),
    right
  );
}

export function createValidatorCallExpression(
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

export function returnFalseOrThrow(...expressions: ts.Expression[]) {
  return ts.factory.createIfStatement(
    ts.factory.createPrefixUnaryExpression(
      ts.SyntaxKind.ExclamationToken,
      ts.factory.createPrefixUnaryExpression(
        ts.SyntaxKind.ExclamationToken,
        ts.factory.createIdentifier(doNotThrowErrorsArg)
      )
    ),
    ts.factory.createBlock([
      ts.factory.createReturnStatement(ts.factory.createFalse()),
    ]),
    ts.factory.createBlock([createThrowErrorStatement(...expressions)])
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

export function typeOfCheck(
  type: 'string' | 'number' | 'boolean' | 'object',
  elseBlock?: ts.Block
): ts.IfStatement {
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

export function createStringRepresentation(inputParam: string) {
  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(
      ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(
          ts.factory.createIdentifier('JSON'),
          ts.factory.createIdentifier('stringify')
        ),
        undefined,
        [ts.factory.createIdentifier(inputParam)]
      ),
      ts.factory.createIdentifier('substring')
    ),
    undefined,
    [
      ts.factory.createNumericLiteral('0'),
      ts.factory.createNumericLiteral('20'),
    ]
  );
}
