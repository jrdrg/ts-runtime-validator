import { generateValidator } from '../../index';
import { Foo } from './types';

// const fixtureValidNonNull = {
//   bar: 'bar',
//   baz: 1,
// };

// const fixtureValidNull = {
//   bar: 'bar',
//   baz: null,
// };

// const fixtureInvalid = {
//   asdf: true,
//   baz: 3,
// };

const validator = generateValidator<Foo>();
