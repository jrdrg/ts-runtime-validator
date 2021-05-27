import { validateType } from '../../validateType';

type NullableBasicType = {
  message: string | null;
};

// should succeed
validateType<NullableBasicType>({
  message: null,
});

// should succeed
validateType<NullableBasicType | null>({
  message: null,
});

// should fail
validateType<NullableBasicType>({
  message: {},
});
