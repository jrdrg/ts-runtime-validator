import ts from 'typescript';

export function getPropertyName(property: ts.PropertySignature) {
  return property.type?.getText() || '';
}

export function getFunctionName(func: ts.FunctionDeclaration) {
  if (!func.name) {
    throw new Error('No name identifier for function');
  }
  return func.name.text;
}

export function isValidatorFunction(functionName: string) {
  return functionName === 'validateType';
}

export function validatorFunctionName(type: string) {
  const typeName = type
    .replace(/\s*/g, '')
    .replace(/[\{\}\:]/g, '$')
    .replace(/[,\;]/g, '_')
    .replace(/([A-z]+)\[\]/g, '$1Array')
    .replace(/\[([A-z]+)\]/g, 'T$1T');
  return `validate__${typeName}`;
}
