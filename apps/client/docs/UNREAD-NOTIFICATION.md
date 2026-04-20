# Unread & Notification System

This document describes how the unread state, acknowledgement (ack), and notification flows work across the frontend and backend.

## Database Schema

Two tables drive this system:

**ChannelUnread** — tracks per-user, per-channel read position:

| Column    | Type      | Description                        |
| --------- | --------- | ---------------------------------- |
| channelId | UUID (PK) | FK to Channel                      |
| userId    | UUID (PK) | FK to User                         |
| timestamp | timestamp | Last time the user acked this channel |

**NotificationPreference** — per-space notification level:

| Column  | Type              | Description              |
| ------- | ----------------- | ------------------------ |
| userId  | UUID (PK)         | FK to User               |
| spaceId | UUID (PK)         | FK to Space              |
| level   | NotificationLevel | `ALL`, `MENTIONS`, or `NOTHING` |

The **Channel** table also stores a `lastUpdated` timestamp that is bumped every time a message is created in the channel.

## Acknowledgement (Ack) Flow

A channel is considered **unread** when `Channel.lastUpdated > ChannelUnread.timestamp` for the current user. If no `ChannelUnread` row exists, the channel is treated as unread.

### Backend

- **POST** `/spaces/:spaceId/channels/:channelId/ack` — upserts `ChannelUnread` with the current timestamp.
- **GET** `/spaces/:spaceId/channels/unreads` — returns all `ChannelUnread` rows for the user in a space.

### Frontend (`store/unreads.ts`)

The `ackStore` is a Valtio proxy holding a `Record<channelId, ackTimestamp>`:

```
ackStore.acks[channelId] = timestamp
```

Key functions:

| Function             | Purpose                                                                 |
| -------------------- | ----------------------------------------------------------------------- |
| `loadAcksForSpace`   | Calls `space.listUnread()` and populates `ackStore`                     |
| `loadAcksForAllSpaces` | Loads acks for every space the user is in                             |
| `ackChannel`         | Writes a new ack timestamp to the local store                           |
| `isChannelUnread`    | Compares `channel.lastUpdated` against the stored ack timestamp         |
| `isSpaceUnread`      | Returns `true` if **any** channel in the space is unread                |

### When Ack Happens

1. **User clicks a channel** — the Explorer calls `channel.ack()` (REST) and updates `ackStore` locally.
2. **User is viewing a channel when a new message arrives** — auto-acked because `notifyFromMessage()` returns `true` when `activeChannelId === message.channelId`.
3. **User sends a message** — the `messages.onCreate` handler detects `msg.authorId === me.id` and acks immediately in the local store.

## Unread Indicators (UI)

### Space Sidebar Pill

`SpaceSidebar/Pill.tsx` renders a 4px white vertical bar on the left edge of a space icon when `isSpaceUnread(mikoto, spaceId)` returns `true` and the space is not currently selected.

The `useSpaceUnreadState` hook subscribes to both `ackStore` and `mikoto.channels.cache` so the pill reactively appears/disappears as ack state or channel `lastUpdated` values change.

### Channel List

In `Explorer/index.tsx`, each channel tree node receives an `unread` flag from `isChannelUnread(channel.lastUpdated, channel.id)`. The tree renderer uses this to bold or otherwise highlight unread channels.

## Notification Flow

### Registration (`MikotoClientProvider.tsx`)

On mount, `registerNotifications(mikoto, preferences)` subscribes to the `messages.onCreate` WebSocket event. For each incoming message:

1. Update `channel.lastUpdated` to the message timestamp.
2. If the author is the current user, auto-ack and stop.
3. Check the space's `NotificationPreference`:
   - `NOTHING` — suppress.
   - `MENTIONS` — suppress (mention detection is TODO).
   - `ALL` — continue to step 4.
4. Call `notifyFromMessage(mikoto, msg)`:
   - If the user is viewing the channel (`activeChannelId` matches), return `true` to signal auto-ack; no notification is shown.
   - Otherwise, show a notification.

### Notification Display (`functions/notify.ts`)

Three modes stored in `localStorage` under `notificationMode`:

| Mode     | Behavior                                          |
| -------- | ------------------------------------------------- |
| `native` | Browser `Notification` API (requires permission)  |
| `toast`  | In-app toast via Chakra toaster                   |
| `none`   | Disabled                                          |

Default is `native`.

**Batching** — messages from the same channel within a 3-second window are counted. After 3 messages, a single bundled notification (`"N new messages in #channel (space)"`) replaces individual ones.

**Sound** — `audio/notification/ping.ogg` plays at 30% volume on each notification unless disabled via `localStorage.notificationSound === 'false'`.

### Notification Preferences (`settings/account/notification.tsx`)

Users can configure:

- **Display mode** — none / native / toast.
- **Sound** — on / off.
- **Per-space level** — ALL / MENTIONS / NOTHING (stored in `NotificationPreference` table).

Backend endpoints:

- **GET** `/notification-preferences` — list all preferences for the user.
- **GET** `/:spaceId/notification-preference` — get preference for one space (defaults to `ALL`).
- **POST** `/:spaceId/notification-preference` — upsert preference.

## Real-Time Plumbing

When a message is created on the backend:

1. The message row is inserted.
2. `Channel.lastUpdated` is set to the message timestamp.
3. `emit_event("messages.onCreate", &message, &format!("space:{space_id}"))` publishes to Redis pub/sub.
4. All WebSocket connections subscribed to `space:{spaceId}` receive the event.
5. The frontend `messages.onCreate` handler runs the notification + ack logic described above.

## Active Channel Tracking

`functions/notify.ts` exports `setActiveChannelId` / `getActiveChannelId`. The Messages surface sets the active channel ID on mount and clears it on unmount. This allows the notification system to suppress alerts and auto-ack when the user is already looking at the channel where a message arrived.
