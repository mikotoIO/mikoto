interface ID {
  id: string;
}

export class BaseClientEntity<T extends ID> {
  constructor(base: T) {
    for (const key in base) {
      if (base.hasOwnProperty(key)) {
        (this as any)[key] = base[key];
      }
    }
  }
}

interface Foo {
  id: string;
  bar: string;
}

interface FooEntity extends Foo {}
class FooEntity extends BaseClientEntity<Foo> {}

const w = new FooEntity({ id: 'id', bar: 'bar' });
