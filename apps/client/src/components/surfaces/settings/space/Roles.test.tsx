// @vitest-environment happy-dom
import type { Role } from '@mikoto-io/mikoto.js';
import { cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import type { AxiosAdapter } from 'axios';
import { afterEach, describe, expect, test } from 'vitest';

import {
  addSpace,
  createTestClient,
  makeSpace,
  renderWithClient,
  uuid,
} from '@/test/mikoto';

import { RolesSubsurface } from './Roles';

afterEach(cleanup);

function setup(permissions: string[]) {
  const { client, backend } = createTestClient();
  const data = makeSpace();
  const role: Role = {
    id: uuid(),
    spaceId: data.id,
    name: 'Helpers',
    color: null,
    position: 1,
    permissions,
  };
  data.roles = [role];
  const space = addSpace(client, data);

  // Answer role updates by echoing the patch back, as the server does.
  const patches: { permissions: string[] }[] = [];
  const members = backend.adapter;
  const adapter: AxiosAdapter = async (config) => {
    if (config.method === 'patch' && config.url?.includes('/roles/')) {
      const patch = JSON.parse(config.data as string);
      patches.push(patch);
      return {
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
        data: { ...role, ...patch },
      };
    }
    return members(config);
  };
  client.rest.axios.defaults.adapter = adapter;

  renderWithClient(client, <RolesSubsurface space={space} />);
  return { patches };
}

const toggle = (name: string) => screen.getByRole('switch', { name });

describe('RolesSubsurface permissions', () => {
  test('shows the permissions the role holds', () => {
    setup(['ban', 'manage_space']);
    expect(toggle('Kick and ban members').getAttribute('aria-checked')).toBe(
      'true',
    );
    expect(toggle('Manage space').getAttribute('aria-checked')).toBe('true');
    expect(toggle('Manage roles').getAttribute('aria-checked')).toBe('false');
  });

  test('saves permission names, keeping custom permissions it has no toggle for', async () => {
    const { patches } = setup(['ban', 'polls:create']);
    fireEvent.click(toggle('Manage space'));
    fireEvent.click(toggle('Kick and ban members'));
    fireEvent.click(await screen.findByRole('button', { name: /save/i }));

    await waitFor(() => expect(patches).toHaveLength(1));
    expect(patches[0].permissions).toEqual(['manage_space', 'polls:create']);
  });
});
