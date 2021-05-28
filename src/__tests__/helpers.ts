import * as path from 'path';
import * as ts from 'typescript';
import createTransformer from '../transformer';

export function transpileProgramWithTransformer(
  filePath: string,
  compilerHost?: ts.CompilerHost
) {
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
