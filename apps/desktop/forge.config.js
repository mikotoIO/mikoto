module.exports = {
  packagerConfig: {
    asar: true,
    prune: false,
    icon: 'assets/icon.png',
  },

  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      platforms: ['win32'],
      config: {},
    },
    {
      name: '@electron-forge/maker-dmg',
      platforms: ['darwin'],
      config: {},
    },
    {
      name: '@electron-forge/maker-deb',
      platforms: ['linux'],
      config: {
        bin: 'Mikoto',
      },
    },
  ],
  publishers: [
    // {
    //   name: '@electron-forge/publisher-github',
    //   config: {
    //     repository: {
    //       owner: 'mikotoIO',
    //       name: 'desktop',
    //     },
    //   }
    // }

    {
      name: '@electron-forge/publisher-gcs',
      config: {
        storageOptions: {
          projectId: 'agile-ratio-354703'
        },
        bucket: 'mikoto-app',
        folder: 'mikoto-desktop',
        public: true,
      }
    }
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives',
      config: {},
    },
  ],
};
