import * as ts from 'typescript';

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

  getValidatorForType(type: ts.TypeNode) {
    return this.validatorsByType[type.getText()];
  }

  setValidatorForType(type: ts.TypeNode, validator: ts.FunctionDeclaration) {
    this.validatorsByType[type.getText()] = validator;
  }
}
