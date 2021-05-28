import { validateType } from '../../validateType';

type OptionalBasicType = {
  message?: string;
};

interface OptionalBasicInterface {
  message?: string;
}

validateType<OptionalBasicType>({});
validateType<OptionalBasicInterface>({});
validateType<{ a: string; b?: string }>({});
