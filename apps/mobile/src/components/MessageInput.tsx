import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { colors, borderRadius, spacing } from '../theme';

interface MessageInputProps {
  placeholder?: string;
  onSubmit: (content: string) => void;
  onTyping?: () => void;
}

export function MessageInput({ placeholder, onSubmit, onTyping }: MessageInputProps) {
  const [text, setText] = useState('');

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={text}
        onChangeText={(t) => {
          setText(t);
          onTyping?.();
        }}
        placeholder={placeholder ?? 'Type a message...'}
        placeholderTextColor={colors.N500}
        selectionColor={colors.B500}
        multiline
        maxLength={4000}
      />
      <Pressable
        onPress={handleSend}
        style={[styles.sendButton, !text.trim() && styles.sendButtonDisabled]}
        disabled={!text.trim()}
      >
        <Ionicons
          name="send"
          size={20}
          color={text.trim() ? colors.N0 : colors.N500}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    backgroundColor: colors.N900,
    borderTopWidth: 1,
    borderTopColor: colors.N700,
  },
  input: {
    flex: 1,
    backgroundColor: colors.N700,
    color: colors.N0,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 15,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.B700,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.N600,
  },
});
