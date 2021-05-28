import { transpileProgramWithTransformer } from './helpers';

describe('transformer', () => {
  it('should create validators for nullable types', () => {
    const emittedFiles = transpileProgramWithTransformer(
      './__fixtures__/nullable.ts'
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
      validate__NullableBasicType({
          message: null
      });
      validate__NullableBasicTypeORnull({
          message: null
      });
      ",
      }
    `);
  });
});
