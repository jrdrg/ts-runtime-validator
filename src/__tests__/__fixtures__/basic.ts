import { generateValidator } from '../../index';

type BasicType = {
  message: string;
};

const validator = generateValidator<BasicType>();
