import * as ts from 'typescript';

// export const transformNode = (
//   node: ts.Node,
//   visitor: ts.Visitor | undefined
// ) => {};

// export const transformer: ts.TransformerFactory<ts.SourceFile> = (ctx) => {
//   return (sourceFile) => {
//     const visitor: ts.Visitor = <T>(node: ts.Node): ts.VisitResult<ts.Node> => {
//       console.log('NODE', node);
//       return ts.visitEachChild(node, visitor, ctx);
//     };
//     return ts.visitNode(sourceFile, visitor);
//   };
// };

export default function createTransformer(
  program: ts.Program
): ts.TransformerFactory<ts.SourceFile> {
  /*
create a map of typename to validator
for each node
- if it's "generateValidator"
    - figure out the type it's validating
    - check if the validator exists in the map
    - if not, create it and store in the map
    - update the import statement to point to wherever the generated validator module is
*/

  console.log(
    'FILES',
    program
      .getSourceFiles()
      .map((f) => f.fileName)
      .filter((name) => name.includes('src'))
  );

  const validatorsByType = {};

  const checker = program.getTypeChecker();

  function visitImportDeclaration(node: ts.ImportDeclaration) {
    console.log('IMPORT', node);
    const importIdentifier = node.importClause?.name;
    const symbol = checker.getSymbolAtLocation(importIdentifier);

    console.log('IMPORTSYMBOL', symbol);

    const modSpec = checker.getSymbolAtLocation(node.moduleSpecifier);
    console.log('MODSPEC', modSpec);
  }

  function validateType(type: ts.Type) {
    console.log('type properties', type.getProperties());

    const createValidator = (symbol: ts.Symbol) => {
      console.log('S', symbol);
    };

    createValidator(type.getSymbol());
  }

  // generateValidator<Foo>();  // 'Foo'
  function visitTypeReference(node: ts.TypeReferenceNode) {
    const name = node.getText();
    console.log('- TYPE REFERENCE', name);

    const typename = checker.getTypeFromTypeNode(node);
    // console.log('CHECKER TYPENAME', typename);

    console.log('SYMBOL', typename.symbol);

    const type = checker.getTypeFromTypeNode(node);
    console.log('TYPE', type);

    validateType(type);

    validatorsByType[name] = () => {};
  }

  // Transformer factory
  return (ctx) => (sourceFile) => {
    const visitor: ts.Visitor = <T>(node: ts.Node): ts.VisitResult<ts.Node> => {
      console.log('NODE', ts.SyntaxKind[node.kind], '__', node.getText());

      if (ts.isImportDeclaration(node)) {
        visitImportDeclaration(node);
        //
      } else if (ts.isCallExpression(node)) {
        console.log('CALLEXPRESSION', node);
        const signature = checker.getResolvedSignature(node);

        console.log('SIGNATURE', signature);

        const name = checker
          .getTypeAtLocation(signature.getDeclaration())
          .getSymbol()
          .getName();

        console.log('FN NAME', name);
        //
      } else if (ts.isTypeLiteralNode(node)) {
        //
      } else if (ts.isImportSpecifier(node)) {
        //
      } else if (ts.isNamedImports(node)) {
        //
      } else if (ts.isTypeReferenceNode(node)) {
        visitTypeReference(node);
      }

      return ts.visitEachChild(node, visitor, ctx);
    };
    const result = ts.visitNode(sourceFile, visitor);

    console.log('VALIDATORS', validatorsByType);

    return result;
  };
}
