// @vitest-environment happy-dom
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError, AxiosHeaders } from 'axios';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  ErrorState,
  ItemErrorBoundary,
  RegionErrorBoundary,
  SurfaceErrorBoundary,
} from './ErrorState';

function Bomb({ error }: { error: unknown }): never {
  throw error;
}

let membersBroken = true;
function Members() {
  if (membersBroken) throw new Error('boom');
  return <p>12 members</p>;
}

function Channel({ id }: { id: string }) {
  if (id === 'bad') throw new Error('nope');
  return <p>channel {id}</p>;
}

function forbidden() {
  const config = { headers: new AxiosHeaders() };
  return new AxiosError('Forbidden', 'ERR', config, null, {
    status: 403,
    statusText: 'Forbidden',
    headers: {},
    config,
    data: null,
  });
}

beforeEach(() => {
  // React logs caught render errors; keep the output readable.
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('error boundaries', () => {
  test('a region shows what failed and recovers on retry', async () => {
    membersBroken = true;
    render(
      <RegionErrorBoundary what="Members">
        <Members />
      </RegionErrorBoundary>,
    );

    expect(screen.getByRole('alert').textContent).toContain(
      "Members didn't load",
    );
    membersBroken = false;
    await userEvent.click(screen.getByRole('button', { name: /try again/i }));
    expect(screen.getByText('12 members')).toBeTruthy();
    expect(screen.queryByRole('alert')).toBeNull();
  });

  test('a crashing item does not take down its siblings', () => {
    render(
      <ul>
        <li>
          <ItemErrorBoundary what="This message">
            <Bomb error={new Error('bad data')} />
          </ItemErrorBoundary>
        </li>
        <li>
          <ItemErrorBoundary what="That message">
            <span>fine</span>
          </ItemErrorBoundary>
        </li>
      </ul>,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      "This message couldn't be displayed.",
    );
    expect(screen.getByText('fine')).toBeTruthy();
  });

  test('changing resetKeys clears the error', () => {
    const ui = (id: string) => (
      <SurfaceErrorBoundary what="#general" resetKeys={[id]}>
        <Channel id={id} />
      </SurfaceErrorBoundary>
    );
    const { rerender } = render(ui('bad'));
    expect(screen.getByRole('heading').textContent).toContain(
      "#general didn't load",
    );
    rerender(ui('good'));
    expect(screen.getByText('channel good')).toBeTruthy();
  });

  test('permanent errors offer no retry', () => {
    render(
      <RegionErrorBoundary what="Bans">
        <Bomb error={forbidden()} />
      </RegionErrorBoundary>,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      "You don't have permission to see this.",
    );
    expect(screen.queryByRole('button', { name: /try again/i })).toBeNull();
  });
});

describe('ErrorState', () => {
  test('surface variant includes technical details and a note', () => {
    render(
      <ErrorState
        what="Settings"
        error={new TypeError('x is undefined')}
        note="Your draft is saved."
      />,
    );
    expect(screen.getByRole('alert').textContent).toContain(
      'Your draft is saved.',
    );
    expect(screen.getByText(/TypeError: x is undefined/)).toBeTruthy();
  });

  test('copy details puts them on the clipboard', async () => {
    const user = userEvent.setup();
    const writeText = vi
      .spyOn(navigator.clipboard, 'writeText')
      .mockResolvedValue(undefined);
    render(<ErrorState what="Settings" error={new Error('kaboom')} />);
    await user.click(screen.getByRole('button', { name: /copy details/i }));
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('Error: kaboom'),
    );
  });
});
