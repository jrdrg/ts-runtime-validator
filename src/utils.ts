import ts from 'typescript';

import { TransformerContext } from './TransformerContext';

export function getPropertyTypeName(property: ts.PropertySignature) {
  return property.type?.getText() || '';
}

export function getFunctionName(func: ts.FunctionDeclaration) {
  if (!func.name) {
    throw new Error('No name identifier for function');
  }
  return func.name.text;
}

/**
 * Returns true if the function is the one that should be replaced
 * by the transformer
 *
 * @param functionName The function name to check
 * @returns
 */
export function isValidatorFunction(functionName: string) {
  return functionName === 'validateType';
}

/**
 * Replaces invalid characters in a type definition so that the
 * returned string can be used as a function identifier.
 *
 * @param type The string representation of a type, like "string", "number[]", "{ foo: boolean }"
 * @returns
 */
export function validatorFunctionName(type: string) {
  const typeName = type
    .replace(/\&/g, 'AND')
    .replace(/\|/g, 'OR')
    .replace(/\?/g, 'O')
    .replace(/\s*/g, '')
    .replace(/(\{.*?\})\[\]/g, '$1Array')
    .replace(/[\{\}\:]/g, '$')
    .replace(/[,\;]/g, '_')
    .replace(/([A-z]+)\[\]/g, '$1Array')
    .replace(/\[([A-z]+)\]/g, 'T$1T');
  return `validate__${typeName}`;
}
