const React = require('react');
const { View, ScrollView, FlatList, Switch, TextInput } = require('react-native');

const GestureHandlerRootView = ({ children, ...props }) =>
  React.createElement(View, props, children);

const Swipeable = ({ children, ...props }) =>
  React.createElement(View, props, children);

const ReanimatedSwipeable = ({ children, renderRightActions, renderLeftActions, ...props }) =>
  React.createElement(View, props, children);

const GestureDetector = ({ children }) => children || null;

// Fluent gesture builder — every method returns `this` so chaining works
function makeFluentGesture() {
  const self = {
    enabled: function() { return self; },
    maxDuration: function() { return self; },
    onBegin: function() { return self; },
    onFinalize: function() { return self; },
    onEnd: function() { return self; },
    onUpdate: function() { return self; },
    onStart: function() { return self; },
    onChange: function() { return self; },
    simultaneousWithExternalGesture: function() { return self; },
    requireExternalGestureToFail: function() { return self; },
    activeOffsetX: function() { return self; },
    activeOffsetY: function() { return self; },
    failOffsetX: function() { return self; },
    failOffsetY: function() { return self; },
    minDistance: function() { return self; },
    minVelocity: function() { return self; },
    hitSlop: function() { return self; },
    withRef: function() { return self; },
    config: {},
  };
  return self;
}

const Gesture = {
  Tap: () => makeFluentGesture(),
  Pan: () => makeFluentGesture(),
  LongPress: () => makeFluentGesture(),
  Pinch: () => makeFluentGesture(),
  Rotation: () => makeFluentGesture(),
  Fling: () => makeFluentGesture(),
  Simultaneous: (...gestures) => makeFluentGesture(),
  Race: (...gestures) => makeFluentGesture(),
  Exclusive: (...gestures) => makeFluentGesture(),
};

module.exports = {
  GestureHandlerRootView,
  Swipeable,
  ReanimatedSwipeable,
  GestureDetector,
  Gesture,
  ScrollView,
  FlatList,
  Switch,
  TextInput,
  State: { BEGAN: 0, FAILED: 1, ACTIVE: 2, END: 3, CANCELLED: 4, UNDETERMINED: 5 },
  Directions: { RIGHT: 1, LEFT: 2, UP: 4, DOWN: 8 },
};
