interface ID {
  id: string;
}

export class BaseClientEntity<T extends ID> {
  constructor(base: T) {
    Object.keys(base).forEach((key) => {
      if (Object.prototype.hasOwnProperty.call(base, key)) {
        (this as any)[key] = (base as any)[key];
      }
    });
  }
}

interface Foo {
  id: string;
  bar: string;
}

interface FooEntity extends Foo {}
class FooEntity extends BaseClientEntity<Foo> {}

const w = new FooEntity({ id: 'id', bar: 'bar' });
