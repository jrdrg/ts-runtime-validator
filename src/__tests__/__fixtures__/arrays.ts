import { validateType } from '../../validateType';

// should fail
validateType<string[]>('a');

// should succeed
validateType<string[]>(['a']);
validateType<string[]>(['a', 'b']);
