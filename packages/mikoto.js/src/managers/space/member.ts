import { proxy, ref } from "valtio/vanilla";
import type { MikotoSpace } from ".";
import type { MikotoClient } from "../../MikotoClient";
import { MemberExt } from "../../api.gen";
import { ZSchema } from "../../helpers/ZSchema";
import { CachedManager } from "../base";

export class MikotoMember extends ZSchema(MemberExt) {
	client!: MikotoClient;

	constructor(base: MemberExt, client: MikotoClient) {
		const cached = client.spaces._get(base.spaceId)?.members._get(base.id);
		if (cached) {
			cached._patch(base);
			return cached;
		}

		super(base);
		this.client = ref(client);

		return proxy(this);
	}

	get space() {
		return this.client.spaces.cache.get(this.spaceId);
	}

	_patch(data: MemberExt) {
		Object.assign(this, data);
	}

	async kick() {
		await this.client.rest["members.delete"](undefined, {
			params: { userId: this.userId, spaceId: this.spaceId },
		});
	}
}

export class MemberManager extends CachedManager<MikotoMember> {
	constructor(public space: MikotoSpace) {
		super(space.client);
		return proxy(this);
	}

	static _subscribe(client: MikotoClient) {
		client.ws.on("members.onCreate", (data) => {
			const space = client.spaces.cache.get(data.spaceId);
			if (!space) return;
			space.members._insert(new MikotoMember(data, client));
		});

		client.ws.on("members.onUpdate", (data) => {
			const space = client.spaces.cache.get(data.spaceId);
			if (!space) return;
			const member = space.members._get(data.id);
			if (member) member._patch(data);
		});

		client.ws.on("members.onDelete", (data) => {
			const space = client.spaces.cache.get(data.spaceId);
			if (!space) return;
			space.members._delete(data.id);
		});
	}
}
