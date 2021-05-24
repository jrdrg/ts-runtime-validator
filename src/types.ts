import * as ts from 'typescript';

type ValidatorCache = Record<string, ts.FunctionDeclaration>;

export type TransformerContext = {
  checker: ts.TypeChecker;
  validatorsByType: ValidatorCache;
};
