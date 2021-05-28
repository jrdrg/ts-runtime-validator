import { transpileProgramWithTransformer } from './helpers';

describe('transformer', () => {
  it('should create validators for a basic type', () => {
    const emittedFiles = transpileProgramWithTransformer(
      './__fixtures__/basic.ts'
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
});
