export const maybeElectron = /electron/i.test(navigator.userAgent)
  ? await import('electron')
  : undefined;
