const React = require('react');
const { View } = require('react-native');
module.exports = {
  BlurView: ({ children, style, ...props }) => React.createElement(View, { style, ...props }, children),
};
