// In development, disable EAS updates so Expo Go loads only from Metro (avoids "Failed to download remote update").
module.exports = ({ config }) => {
  const isDev = process.env.NODE_ENV !== 'production';
  return {
    expo: {
      ...config,
      updates: {
        ...(config.updates || {}),
        enabled: !isDev,
        checkAutomatically: isDev ? 'NEVER' : 'ON_LOAD',
      },
      plugins: [
        ...(config.plugins || []),
      ],
    },
  };
};
