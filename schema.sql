--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2 (Debian 16.2-1.pgdg110+2)
-- Dumped by pg_dump version 16.1 (Debian 16.1-1.pgdg110+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: ChannelType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ChannelType" AS ENUM (
    'TEXT',
    'VOICE',
    'DOCUMENT',
    'APPLICATION',
    'THREAD',
    'CATEGORY'
);


ALTER TYPE public."ChannelType" OWNER TO postgres;

--
-- Name: RelationState; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RelationState" AS ENUM (
    'NONE',
    'FRIEND',
    'BLOCKED',
    'INCOMING_REQUEST',
    'OUTGOING_REQUEST'
);


ALTER TYPE public."RelationState" OWNER TO postgres;

--
-- Name: SpaceType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SpaceType" AS ENUM (
    'NONE',
    'DM',
    'GROUP'
);


ALTER TYPE public."SpaceType" OWNER TO postgres;

--
-- Name: UserCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserCategory" AS ENUM (
    'BOT',
    'UNVERIFIED'
);


ALTER TYPE public."UserCategory" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id uuid NOT NULL,
    email text NOT NULL,
    passhash character varying(256) NOT NULL
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: AccountVerification; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AccountVerification" (
    id uuid NOT NULL,
    category text NOT NULL,
    token text NOT NULL,
    "accountId" uuid,
    "expiresAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AccountVerification" OWNER TO postgres;

--
-- Name: Ban; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Ban" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "spaceId" uuid NOT NULL,
    reason text
);


ALTER TABLE public."Ban" OWNER TO postgres;

--
-- Name: Bot; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Bot" (
    id uuid NOT NULL,
    name character varying(64) NOT NULL,
    "ownerId" uuid NOT NULL,
    secret text NOT NULL
);


ALTER TABLE public."Bot" OWNER TO postgres;

--
-- Name: Channel; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Channel" (
    id uuid NOT NULL,
    type public."ChannelType" DEFAULT 'TEXT'::public."ChannelType" NOT NULL,
    "parentId" uuid,
    "order" integer DEFAULT 0 NOT NULL,
    name character varying(64) NOT NULL,
    "spaceId" uuid NOT NULL,
    "lastUpdated" timestamp(3) without time zone
);


ALTER TABLE public."Channel" OWNER TO postgres;

--
-- Name: ChannelUnread; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ChannelUnread" (
    "channelId" uuid NOT NULL,
    "userId" uuid NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."ChannelUnread" OWNER TO postgres;

--
-- Name: Document; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Document" (
    id uuid NOT NULL,
    "channelId" uuid NOT NULL,
    content character varying(262144) NOT NULL
);


ALTER TABLE public."Document" OWNER TO postgres;

--
-- Name: Invite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Invite" (
    id text NOT NULL,
    "spaceId" uuid NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "creatorId" uuid
);


ALTER TABLE public."Invite" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id uuid NOT NULL,
    content character varying(4096) NOT NULL,
    "timestamp" timestamp(3) without time zone NOT NULL,
    "editedTimestamp" timestamp(3) without time zone,
    "authorId" uuid,
    "channelId" uuid NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: RefreshToken; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RefreshToken" (
    id uuid NOT NULL,
    token text NOT NULL,
    "expiresAt" timestamp(3) without time zone NOT NULL,
    "accountId" uuid NOT NULL
);


ALTER TABLE public."RefreshToken" OWNER TO postgres;

--
-- Name: Relationship; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Relationship" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    "relationId" uuid NOT NULL,
    "spaceId" uuid NOT NULL,
    state public."RelationState" NOT NULL
);


ALTER TABLE public."Relationship" OWNER TO postgres;

--
-- Name: Role; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Role" (
    id uuid NOT NULL,
    name character varying(64) NOT NULL,
    color text,
    permissions character varying(128) NOT NULL,
    "position" integer NOT NULL,
    "spaceId" uuid NOT NULL
);


ALTER TABLE public."Role" OWNER TO postgres;

--
-- Name: Settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Settings" (
    id uuid NOT NULL,
    "userId" uuid NOT NULL,
    data character varying(262144) NOT NULL
);


ALTER TABLE public."Settings" OWNER TO postgres;

--
-- Name: Space; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Space" (
    id uuid NOT NULL,
    name character varying(64) NOT NULL,
    icon character varying(256),
    "ownerId" uuid,
    type public."SpaceType" DEFAULT 'NONE'::public."SpaceType" NOT NULL
);


ALTER TABLE public."Space" OWNER TO postgres;

--
-- Name: SpaceUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SpaceUser" (
    id uuid NOT NULL,
    name character varying(64),
    "spaceId" uuid NOT NULL,
    "userId" uuid NOT NULL
);


ALTER TABLE public."SpaceUser" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id uuid NOT NULL,
    name character varying(64) NOT NULL,
    avatar character varying(256),
    description character varying(2048),
    category public."UserCategory"
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: UserStatus; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserStatus" (
    id uuid NOT NULL,
    presence text,
    content text,
    "timestamp" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserStatus" OWNER TO postgres;

--
-- Name: _RoleToSpaceUser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."_RoleToSpaceUser" (
    "A" uuid NOT NULL,
    "B" uuid NOT NULL
);


ALTER TABLE public."_RoleToSpaceUser" OWNER TO postgres;

--
-- Name: _sqlx_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._sqlx_migrations (
    version bigint NOT NULL,
    description text NOT NULL,
    installed_on timestamp with time zone DEFAULT now() NOT NULL,
    success boolean NOT NULL,
    checksum bytea NOT NULL,
    execution_time bigint NOT NULL
);


ALTER TABLE public._sqlx_migrations OWNER TO postgres;

--
-- Name: AccountVerification AccountVerification_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountVerification"
    ADD CONSTRAINT "AccountVerification_pkey" PRIMARY KEY (id);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Ban Ban_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_pkey" PRIMARY KEY (id);


--
-- Name: Bot Bot_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bot"
    ADD CONSTRAINT "Bot_pkey" PRIMARY KEY (id);


--
-- Name: ChannelUnread ChannelUnread_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelUnread"
    ADD CONSTRAINT "ChannelUnread_pkey" PRIMARY KEY ("channelId", "userId");


--
-- Name: Channel Channel_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Channel"
    ADD CONSTRAINT "Channel_pkey" PRIMARY KEY (id);


--
-- Name: Document Document_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_pkey" PRIMARY KEY (id);


--
-- Name: Invite Invite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invite"
    ADD CONSTRAINT "Invite_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: RefreshToken RefreshToken_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_pkey" PRIMARY KEY (id);


--
-- Name: Relationship Relationship_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relationship"
    ADD CONSTRAINT "Relationship_pkey" PRIMARY KEY (id);


--
-- Name: Role Role_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_pkey" PRIMARY KEY (id);


--
-- Name: Settings Settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_pkey" PRIMARY KEY (id);


--
-- Name: SpaceUser SpaceUser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpaceUser"
    ADD CONSTRAINT "SpaceUser_pkey" PRIMARY KEY (id);


--
-- Name: Space Space_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_pkey" PRIMARY KEY (id);


--
-- Name: UserStatus UserStatus_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserStatus"
    ADD CONSTRAINT "UserStatus_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: _sqlx_migrations _sqlx_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._sqlx_migrations
    ADD CONSTRAINT _sqlx_migrations_pkey PRIMARY KEY (version);


--
-- Name: AccountVerification_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AccountVerification_token_key" ON public."AccountVerification" USING btree (token);


--
-- Name: Account_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_email_key" ON public."Account" USING btree (email);


--
-- Name: Ban_spaceId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Ban_spaceId_userId_key" ON public."Ban" USING btree ("spaceId", "userId");


--
-- Name: Channel_spaceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Channel_spaceId_idx" ON public."Channel" USING btree ("spaceId");


--
-- Name: Document_channelId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Document_channelId_key" ON public."Document" USING btree ("channelId");


--
-- Name: Message_channelId_timestamp_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_channelId_timestamp_idx" ON public."Message" USING btree ("channelId", "timestamp");


--
-- Name: RefreshToken_accountId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RefreshToken_accountId_idx" ON public."RefreshToken" USING btree ("accountId");


--
-- Name: RefreshToken_token_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RefreshToken_token_key" ON public."RefreshToken" USING btree (token);


--
-- Name: Relationship_relationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Relationship_relationId_idx" ON public."Relationship" USING btree ("relationId");


--
-- Name: Relationship_userId_relationId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Relationship_userId_relationId_key" ON public."Relationship" USING btree ("userId", "relationId");


--
-- Name: Role_spaceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Role_spaceId_idx" ON public."Role" USING btree ("spaceId");


--
-- Name: Settings_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Settings_userId_key" ON public."Settings" USING btree ("userId");


--
-- Name: SpaceUser_spaceId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SpaceUser_spaceId_idx" ON public."SpaceUser" USING btree ("spaceId");


--
-- Name: SpaceUser_userId_spaceId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "SpaceUser_userId_spaceId_key" ON public."SpaceUser" USING btree ("userId", "spaceId");


--
-- Name: _RoleToSpaceUser_AB_unique; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "_RoleToSpaceUser_AB_unique" ON public."_RoleToSpaceUser" USING btree ("A", "B");


--
-- Name: _RoleToSpaceUser_B_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "_RoleToSpaceUser_B_index" ON public."_RoleToSpaceUser" USING btree ("B");


--
-- Name: AccountVerification AccountVerification_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AccountVerification"
    ADD CONSTRAINT "AccountVerification_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Account Account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_id_fkey" FOREIGN KEY (id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ban Ban_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Ban Ban_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Ban"
    ADD CONSTRAINT "Ban_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bot Bot_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bot"
    ADD CONSTRAINT "Bot_id_fkey" FOREIGN KEY (id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Bot Bot_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Bot"
    ADD CONSTRAINT "Bot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelUnread ChannelUnread_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelUnread"
    ADD CONSTRAINT "ChannelUnread_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ChannelUnread ChannelUnread_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ChannelUnread"
    ADD CONSTRAINT "ChannelUnread_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Channel Channel_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Channel"
    ADD CONSTRAINT "Channel_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Channel Channel_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Channel"
    ADD CONSTRAINT "Channel_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Document Document_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Document"
    ADD CONSTRAINT "Document_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Invite Invite_creatorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invite"
    ADD CONSTRAINT "Invite_creatorId_fkey" FOREIGN KEY ("creatorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Invite Invite_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Invite"
    ADD CONSTRAINT "Invite_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_authorId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Message Message_channelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_channelId_fkey" FOREIGN KEY ("channelId") REFERENCES public."Channel"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RefreshToken RefreshToken_accountId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RefreshToken"
    ADD CONSTRAINT "RefreshToken_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES public."Account"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Relationship Relationship_relationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relationship"
    ADD CONSTRAINT "Relationship_relationId_fkey" FOREIGN KEY ("relationId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Relationship Relationship_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relationship"
    ADD CONSTRAINT "Relationship_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Relationship Relationship_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Relationship"
    ADD CONSTRAINT "Relationship_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Role Role_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Role"
    ADD CONSTRAINT "Role_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Settings Settings_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Settings"
    ADD CONSTRAINT "Settings_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SpaceUser SpaceUser_spaceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpaceUser"
    ADD CONSTRAINT "SpaceUser_spaceId_fkey" FOREIGN KEY ("spaceId") REFERENCES public."Space"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SpaceUser SpaceUser_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SpaceUser"
    ADD CONSTRAINT "SpaceUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Space Space_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Space"
    ADD CONSTRAINT "Space_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: UserStatus UserStatus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserStatus"
    ADD CONSTRAINT "UserStatus_id_fkey" FOREIGN KEY (id) REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RoleToSpaceUser _RoleToSpaceUser_A_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_RoleToSpaceUser"
    ADD CONSTRAINT "_RoleToSpaceUser_A_fkey" FOREIGN KEY ("A") REFERENCES public."Role"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: _RoleToSpaceUser _RoleToSpaceUser_B_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."_RoleToSpaceUser"
    ADD CONSTRAINT "_RoleToSpaceUser_B_fkey" FOREIGN KEY ("B") REFERENCES public."SpaceUser"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

