import * as utils from '../utils';

describe('utils', () => {
  describe('validatorFunctionName', () => {
    it.each([
      ['string', 'validate__string'],
      ['number', 'validate__number'],
      ['string[]', 'validate__stringArray'],
      ['{a: number, b: string}', 'validate__$a$number_b$string$'],
      ['{a: number; b: string;}', 'validate__$a$number_b$string_$'],
      ['{a: number; b?: string;}', 'validate__$a$number_bO$string_$'],
      [
        '{a: boolean[], b: { c: object, d: string[] }}',
        'validate__$a$booleanArray_b$$c$object_d$stringArray$$',
      ],
      ['[string, number]', 'validate__Tstring_numberT'],
      ['string | number | boolean', 'validate__stringORnumberORboolean'],
      ['{ a: string }[]', 'validate__$a$string$Array'],
      [
        '{ a: string, b: number[] }[]',
        'validate__$a$string_b$numberArray$Array',
      ],
      [
        '{ a: string, b: { c: number[] } }[]',
        'validate__$a$string_b$$c$numberArray$$Array',
      ],
    ])(
      'should generate a function with the type name for %s',
      (type, expected) => {
        expect(utils.validatorFunctionName(type)).toEqual(expected);
      }
    );
  });
});
