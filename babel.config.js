module.exports = function (babel) {
  babel.cache(true);
  const isTest = process.env.NODE_ENV === 'test' || process.env.BABEL_ENV === 'test';
  return {
    presets: [
      [require('expo/internal/babel-preset'), isTest ? { reanimated: false } : {}],
    ],
    plugins: [
      ['module-resolver', { root: ['.'], alias: { '@': '.' } }],
    ],
  };
};
