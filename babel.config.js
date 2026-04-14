module.exports = function (babel) {
  babel.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
      'react-native-reanimated/plugin',
    ],
  };
};
