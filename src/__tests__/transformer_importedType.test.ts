import { transpileProgramWithTransformer } from './helpers';

describe('transformer', () => {
  it('should create validators for imported types', () => {
    const emittedFiles = transpileProgramWithTransformer(
      './__fixtures__/importedType.ts'
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
        "__fixtures__/importedType.js": "\\"use strict\\";
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
      function validate__null(input, noThrow) {
          if (input === null) {
              return true;
          }
          else {
              return false;
          }
      }
      function validate__numberORnull(input, noThrow) {
          if (validate__null(input, true) || validate__number(input, true)) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Value is not of type number | null: \\" + input);
              }
          }
      }
      function validate__Foo(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          if (input.hasOwnProperty(\\"bar\\")) {
              validate__string(input.bar, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: bar\\");
              }
          }
          if (input.hasOwnProperty(\\"baz\\")) {
              validate__numberORnull(input.baz, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: baz\\");
              }
          }
      }
      function validate__FooArray(input, noThrow) {
          if (Array.isArray(input) && input.every(function (i) { return validate__Foo(i, true); })) {
              return true;
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not of type Foo[]: \\" + String(input).substring(0, 20));
              }
          }
      }
      function validate__Bar(input, noThrow) {
          if (typeof input !== \\"object\\") {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Not an object: \\" + input);
              }
          }
          if (input.hasOwnProperty(\\"foo\\")) {
              validate__FooArray(input.foo, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: foo\\");
              }
          }
          if (input.hasOwnProperty(\\"bar\\")) {
              validate__number(input.bar, noThrow);
          }
          else {
              if (!!noThrow) {
                  return false;
              }
              else {
                  throw new Error(\\"Required field is missing: bar\\");
              }
          }
      }
      var validateType_1 = require(\\"../../validateType\\");
      validate__Foo({});
      validate__Bar({});
      ",
        "__fixtures__/types.js": "\\"use strict\\";
      exports.__esModule = true;
      ",
      }
    `);
  });
});
