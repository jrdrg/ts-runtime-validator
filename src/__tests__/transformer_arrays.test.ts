import path from 'path';
import { transpileProgramWithTransformer } from './__utils__/helpers';

describe('transformer', () => {
  it('should create validators for array types', () => {
    const emittedFiles = transpileProgramWithTransformer(
      path.resolve(__dirname, './__fixtures__/arrays.ts')
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
        "../__fixtures__/arrays.js": "\\"use strict\\";
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
                  throw new Error(\\"Not of type string[]: \\" + JSON.stringify(input).substring(0, 20));
              }
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
      function validate__numberArray(input, noThrow) {
          if (Array.isArray(input) && input.every(function (i) { return validate__number(i, true); })) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not of type number[]: \\" + JSON.stringify(input).substring(0, 20));
              }
          }
      }
      function validate__$a$string$(input, noThrow) {
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
          return isValid;
      }
      function validate__$a$string$Array(input, noThrow) {
          if (Array.isArray(input) && input.every(function (i) { return validate__$a$string$(i, true); })) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not of type { a: string }[]: \\" + JSON.stringify(input).substring(0, 20));
              }
          }
      }
      var validateType_1 = require(\\"../../validateType\\");
      validate__stringArray('a');
      validate__numberArray([1, 2, 3]);
      validate__$a$string$Array({ a: [1] });
      ",
      }
    `);
  });
});
