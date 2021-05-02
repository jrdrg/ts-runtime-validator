import * as path from 'path';
import * as ts from 'typescript';
import createTransformer from '../transformer';

describe('index', () => {
  function fileExists(fileName: string): boolean {
    return ts.sys.fileExists(fileName);
  }

  function readFile(fileName: string): string | undefined {
    return ts.sys.readFile(fileName);
  }

  function createCompilerHost(files: Record<string, string>): ts.CompilerHost {
    const compilerHost = ts.createCompilerHost({});

    console.log('R', compilerHost.resolveModuleNames);

    return {
      ...compilerHost,
      // resolveModuleNames(
      //   moduleNames: string[],
      //   containingFile: string,
      //   reusedNames: string[] | undefined,
      //   redirectedReference: ts.ResolvedProjectReference | undefined,
      //   options: ts.CompilerOptions
      // ) {
      //   console.log('RESOLVE', containingFile);
      //   return compilerHost.resolveModuleNames(
      //     moduleNames,
      //     containingFile,
      //     reusedNames,
      //     redirectedReference,
      //     options
      //   );
      //   // return moduleNames.reduce((resolvedModules, moduleName) => {
      //   //   let result = ts.resolveModuleName(
      //   //     moduleName,
      //   //     containingFile,
      //   //     {
      //   //       noEmit: true,
      //   //       module: ts.ModuleKind.CommonJS,
      //   //       moduleResolution: ts.ModuleResolutionKind.NodeJs,
      //   //     },
      //   //     {
      //   //       fileExists,
      //   //       readFile,
      //   //     }
      //   //   );
      //   //   console.log('resolution result', result);
      //   //   return resolvedModules;
      //   // }, []);
      // },
      //   getSourceFile(
      //     fileName: string,
      //     languageVersion: ts.ScriptTarget,
      //     onError?: (message: string) => void
      //   ) {
      //     const fileText = files[fileName];
      //     console.log('FT', fileName, '>>>>', fileText);
      //     return fileText === undefined
      //       ? undefined
      //       : ts.createSourceFile(fileName, fileText, ts.ScriptTarget.ES2015);
      //   },
    };
  }

  it('should work', () => {
    // const file = path.resolve(__dirname, './__fixtures__/importedType.ts');
    const file = path.resolve(__dirname, './__fixtures__/basic.ts');
    console.log('FILE', file);

    // const transpiled = ts.transpileModule(sourceCode, {});
    const compilerHost = createCompilerHost({
      // 'test.ts': sourceCode,
    });

    const program = ts.createProgram(
      //   ['test.ts'],
      [file],
      {
        noEmit: false,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      }
      // compilerHost
    );

    const contents = ts.sys.readFile(file);
    console.log('CONTENTS', contents);

    // console.log('TRANSPILED', transpiled);
    // console.log('PROGRAM', program);
    const diag = ts.getPreEmitDiagnostics(program);
    console.log('DIAG', diag);

    if (diag.length > 0) {
      throw new Error(diag[0].messageText.toString());
    }

    // console.log('JS', program.emit());

    const transformer = createTransformer(program);
    // const context = ts.transform(program.getSourceFile('test.ts'), [
    // const result = ts.transform(program.getSourceFile(file), [transformer]);
    // console.log('RESULT', result);

    // const tMod = ts.transpileModule(contents, {
    //   transformers: { before: [transformer] },
    //   reportDiagnostics: true,
    // });

    const emittedFiles = {};
    const emitResult = program.emit(
      undefined,
      (
        fileName: string,
        data: string,
        writeByteOrderMark: boolean,
        onError?: (message: string) => void,
        sourceFiles?: readonly ts.SourceFile[]
      ) => {
        console.log('writing', fileName, data);
        emittedFiles[fileName] = data;
      },
      undefined,
      false,
      {
        before: [transformer],
      }
    );

    console.log('EMIT', emitResult);
    const fileOutput = Object.entries(emittedFiles)
      .map(([k, v]) => [k, v].join('\n'))
      .join('\n');

    console.log(fileOutput);
    // console.log('-- TMOD', tMod);

    // expect(validator(fixtureValidNonNull)).toBe(true);
    // expect(fileOutput).toMatchInlineSnapshot();
  });
});
