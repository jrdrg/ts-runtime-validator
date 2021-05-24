import { validateType } from '../../index';

type OptionalBasicType = {
  message?: string;
};

// should succeed
validateType<OptionalBasicType>({});

// should fail
validateType<OptionalBasicType>({
  message: null,
});
