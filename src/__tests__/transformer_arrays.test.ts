import { transpileProgramWithTransformer } from './helpers';

describe('transformer', () => {
  it('should create validators for array types', () => {
    const emittedFiles = transpileProgramWithTransformer(
      './__fixtures__/arrays.ts'
    );

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
