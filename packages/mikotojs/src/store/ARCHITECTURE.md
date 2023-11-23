# How "ClientEntity" works

ClientModels are powered by MobX, and extend upon existing Mikoto models. They are designed to be used to easily add reactivity to Mikoto client. They hold a reference to a Mikoto client, which can be used for networking.

## Store

stores are designed to be used as a singleton, and are used as a global cache for data. They are also used to manage the state of the application, as well as manage the relation graph, through `foreignCreate`, `foreignUpdate` and `foreignDelete`, which should be used to modify data of related models on change of current model.

## Complete example

```ts
// `Thing` is a plain JavaScript object
export class ClientThing implements Thing {
  id!: string; // a data generally has a string ID, which is used to identify it
  // ...rest of your data goes here
  // keep in mind that non-null assertions are required, TypeScript is not smart enough

  constructor(public client: MikotoClient, data: Thing) {
    Object.assign(this, data);
    makeAutoObservable(this, { id: false, client: false });
  }
}

export class ThingStore extends Store<Thing, ClientThing> {
  // this is how you properly turn a plain JavaScript object into a ClientModel
  async fetchFromDatSource() {
    const data = await this.client.fetchThing();
    return this.produce(data);
  }
}
```
