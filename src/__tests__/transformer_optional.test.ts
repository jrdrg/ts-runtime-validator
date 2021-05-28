import path from 'path';
import { transpileProgramWithTransformer } from './__utils__/helpers';

describe('transformer', () => {
  it('should create validators for nullable types', () => {
    const emittedFiles = transpileProgramWithTransformer(
      path.resolve(__dirname, './__fixtures__/optional.ts')
    );

    expect(emittedFiles).toMatchInlineSnapshot(`
      Object {
        "../../validateType.js": "\\"use strict\\";
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
        "../__fixtures__/optional.js": "\\"use strict\\";
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
      function validate__OptionalBasicType(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          var isValid = true;
          if (input.hasOwnProperty(\\"message\\")) {
              isValid = isValid && validate__string(input.message, noThrow);
          }
          return isValid;
      }
      function validate__OptionalBasicInterface(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          var isValid = true;
          if (input.hasOwnProperty(\\"message\\")) {
              isValid = isValid && validate__string(input.message, noThrow);
          }
          return isValid;
      }
      function validate__$a$string_bO$string$(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          var isValid = true;
          if (input.hasOwnProperty(\\"a\\")) {
              isValid = isValid && validate__string(input.a, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: a\\");
              }
          }
          if (input.hasOwnProperty(\\"b\\")) {
              isValid = isValid && validate__string(input.b, noThrow);
          }
          return isValid;
      }
      var validateType_1 = require(\\"../../validateType\\");
      validate__OptionalBasicType({});
      validate__OptionalBasicInterface({});
      validate__$a$string_bO$string$({});
      ",
      }
    `);
  });
});
