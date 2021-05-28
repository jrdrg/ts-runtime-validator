import * as path from 'path';
import * as ts from 'typescript';
import createTransformer from '../transformer';

describe('transformer', () => {
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

  function transpileProgram(filePath: string, compilerHost?: ts.CompilerHost) {
    const file = path.resolve(__dirname, filePath);

    const program = ts.createProgram(
      [file],
      {
        noEmit: false,
        module: ts.ModuleKind.CommonJS,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
      },
      compilerHost
    );

    const diag = ts.getPreEmitDiagnostics(program);
    if (diag.length > 0) {
      throw new Error(diag[0].messageText.toString());
    }

    const transformer = createTransformer(program);

    const emittedFiles: Record<string, string> = {};
    const emitResult = program.emit(
      undefined,
      (
        fileName: string,
        data: string,
        writeByteOrderMark: boolean,
        onError?: (message: string) => void,
        sourceFiles?: readonly ts.SourceFile[]
      ) => {
        const relPath = path.relative(__dirname, fileName);
        emittedFiles[relPath] = data;
      },
      undefined,
      false,
      {
        before: [transformer],
      }
    );

    return emittedFiles;
  }

  it('should create validators for a basic type', () => {
    const emittedFiles = transpileProgram('./__fixtures__/basic.ts');

    expect(emittedFiles).toMatchInlineSnapshot(`
      Object {
        "../validateType.js": "\\"use strict\\";
      exports.__esModule = true;
      exports.validateType = void 0;
      /**
       * Given an input value, performs some validations that the value is
       * of type T. Throws an Error if input is not of type T, otherwise
       * acts as an assertion type guard.
       *
       * @param input The value that will be checked
       */
      function validateType(input) { }
      exports.validateType = validateType;
      ",
        "__fixtures__/basic.js": "\\"use strict\\";
      exports.__esModule = true;
      function validate__string(input, noThrow) {
          if (typeof input === \\"string\\") {
              return true;
          }
          if (!!noThrow) {
              return false;
          }
          else {
              throw new Error(\\"Value '\\" + input + \\"' is not a string\\");
          }
      }
      function validate__number(input, noThrow) {
          if (typeof input === \\"number\\") {
              return true;
          }
          if (!!noThrow) {
              return false;
          }
          else {
              throw new Error(\\"Value '\\" + input + \\"' is not a number\\");
          }
      }
      function validate__BasicType(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          if (input.hasOwnProperty(\\"count\\")) {
              validate__number(input.count, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: count\\");
              }
          }
          if (input.hasOwnProperty(\\"message\\")) {
              validate__string(input.message, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: message\\");
              }
          }
      }
      var validateType_1 = require(\\"../../validateType\\");
      // should fail
      validate__string(123);
      // should succeed
      validate__string('123');
      // should succeed
      validate__BasicType({
          message: 'foo'
      });
      ",
      }
    `);
  });

  it('should create validators for nullable types', () => {
    const emittedFiles = transpileProgram('./__fixtures__/nullable.ts');

    expect(emittedFiles).toMatchInlineSnapshot(`
      Object {
        "../validateType.js": "\\"use strict\\";
      exports.__esModule = true;
      exports.validateType = void 0;
      /**
       * Given an input value, performs some validations that the value is
       * of type T. Throws an Error if input is not of type T, otherwise
       * acts as an assertion type guard.
       *
       * @param input The value that will be checked
       */
      function validateType(input) { }
      exports.validateType = validateType;
      ",
        "__fixtures__/nullable.js": "\\"use strict\\";
      exports.__esModule = true;
      function validate__string(input, noThrow) {
          if (typeof input === \\"string\\") {
              return true;
          }
          if (!!noThrow) {
              return false;
          }
          else {
              throw new Error(\\"Value '\\" + input + \\"' is not a string\\");
          }
      }
      function validate__null(input, noThrow) {
          if (input === null) {
              return true;
          }
          else {
              return false;
          }
      }
      function validate__stringORnull(input, noThrow) {
          if (validate__null(input, true) || validate__string(input, true)) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Value is not of type string | null: \\" + input);
              }
          }
      }
      function validate__NullableBasicType(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          if (input.hasOwnProperty(\\"message\\")) {
              validate__stringORnull(input.message, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: message\\");
              }
          }
      }
      function validate__NullableBasicTypeORnull(input, noThrow) {
          if (validate__null(input, true) || validate__NullableBasicType(input, true)) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Value is not of type NullableBasicType | null: \\" + input);
              }
          }
      }
      var validateType_1 = require(\\"../../validateType\\");
      // should succeed
      validate__NullableBasicType({
          message: null
      });
      // should succeed
      validate__NullableBasicTypeORnull({
          message: null
      });
      // should fail
      validate__NullableBasicType({
          message: {}
      });
      ",
      }
    `);
  });

  it('should create validators for array types', () => {
    const emittedFiles = transpileProgram('./__fixtures__/arrays.ts');

    expect(emittedFiles).toMatchInlineSnapshot(`
      Object {
        "../validateType.js": "\\"use strict\\";
      exports.__esModule = true;
      exports.validateType = void 0;
      /**
       * Given an input value, performs some validations that the value is
       * of type T. Throws an Error if input is not of type T, otherwise
       * acts as an assertion type guard.
       *
       * @param input The value that will be checked
       */
      function validateType(input) { }
      exports.validateType = validateType;
      ",
        "__fixtures__/arrays.js": "\\"use strict\\";
      exports.__esModule = true;
      function validate__string(input, noThrow) {
          if (typeof input === \\"string\\") {
              return true;
          }
          if (!!noThrow) {
              return false;
          }
          else {
              throw new Error(\\"Value '\\" + input + \\"' is not a string\\");
          }
      }
      function validate__stringArray(input, noThrow) {
          if (Array.isArray(input) && input.every(function (i) { return validate__string(i, true); })) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not of type string[]: \\" + String(input).substring(0, 20));
              }
          }
      }
      var validateType_1 = require(\\"../../validateType\\");
      // should fail
      validate__stringArray('a');
      // should succeed
      validate__stringArray(['a']);
      validate__stringArray(['a', 'b']);
      ",
      }
    `);
  });
});
