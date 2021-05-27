/**
 * Given an input value, performs some validations that the value is
 * of type T. Throws an Error if input is not of type T, otherwise
 * acts as an assertion type guard.
 *
 * @param input The value that will be checked
 */
export function validateType<T>(input: unknown): asserts input is T {}
