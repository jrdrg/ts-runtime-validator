import { validateType } from '../validateType';

describe('validateType', () => {
  describe('Primitive types', () => {
    it.each([
      [() => validateType<string>(null), "Value 'null' is not a string"],
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

  describe('Union types', () => {
    it.each([
      [
        () => validateType<string | boolean>(123),
        "Value '123' is not a string | boolean",
      ],
      [
        () => validateType<number | boolean>('asdf'),
        "Value 'asdf' is not a number | boolean",
      ],
      [
        () => validateType<string | boolean>(null),
        "Value 'null' is not a string | boolean",
      ],
    ])('should fail if type is invalid', (validator, expected) => {
      expect(() => {
        validator();
      }).toThrowError(expected);
    });

    it.each([
      () => validateType<string | number>('foo'),
      () => validateType<string | boolean>(true),
      () => validateType<number | string>(123),
      () => validateType<number | string>('abc'),
      () => validateType<boolean | number>(true),
      () => validateType<boolean | number>(1),
    ])('should succeed if the type is valid', (validator) => {
      expect(() => {
        validator();
      }).not.toThrow();
    });
  });

  describe('Nullable types', () => {
    it.each([
      [() => validateType<string | null>(123), "Value '123' is not a string"],
      [
        () => validateType<number | null>('asdf'),
        "Value 'asdf' is not a number",
      ],
    ])('should fail if type is invalid', (validator, expected) => {
      expect(() => {
        validator();
      }).toThrowError(expected);
    });

    it.each([
      () => validateType<string | null>('foo'),
      () => validateType<string | null>(null),
      () => validateType<number | null>(123),
      () => validateType<number | null>(null),
      () => validateType<boolean | null>(true),
      () => validateType<boolean | null>(null),
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
      // [() => validateType<number[]>(1), 'Not a number[]'],
      // [() => validateType<string[]>([1, '2']), 'Not a string[]'],
      [
        () => validateType<{ a: boolean; b: number }>({ a: true }),
        'Required field is missing: b',
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
