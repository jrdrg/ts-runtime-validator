import { generateValidator } from '../index';

type Foo = {
  bar: string;
  baz: number | null;
};

const fixtureValidNonNull = {
  bar: 'bar',
  baz: 1,
};

const fixtureValidNull = {
  bar: 'bar',
  baz: null,
};

const fixtureInvalid = {
  asdf: true,
  baz: 3,
};

describe('index', () => {
  it('should work', () => {
    const validator = generateValidator<Foo>();

    expect(validator(fixtureValidNonNull)).toBe(true);
  });
});
