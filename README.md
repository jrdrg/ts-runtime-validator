# ts-runtime-validator

A Typescript transformer that will eventually be able to create runtime validations from Typescript types

```
type Foo = {
    bar: string;
    baz: number | null;
};

const validator = generateValidator<Foo>();

const invalid = {
    bar: 123,
};

const resultInvalid = validator(invalid); // Not of type 'Foo'

const valid = {
    bar: "valid",
    baz: 1
};

const resultValid = validator(valid); // true, valid is Foo

```
