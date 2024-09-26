import { proxy, ref } from "valtio/vanilla";
import type { MikotoClient } from "../MikotoClient";
import { type SpaceExt, User } from "../api.gen";
import { ZSchema } from "../helpers/ZSchema";

export class MikotoUser extends ZSchema(User) {
	client!: MikotoClient;

	constructor(base: SpaceExt, client: MikotoClient) {
		const cached = client.spaces.cache.get(base.id);
		if (cached) {
			cached._patch(base);
			return cached;
		}

		super(base);
		this.client = ref(client);
		return proxy(this);
	}
}
