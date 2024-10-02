CREATE TABLE public."Account" (
    id uuid NOT NULL,
    email text NOT NULL,
    passhash varchar(256) NOT NULL
);

ALTER TABLE
    ONLY public."Account"
ADD
    CONSTRAINT Account_id_fkey FOREIGN KEY (id) REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Account"
ADD
    CONSTRAINT Account_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX Account_email_key ON public."Account" USING btree (email);

ALTER TABLE
    public."Account" OWNER TO postgres;

CREATE TABLE public."AccountVerification" (
    id uuid NOT NULL,
    category text NOT NULL,
    token text NOT NULL,
    accountId uuid,
    expiresAt timestamp(3) NOT NULL
);

ALTER TABLE
    ONLY public."AccountVerification"
ADD
    CONSTRAINT AccountVerification_accountId_fkey FOREIGN KEY ("accountId") REFERENCES public."Account" (id) ON UPDATE CASCADE ON DELETE
SET
    NULL;

ALTER TABLE
    ONLY public."AccountVerification"
ADD
    CONSTRAINT AccountVerification_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX AccountVerification_token_key ON public."AccountVerification" USING btree (token);

ALTER TABLE
    public."AccountVerification" OWNER TO postgres;

CREATE TABLE public."Ban" (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    spaceId uuid NOT NULL,
    reason text
);

ALTER TABLE
    ONLY public."Ban"
ADD
    CONSTRAINT Ban_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Ban"
ADD
    CONSTRAINT Ban_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Ban"
ADD
    CONSTRAINT Ban_userId_fkey FOREIGN KEY ("userId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX Ban_spaceId_userId_key ON public."Ban" USING btree ("spaceId", "userId");

ALTER TABLE
    public."Ban" OWNER TO postgres;

CREATE TABLE public."Bot" (
    id uuid NOT NULL,
    name varchar(64) NOT NULL,
    ownerId uuid NOT NULL,
    secret text NOT NULL
);

ALTER TABLE
    ONLY public."Bot"
ADD
    CONSTRAINT Bot_id_fkey FOREIGN KEY (id) REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Bot"
ADD
    CONSTRAINT Bot_ownerId_fkey FOREIGN KEY ("ownerId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Bot"
ADD
    CONSTRAINT Bot_pkey PRIMARY KEY (id);

ALTER TABLE
    public."Bot" OWNER TO postgres;

CREATE TABLE public."Channel" (
    id uuid NOT NULL,
    TYPE public."ChannelType" DEFAULT 'TEXT' :: public."ChannelType" NOT NULL,
    parentId uuid,
    "order" int DEFAULT 0 NOT NULL,
    name varchar(64) NOT NULL,
    spaceId uuid NOT NULL,
    lastUpdated timestamp(3)
);

ALTER TABLE
    ONLY public."Channel"
ADD
    CONSTRAINT Channel_parentId_fkey FOREIGN KEY ("parentId") REFERENCES public."Channel" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Channel"
ADD
    CONSTRAINT Channel_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Channel"
ADD
    CONSTRAINT Channel_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX Channel_spaceId_idx ON public."Channel" USING btree ("spaceId");

ALTER TABLE
    public."Channel" OWNER TO postgres;

CREATE TABLE public."ChannelUnread" (
    channelId uuid NOT NULL,
    userId uuid NOT NULL,
    timestamp timestamp(3) NOT NULL
);

ALTER TABLE
    ONLY public."ChannelUnread"
ADD
    CONSTRAINT ChannelUnread_channelId_fkey FOREIGN KEY ("channelId") REFERENCES public."Channel" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."ChannelUnread"
ADD
    CONSTRAINT ChannelUnread_pkey PRIMARY KEY ("channelId", "userId");

ALTER TABLE
    ONLY public."ChannelUnread"
ADD
    CONSTRAINT ChannelUnread_userId_fkey FOREIGN KEY ("userId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    public."ChannelUnread" OWNER TO postgres;

CREATE TABLE public."Document" (
    id uuid NOT NULL,
    channelId uuid NOT NULL,
    content varchar(262144) NOT NULL
);

ALTER TABLE
    ONLY public."Document"
ADD
    CONSTRAINT Document_channelId_fkey FOREIGN KEY ("channelId") REFERENCES public."Channel" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Document"
ADD
    CONSTRAINT Document_pkey PRIMARY KEY (id);

CREATE UNIQUE INDEX Document_channelId_key ON public."Document" USING btree ("channelId");

ALTER TABLE
    public."Document" OWNER TO postgres;

CREATE TABLE public."Invite" (
    id text NOT NULL,
    spaceId uuid NOT NULL,
    createdAt timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL,
    creatorId uuid
);

ALTER TABLE
    ONLY public."Invite"
ADD
    CONSTRAINT Invite_creatorId_fkey FOREIGN KEY ("creatorId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE
SET
    NULL;

ALTER TABLE
    ONLY public."Invite"
ADD
    CONSTRAINT Invite_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Invite"
ADD
    CONSTRAINT Invite_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    public."Invite" OWNER TO postgres;

CREATE TABLE public."Message" (
    id uuid NOT NULL,
    content varchar(4096) NOT NULL,
    timestamp timestamp(3) NOT NULL,
    editedTimestamp timestamp(3),
    authorId uuid,
    channelId uuid NOT NULL
);

ALTER TABLE
    ONLY public."Message"
ADD
    CONSTRAINT Message_authorId_fkey FOREIGN KEY ("authorId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE
SET
    NULL;

ALTER TABLE
    ONLY public."Message"
ADD
    CONSTRAINT Message_channelId_fkey FOREIGN KEY ("channelId") REFERENCES public."Channel" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Message"
ADD
    CONSTRAINT Message_pkey PRIMARY KEY (id);

CREATE INDEX Message_channelId_timestamp_idx ON public."Message" USING btree ("channelId", "timestamp");

ALTER TABLE
    public."Message" OWNER TO postgres;

CREATE TABLE public."RefreshToken" (
    id uuid NOT NULL,
    token text NOT NULL,
    expiresAt timestamp(3) NOT NULL,
    accountId uuid NOT NULL
);

ALTER TABLE
    ONLY public."RefreshToken"
ADD
    CONSTRAINT RefreshToken_accountId_fkey FOREIGN KEY ("accountId") REFERENCES public."Account" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."RefreshToken"
ADD
    CONSTRAINT RefreshToken_pkey PRIMARY KEY (id);

CREATE INDEX RefreshToken_accountId_idx ON public."RefreshToken" USING btree ("accountId");

CREATE UNIQUE INDEX RefreshToken_token_key ON public."RefreshToken" USING btree (token);

ALTER TABLE
    public."RefreshToken" OWNER TO postgres;

CREATE TABLE public."Relationship" (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    relationId uuid NOT NULL,
    spaceId uuid NOT NULL,
    state public."RelationState" NOT NULL
);

ALTER TABLE
    ONLY public."Relationship"
ADD
    CONSTRAINT Relationship_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Relationship"
ADD
    CONSTRAINT Relationship_relationId_fkey FOREIGN KEY ("relationId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Relationship"
ADD
    CONSTRAINT Relationship_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."Relationship"
ADD
    CONSTRAINT Relationship_userId_fkey FOREIGN KEY ("userId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX Relationship_relationId_idx ON public."Relationship" USING btree ("relationId");

CREATE UNIQUE INDEX Relationship_userId_relationId_key ON public."Relationship" USING btree ("userId", "relationId");

ALTER TABLE
    public."Relationship" OWNER TO postgres;

CREATE TABLE public."Role" (
    id uuid NOT NULL,
    name varchar(64) NOT NULL,
    color text,
    permissions varchar(128) NOT NULL,
    position int NOT NULL,
    spaceId uuid NOT NULL
);

ALTER TABLE
    ONLY public."Role"
ADD
    CONSTRAINT Role_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Role"
ADD
    CONSTRAINT Role_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX Role_spaceId_idx ON public."Role" USING btree ("spaceId");

ALTER TABLE
    public."Role" OWNER TO postgres;

CREATE TABLE public."Settings" (
    id uuid NOT NULL,
    userId uuid NOT NULL,
    data varchar(262144) NOT NULL
);

ALTER TABLE
    ONLY public."Settings"
ADD
    CONSTRAINT Settings_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."Settings"
ADD
    CONSTRAINT Settings_userId_fkey FOREIGN KEY ("userId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX Settings_userId_key ON public."Settings" USING btree ("userId");

ALTER TABLE
    public."Settings" OWNER TO postgres;

CREATE TABLE public."Space" (
    id uuid NOT NULL,
    name varchar(64) NOT NULL,
    icon varchar(256),
    ownerId uuid,
    TYPE public."SpaceType" DEFAULT 'NONE' :: public."SpaceType" NOT NULL
);

ALTER TABLE
    ONLY public."Space"
ADD
    CONSTRAINT Space_ownerId_fkey FOREIGN KEY ("ownerId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE
SET
    NULL;

ALTER TABLE
    ONLY public."Space"
ADD
    CONSTRAINT Space_pkey PRIMARY KEY (id);

ALTER TABLE
    public."Space" OWNER TO postgres;

CREATE TABLE public."SpaceUser" (
    id uuid NOT NULL,
    name varchar(64),
    spaceId uuid NOT NULL,
    userId uuid NOT NULL
);

ALTER TABLE
    ONLY public."SpaceUser"
ADD
    CONSTRAINT SpaceUser_pkey PRIMARY KEY (id);

ALTER TABLE
    ONLY public."SpaceUser"
ADD
    CONSTRAINT SpaceUser_spaceId_fkey FOREIGN KEY ("spaceId") REFERENCES public."Space" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."SpaceUser"
ADD
    CONSTRAINT SpaceUser_userId_fkey FOREIGN KEY ("userId") REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE INDEX SpaceUser_spaceId_idx ON public."SpaceUser" USING btree ("spaceId");

CREATE UNIQUE INDEX SpaceUser_userId_spaceId_key ON public."SpaceUser" USING btree ("userId", "spaceId");

ALTER TABLE
    public."SpaceUser" OWNER TO postgres;

CREATE TABLE public."User" (
    id uuid NOT NULL,
    name varchar(64) NOT NULL,
    avatar varchar(256),
    description varchar(2048),
    category public."UserCategory"
);

ALTER TABLE
    ONLY public."User"
ADD
    CONSTRAINT User_pkey PRIMARY KEY (id);

ALTER TABLE
    public."User" OWNER TO postgres;

CREATE TABLE public."UserStatus" (
    id uuid NOT NULL,
    presence text,
    content text,
    timestamp timestamp(3) DEFAULT CURRENT_TIMESTAMP NOT NULL
);

ALTER TABLE
    ONLY public."UserStatus"
ADD
    CONSTRAINT UserStatus_id_fkey FOREIGN KEY (id) REFERENCES public."User" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."UserStatus"
ADD
    CONSTRAINT UserStatus_pkey PRIMARY KEY (id);

ALTER TABLE
    public."UserStatus" OWNER TO postgres;

CREATE TABLE public."_RoleToSpaceUser" (A uuid NOT NULL, B uuid NOT NULL);

ALTER TABLE
    ONLY public."_RoleToSpaceUser"
ADD
    CONSTRAINT _RoleToSpaceUser_A_fkey FOREIGN KEY ("A") REFERENCES public."Role" (id) ON UPDATE CASCADE ON DELETE CASCADE;

ALTER TABLE
    ONLY public."_RoleToSpaceUser"
ADD
    CONSTRAINT _RoleToSpaceUser_B_fkey FOREIGN KEY ("B") REFERENCES public."SpaceUser" (id) ON UPDATE CASCADE ON DELETE CASCADE;

CREATE UNIQUE INDEX _RoleToSpaceUser_AB_unique ON public."_RoleToSpaceUser" USING btree ("A", "B");

CREATE INDEX _RoleToSpaceUser_B_index ON public."_RoleToSpaceUser" USING btree ("B");

ALTER TABLE
    public."_RoleToSpaceUser" OWNER TO postgres;

CREATE TABLE public._prisma_migrations (
    id varchar(36) NOT NULL,
    CHECKSUM varchar(64) NOT NULL,
    finished_at timestamp WITH time zone,
    migration_name varchar(255) NOT NULL,
    LOGS text,
    rolled_back_at timestamp WITH time zone,
    started_at timestamp WITH time zone DEFAULT NOW() NOT NULL,
    applied_steps_count int DEFAULT 0 NOT NULL
);

ALTER TABLE
    ONLY public._prisma_migrations
ADD
    CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);

ALTER TABLE
    public._prisma_migrations OWNER TO postgres;
