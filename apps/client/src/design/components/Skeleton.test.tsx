// @vitest-environment happy-dom
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  Deferred,
  DelayedFallback,
  SKELETON_DELAY,
  SKELETON_MIN,
  SkeletonGroup,
  SkeletonText,
} from './Skeleton';

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const advance = (ms: number) =>
  act(() => {
    vi.advanceTimersByTime(ms);
  });

describe('DelayedFallback', () => {
  test('shows nothing until the delay passes', () => {
    render(
      <DelayedFallback>
        <p>loading…</p>
      </DelayedFallback>,
    );
    expect(screen.queryByText('loading…')).toBeNull();
    advance(SKELETON_DELAY - 1);
    expect(screen.queryByText('loading…')).toBeNull();
    advance(1);
    expect(screen.getByText('loading…')).toBeTruthy();
  });

  test('a zero delay shows immediately', () => {
    render(
      <DelayedFallback delay={0}>
        <p>now</p>
      </DelayedFallback>,
    );
    expect(screen.getByText('now')).toBeTruthy();
  });
});

describe('Deferred', () => {
  const ui = (loading: boolean) => (
    <Deferred loading={loading} skeleton={<p>skeleton</p>}>
      <p>content</p>
    </Deferred>
  );

  test('fast loads never flash a skeleton', () => {
    const { rerender } = render(ui(true));
    advance(SKELETON_DELAY - 10);
    expect(screen.queryByText('skeleton')).toBeNull();
    rerender(ui(false));
    expect(screen.getByText('content')).toBeTruthy();
    advance(1000);
    expect(screen.queryByText('skeleton')).toBeNull();
  });

  test('a visible skeleton stays up for the minimum duration', () => {
    const { rerender } = render(ui(true));
    advance(SKELETON_DELAY);
    expect(screen.getByText('skeleton')).toBeTruthy();

    advance(50);
    rerender(ui(false)); // data arrives 50ms after the skeleton appeared
    expect(screen.getByText('skeleton')).toBeTruthy();
    advance(SKELETON_MIN - 50 - 1);
    expect(screen.getByText('skeleton')).toBeTruthy();
    advance(1);
    expect(screen.queryByText('skeleton')).toBeNull();
    expect(screen.getByText('content')).toBeTruthy();
  });
});

describe('skeleton accessibility', () => {
  test('a group announces one loading label and hides its shapes', () => {
    const { container } = render(
      <SkeletonGroup label="messages">
        <SkeletonText lines={4} />
      </SkeletonGroup>,
    );
    expect(
      screen.getByRole('status', { name: 'Loading messages' }),
    ).toBeTruthy();
    const lines = container.querySelectorAll('[aria-hidden] > span');
    expect(lines).toHaveLength(4);
    // the last line of a paragraph is short
    expect((lines[3] as HTMLElement).style.width).toBe('45%');
  });
});
