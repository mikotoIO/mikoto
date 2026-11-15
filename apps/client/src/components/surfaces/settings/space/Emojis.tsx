import { Smile } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button, PageTitle } from '@/design';
import { SettingSurface } from '@/views';

import { ListEmpty } from '../common';

export function EmojiSubsurface() {
  const { t } = useTranslation();
  return (
    <SettingSurface>
      <PageTitle
        title={t('spaceSettings.emojis.title')}
        description="Custom emoji that everyone in this space can use."
      />
      <ListEmpty
        icon={<Smile size={18} />}
        title="No custom emoji yet"
        description="Uploading custom emoji isn't available yet. When it is, you'll add them here."
        action={<Button disabled>Upload emoji</Button>}
      />
    </SettingSurface>
  );
}
