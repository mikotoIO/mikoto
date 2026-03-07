/**
 * Example E2E tests demonstrating the test harness.
 *
 * These tests require a running superego server. Set the MIKOTO_API_URL
 * environment variable to point to it (defaults to http://localhost:3511).
 *
 * Run with: MIKOTO_API_URL=http://localhost:3511 pnpm vitest run src/e2e/
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { TestHarness, type TestUser } from './harness';

const API_URL = process.env.MIKOTO_API_URL ?? 'http://localhost:3511';

describe('E2E Test Harness', () => {
  const harness = new TestHarness({ apiUrl: API_URL });

  afterAll(async () => {
    await harness.cleanup();
  });

  describe('user creation', () => {
    it('should create a user with defaults', async () => {
      const user = await harness.createUser();
      const me = await user.me();
      expect(me.name).toMatch(/^test-user-/);
    });

    it('should create a user with a custom name', async () => {
      const user = await harness.createUser({ name: 'Alice' });
      const me = await user.me();
      expect(me.name).toBe('Alice');
    });
  });

  describe('space creation', () => {
    let user: TestUser;

    beforeAll(async () => {
      user = await harness.createUser({ name: 'SpaceCreator' });
    });

    it('should create a space with defaults', async () => {
      const space = await user.createSpace();
      expect(space.name).toMatch(/^test-space-/);
      expect(space.channels.length).toBeGreaterThanOrEqual(0);
    });

    it('should create a space with a custom name', async () => {
      const space = await user.createSpace({ name: 'My Community' });
      expect(space.name).toBe('My Community');
    });
  });

  describe('channel creation', () => {
    it('should create a text channel in a space', async () => {
      const { user, space } = await harness.createUserWithSpace();
      const channel = await user.createChannel(space.id, {
        name: 'general',
        type: 'TEXT',
      });
      expect(channel.name).toBe('general');
      expect(channel.type).toBe('TEXT');
    });
  });

  describe('messaging', () => {
    it('should send and retrieve messages', async () => {
      const { user, space } = await harness.createUserWithSpace();
      const channel = await user.createChannel(space.id, {
        name: 'chat',
        type: 'TEXT',
      });

      await user.sendMessage(space.id, channel.id, 'Hello, world!');
      await user.sendMessage(space.id, channel.id, 'Second message');

      const messages = await user.listMessages(space.id, channel.id);
      expect(messages.length).toBe(2);
      expect(messages.map((m) => m.content)).toContain('Hello, world!');
    });
  });

  describe('multi-user flow', () => {
    it('should allow a second user to join via invite', async () => {
      const { user: owner, space } = await harness.createUserWithSpace({
        name: 'Owner',
      });
      const joiner = await harness.createUser({ name: 'Joiner' });

      const invite = await owner.createInvite(space.id);
      await joiner.joinSpace(invite.id);

      const members = await owner.listMembers(space.id);
      const memberNames = members.map((m) => m.user.name);
      expect(memberNames).toContain('Owner');
      expect(memberNames).toContain('Joiner');
    });
  });

  describe('snapshots', () => {
    it('should take a snapshot of a space', async () => {
      const { user, space } = await harness.createUserWithSpace({
        name: 'Snapper',
      }, { name: 'Snapshot Space' });

      const channel = await user.createChannel(space.id, {
        name: 'general',
        type: 'TEXT',
      });
      await user.sendMessage(space.id, channel.id, 'Test message');

      const snapshot = await harness.takeSnapshot(user, space.id);

      expect(snapshot.name).toBe('Snapshot Space');
      expect(snapshot.members.length).toBeGreaterThanOrEqual(1);
      expect(snapshot.takenAt).toBeDefined();

      const generalChannel = snapshot.channels.find(
        (c) => c.name === 'general',
      );
      expect(generalChannel).toBeDefined();
      expect(generalChannel!.messages).toBeDefined();
      expect(generalChannel!.messages!.length).toBe(1);
      expect(generalChannel!.messages![0].content).toBe('Test message');
    });

    it('should diff two snapshots', async () => {
      const { user, space } = await harness.createUserWithSpace();

      const before = await harness.takeSnapshot(user, space.id);

      await user.createChannel(space.id, {
        name: 'new-channel',
        type: 'TEXT',
      });

      const after = await harness.takeSnapshot(user, space.id);

      const diff = TestHarness.diffSnapshots(before, after);
      expect(diff.addedChannels.length).toBe(1);
      expect(diff.addedChannels[0].name).toBe('new-channel');
      expect(diff.removedChannels.length).toBe(0);
    });
  });

  describe('createUserWithSpace convenience', () => {
    it('should create a user and space in one call', async () => {
      const { user, space } = await harness.createUserWithSpace(
        { name: 'QuickUser' },
        { name: 'QuickSpace' },
      );

      const me = await user.me();
      expect(me.name).toBe('QuickUser');
      expect(space.name).toBe('QuickSpace');
    });
  });
});
