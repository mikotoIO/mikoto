import emojiData from '@emoji-mart/data/sets/14/twitter.json';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';

init({ data: emojiData });

export default function EmojiPicker({
  onEmojiSelect,
}: {
  onEmojiSelect?: (emoji: string) => void;
}) {
  return (
    <Picker
      data={emojiData}
      set="twitter"
      noCountryFlags={false}
      onEmojiSelect={(x: any) => {
        onEmojiSelect?.(x.shortcodes);
      }}
    />
  );
}
