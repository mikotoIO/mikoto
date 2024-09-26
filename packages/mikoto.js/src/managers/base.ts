import { ref } from "valtio/vanilla";
import { proxyMap } from "valtio/utils";
import type { MikotoClient } from "../MikotoClient";

export class CachedManager<T extends { id: string }> {
	public cache: Map<string, T>;
	client: MikotoClient;

	constructor(client: MikotoClient) {
		this.client = ref(client);
		this.cache = proxyMap();
	}

	_get(id: string) {
		return this.cache.get(id);
	}

	_insert(data: T) {
		this.cache.set(data.id, data);
	}

	_delete(id: string) {
		this.cache.delete(id);
	}
}

export class Manager {
	client: MikotoClient;

	constructor(client: MikotoClient) {
		this.client = ref(client);
	}
}
