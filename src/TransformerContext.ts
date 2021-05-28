import * as ts from 'typescript';

import { getPropertyTypeName } from './utils';

type ValidatorCache = Record<string, ts.FunctionDeclaration>;

export class TransformerContext {
  checker: ts.TypeChecker;
  validatorsByType: ValidatorCache;

  constructor(args: {
    checker: ts.TypeChecker;
    validatorsByType: ValidatorCache;
  }) {
    this.checker = args.checker;
    this.validatorsByType = args.validatorsByType;
  }

  getValidatorForType(node: ts.TypeNode) {
    return this.validatorsByType[node.getText()];
  }

  getValidatorForProperty(property: ts.PropertySignature) {
    return this.validatorsByType[getPropertyTypeName(property)];
  }

  setValidatorForType(node: ts.TypeNode, validator: ts.FunctionDeclaration) {
    this.validatorsByType[node.getText()] = validator;
  }
}
