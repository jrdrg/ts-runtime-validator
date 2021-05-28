import { validateType } from '../../validateType';

type OptionalBasicType = {
  message?: string;
};

validateType<OptionalBasicType>({});
