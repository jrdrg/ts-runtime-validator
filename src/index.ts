import * as ts from 'typescript';

export function generateValidator<T>() {
  return function validate(input: unknown) {};
}
