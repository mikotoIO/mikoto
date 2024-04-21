import { Extension } from '@tiptap/react';

export const Shortcuts = Extension.create({
  name: 'shortcuts',
  addKeyboardShortcuts() {
    return {
      'Mod-s': ({ editor }) => {
        console.log('saving');
        return true;
      },
    };
  },
});
