import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import Picker from '@emoji-mart/react';

function shortcodeOf(selection: unknown): string | null {
  if (
    typeof selection === 'object' &&
    selection !== null &&
    'shortcodes' in selection &&
    typeof selection.shortcodes === 'string'
  ) {
    return selection.shortcodes;
  }
  return null;
}

export default function EmojiPicker({
  onEmojiSelect,
}: {
  onEmojiSelect?: (emoji: string) => void;
}) {
  const theme =
    document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
  return (
    <Picker
      data={emojiData}
      set="twitter"
      theme={theme}
      noCountryFlags={false}
      onEmojiSelect={(x: unknown) => {
        const code = shortcodeOf(x);
        if (code) onEmojiSelect?.(code);
      }}
    />
  );
}
