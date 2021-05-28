import { validateType } from '../../validateType';
import { Foo, Bar } from './types';

validateType<Foo>({});
validateType<Bar>({});
