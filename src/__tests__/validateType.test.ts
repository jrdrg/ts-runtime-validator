import { validateType } from '../validateType';

describe('validateType', () => {
  it.each([
    [() => validateType<string>(123), ''],
    [() => validateType<number>('asdf'), ''],
    // [() => validateType<{ a: string }>('asdf'), ''],
  ])('should fail if type is invalid', (validator) => {
    expect(() => {
      validator();
    }).toThrowError(/Value '(\w+)' is not a \w+/);
  });

  it.each([
    () => validateType<string>('foo'),
    () => validateType<number>(123),
    () => validateType<boolean>(true),
    () => validateType<string[]>(['1', '2']),
  ])('should succeed if the type is valid', (validator) => {
    expect(() => {
      validator();
    }).not.toThrow();
  });
});
