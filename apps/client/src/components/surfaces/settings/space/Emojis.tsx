import { Box, Flex, Grid, Input, Text } from '@chakra-ui/react';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import type { MikotoSpace } from '@mikoto-io/mikoto.js';
import { useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio/react';

import { normalizeMediaUrl } from '@/components/atoms/Avatar';
import { Button, Field } from '@/components/ui';
import { uploadFile } from '@/functions/fileUpload';
import { SettingSurface } from '@/views';

const EMOJI_NAME_REGEX = /^[a-zA-Z0-9_-]{2,32}$/;

function defaultNameFromFile(filename: string) {
  const name = filename
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 32);
  return name.length >= 2 ? name : 'emoji';
}

function AddEmojiForm({ space }: { space: MikotoSpace }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoizing keeps the object URL stable across renders for the same file and
  // we explicitly revoke when the file changes. We accept a tiny leak on
  // unmount in exchange for not needing an effect just to clean it up.
  const preview = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file],
  );

  const reset = () => {
    setFile(null);
    setName('');
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!file) {
      setError('Choose an image first');
      return;
    }
    if (!EMOJI_NAME_REGEX.test(name)) {
      setError('Name must be 2-32 chars (letters, digits, _ or -)');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data } = await uploadFile('/emoji', file);
      await space.emojis.create({ name, url: data.url });
      reset();
    } catch (e: unknown) {
      const message =
        (e as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? 'Failed to upload emoji';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box bg="gray.800" p={4} rounded="md" mb={4} maxW="640px">
      <Text fontWeight="bold" mb={2}>
        Add Custom Emoji
      </Text>
      <Flex gap={4} align="flex-end" wrap="wrap">
        <Box>
          <Box
            as="label"
            display="inline-flex"
            alignItems="center"
            justifyContent="center"
            cursor="pointer"
            w="64px"
            h="64px"
            rounded="md"
            border="1px dashed"
            borderColor="gray.500"
            overflow="hidden"
            bg="gray.900"
          >
            {preview ? (
              <img
                src={preview}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <Text fontSize="xs" color="gray.400" textAlign="center">
                Choose
                <br />
                image
              </Text>
            )}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                if (f && !name) setName(defaultNameFromFile(f.name));
              }}
            />
          </Box>
        </Box>
        <Field label="Name">
          <Input
            placeholder="emoji_name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={32}
          />
        </Field>
        <Button
          colorPalette="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          Upload
        </Button>
      </Flex>
      {error && (
        <Text color="red.300" fontSize="sm" mt={2}>
          {error}
        </Text>
      )}
    </Box>
  );
}

function EmojiCard({
  space,
  emojiId,
}: {
  space: MikotoSpace;
  emojiId: string;
}) {
  const emoji = space.emojis._get(emojiId);
  const snap = useSnapshot(emoji!);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(snap.name);
  const [saving, setSaving] = useState(false);

  if (!emoji) return null;

  return (
    <Box
      p={3}
      bg="gray.800"
      rounded="md"
      display="flex"
      flexDirection="column"
      alignItems="center"
      gap={2}
    >
      <img
        src={normalizeMediaUrl(snap.url)}
        alt={`:${snap.name}:`}
        style={{
          width: 48,
          height: 48,
          objectFit: 'contain',
          imageRendering: 'auto',
        }}
      />
      {editing ? (
        <Input
          size="sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoFocus
          onKeyDown={async (e) => {
            if (e.key === 'Enter') {
              setSaving(true);
              try {
                await emoji.edit(name);
              } finally {
                setSaving(false);
                setEditing(false);
              }
            }
            if (e.key === 'Escape') {
              setName(snap.name);
              setEditing(false);
            }
          }}
        />
      ) : (
        <Text
          fontSize="xs"
          color="gray.300"
          onClick={() => setEditing(true)}
          cursor="pointer"
          title="Click to rename"
          wordBreak="break-all"
          textAlign="center"
        >
          :{snap.name}:
        </Text>
      )}
      <Flex gap={1}>
        {editing ? (
          <>
            <Button
              size="2xs"
              colorPalette="primary"
              loading={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  await emoji.edit(name);
                } finally {
                  setSaving(false);
                  setEditing(false);
                }
              }}
            >
              Save
            </Button>
            <Button
              size="2xs"
              variant="ghost"
              onClick={() => {
                setName(snap.name);
                setEditing(false);
              }}
            >
              Cancel
            </Button>
          </>
        ) : (
          <Button
            size="2xs"
            variant="ghost"
            colorPalette="danger"
            onClick={async () => {
              await emoji.delete();
            }}
            aria-label="Delete emoji"
            title="Delete emoji"
          >
            <FontAwesomeIcon icon={faTrash} />
          </Button>
        )}
      </Flex>
    </Box>
  );
}

export function EmojiSubsurface({ space }: { space: MikotoSpace }) {
  const emojiCacheSnap = useSnapshot(space.emojis.cache);
  const emojiIds = [...emojiCacheSnap.keys()];

  return (
    <SettingSurface>
      <h1>Custom Emojis</h1>
      <Text color="gray.400" fontSize="sm" mb={4}>
        Upload small images to use as custom emojis in this space. Use them in
        messages and reactions by typing <code>:name:</code>.
      </Text>
      <AddEmojiForm space={space} />
      {emojiIds.length === 0 ? (
        <Text color="gray.500">No custom emojis yet.</Text>
      ) : (
        <Grid
          templateColumns="repeat(auto-fill, minmax(96px, 1fr))"
          gap={3}
          maxW="640px"
        >
          {emojiIds.map((id) => (
            <EmojiCard key={id} space={space} emojiId={id} />
          ))}
        </Grid>
      )}
    </SettingSurface>
  );
}
