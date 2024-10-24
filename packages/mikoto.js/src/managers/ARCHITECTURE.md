## Model assistance methods

### **`_patch(data: InitialData): void`**
patches the object with the given data.
Used for writing updates. Managers should not be replaced, but have their contents replaced with the `_replace` method.


## Manager assistance methods

### **`static _replace(client: MikotoClient, data: InitialData): void`**

empties everything in the manager and replaces it with the given data. It uses the constructor for the models, so everything should still properly be cached.

### **`static _subscribe(client: MikotoClient): void`**
hooks in various event handlers to the client, that are related with this manager.
