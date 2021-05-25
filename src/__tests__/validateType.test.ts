import { validateType } from '../validateType';

describe('validateType', () => {
  describe('Primitive types', () => {
    it.each([
      [() => validateType<string>(123), "Value '123' is not a string"],
      [() => validateType<number>('asdf'), "Value 'asdf' is not a number"],
    ])('should fail if type is invalid', (validator, expected) => {
      expect(() => {
        validator();
      }).toThrowError(expected);
    });

    it.each([
      () => validateType<string>('foo'),
      () => validateType<number>(123),
      () => validateType<boolean>(true),
    ])('should succeed if the type is valid', (validator) => {
      expect(() => {
        validator();
      }).not.toThrow();
    });
  });

  describe('Complex types', () => {
    it.each([
      [() => validateType<{ a: string }>('asdf'), 'Not an object: asdf'],
      [
        () => validateType<{ a: string }>({ a: true }),
        "Value 'true' is not a string",
      ],
    ])('should fail if type is invalid', (validator, expected) => {
      expect(() => {
        validator();
      }).toThrowError(expected);
    });

    it.each([
      () => validateType<number[]>([123]),
      () => validateType<{ a: boolean }>({ a: true }),
      () => validateType<string[]>(['1', '2']),
    ])('should succeed if the type is valid', (validator) => {
      expect(() => {
        validator();
      }).not.toThrow();
    });
  });
});
