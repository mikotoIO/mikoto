CREATE TYPE public."ChannelType" AS ENUM (
    'TEXT',
    'VOICE',
    'DOCUMENT',
    'APPLICATION',
    'THREAD',
    'CATEGORY'
);

CREATE TYPE public."RelationState" AS ENUM (
    'NONE',
    'FRIEND',
    'BLOCKED',
    'INCOMING_REQUEST',
    'OUTGOING_REQUEST'
);

CREATE TYPE public."SpaceType" AS ENUM ('NONE', 'DM', 'GROUP');

CREATE TYPE public."UserCategory" AS ENUM ('BOT', 'UNVERIFIED');
