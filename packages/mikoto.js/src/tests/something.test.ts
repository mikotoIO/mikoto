import { proxy } from 'valtio';
import { expect, test } from 'vitest';
import { z } from 'zod';

import { ZSchema } from '../helpers/ZSchema';
import { isValtioProxy } from '../helpers/is-proxy';

const Foo = z.object({
  a: z.string(),
  b: z.number(),
});

class FooClass extends ZSchema(Foo) {
  constructor(data: z.infer<typeof Foo>) {
    super(data);
    return proxy(this);
  }
}

test('Check if proxy works', () => {
  const foo = new FooClass({ a: 'hello', b: 42 });
  expect(isValtioProxy(foo)).toBe(true);
});
