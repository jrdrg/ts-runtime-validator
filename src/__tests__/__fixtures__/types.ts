export type Foo = {
  bar: string;
  baz: number | null;
};

export type Bar = {
  foo: Foo[];
  bar: number;
};
