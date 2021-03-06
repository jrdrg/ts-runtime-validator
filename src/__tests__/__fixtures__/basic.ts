import { validateType } from '../../validateType';

type BasicType = {
  count: number;
  message: string;
};

// should fail
validateType<string>(123);

// should succeed
validateType<string>('123');

// should succeed
validateType<BasicType>({
  message: 'foo',
});
