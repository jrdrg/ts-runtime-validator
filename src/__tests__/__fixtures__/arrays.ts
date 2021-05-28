import { validateType } from '../../validateType';

validateType<string[]>('a');
validateType<number[]>([1, 2, 3]);
validateType<{ a: string }[]>({ a: [1] });
