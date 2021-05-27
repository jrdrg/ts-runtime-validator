# ts-runtime-validator

A Typescript transformer to generate runtime validation functions from type definitions.

```typescript
type Foo = {
  bar: string;
  baz: number | null;
};

const invalid = {
  bar: 123,
};

validateType<Foo>(invalid); // Not of type 'Foo', throws an exception

const valid: any = {
  bar: 'valid',
  baz: 1,
};

validateType<Foo>(valid); // Type guard, asserts that valid is Foo
console.log(valid.bar); // 'valid'

try {
  const input: any = { bar: 'a' };
  validateType<Foo>(input);
  console.log(input.baz);
} catch (e) {
  // Required field is missing: baz
}
```
