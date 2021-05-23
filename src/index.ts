export function generateValidator<T>() {
  return function validate(input: unknown): asserts input is T {};
}

export function validateType<T>(input: unknown): asserts input is T {}
