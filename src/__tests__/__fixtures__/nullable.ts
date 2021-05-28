import { validateType } from '../../validateType';

type NullableBasicType = {
  message: string | null;
};

validateType<NullableBasicType>({
  message: null,
});

validateType<NullableBasicType | null>({
  message: null,
});
