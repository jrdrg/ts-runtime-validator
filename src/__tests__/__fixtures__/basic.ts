import { generateValidator } from '../../index';

type BasicType = {
  message: string;
};

const validatorStr = generateValidator<string>();
const validator = generateValidator<BasicType>();

const result = validator({
  message: 'foo',
});
