import { proxy, ref } from "valtio/vanilla";
import type { MikotoSpace } from ".";
import type { MikotoClient } from "../../MikotoClient";
import { Role, type RoleUpdatePayload } from "../../api.gen";
import { ZSchema } from "../../helpers/ZSchema";
import { CachedManager } from "../base";

export class MikotoRole extends ZSchema(Role) {
  client!: MikotoClient;

  constructor(base: Role, client: MikotoClient) {
    super(base);
    this.client = ref(client);
    return proxy(this);
  }

  _patch(data: Role) {
    Object.assign(this, data);
  }

  get space() {
    const space = this.client.spaces.cache.get(this.spaceId);
    if (!space) throw new Error("Space not found");
    return space;
  }

  async edit(data: RoleUpdatePayload) {
    await this.client.rest["roles.update"](data, {
      params: { roleId: this.id, spaceId: this.spaceId },
    });
  }

  async delete() {
    await this.client.rest["roles.delete"](undefined, {
      params: { roleId: this.id, spaceId: this.spaceId },
    });
  }
}

export class RoleManager extends CachedManager<MikotoRole> {
  constructor(
    public space: MikotoSpace,
    roles: Role[]
  ) {
    super(space.client);
    this._replace(roles);
    return proxy(this);
  }

  _replace(roles: Role[]) {
    const replacements = roles.map((role) => new MikotoRole(role, this.client));
    this.cache.clear();
    for (const replacement of replacements) {
      this._insert(replacement);
    }
  }

  static _subscribe(client: MikotoClient) {
    client.ws.on("roles.onCreate", (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.roles._insert(new MikotoRole(data, client));
    });

    client.ws.on("roles.onUpdate", (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      const role = space.roles._get(data.id);
      if (role) role._patch(data);
    });

    client.ws.on("roles.onDelete", (data) => {
      const space = client.spaces.cache.get(data.spaceId);
      if (!space) return;
      space.roles._delete(data.id);
    });
  }
}
