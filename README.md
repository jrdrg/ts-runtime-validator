# ts-runtime-validator

A Typescript transformer that will eventually be able to create runtime validations from Typescript types

```typescript
type Foo = {
  bar: string;
  baz: number | null;
};

const invalid = {
  bar: 123,
};

validateType<Foo>(invalid); // Not of type 'Foo', throws an exception

const valid: object = {
  bar: 'valid',
  baz: 1,
};

validateType<Foo>(valid); // Type guard, asserts that valid is Foo
console.log(valid.bar); // 'valid'
```
