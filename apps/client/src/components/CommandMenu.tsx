import { Modal } from '@mikoto-io/lucid';
import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';

import { modalState } from './ContextMenu';

export function CommandMenuKit() {
  const setModal = useSetRecoilState(modalState);
  useEffect(() => {
    const fn = (ev: KeyboardEvent) => {
      if (!ev.ctrlKey) return;
      if (ev.key !== 'p') return;
      ev.preventDefault();

      setModal({
        elem: <Modal>Command menu</Modal>,
      });
    };
    document.addEventListener('keydown', fn);
    return () => {
      document.removeEventListener('keydown', fn);
    };
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <></>;
}
