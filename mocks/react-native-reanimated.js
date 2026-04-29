const React = require('react');
const { View, Text, Image, ScrollView, FlatList } = require('react-native');

const Animated = {
  View,
  Text,
  Image,
  ScrollView,
  FlatList,
  createAnimatedComponent: (component) => component,
};

const useSharedValue = (initial) => ({ value: initial });
const useAnimatedStyle = (fn) => ({});
const useDerivedValue = (fn) => ({ value: fn() });
const useAnimatedScrollHandler = (handlers) => () => {};

const withSpring = (value) => value;
const withTiming = (value) => value;
const withDelay = (delay, animation) => animation;
const withRepeat = (animation) => animation;
const withSequence = (...animations) => animations[0];
const runOnJS = (fn) => fn;
const runOnUI = (fn) => fn;
const cancelAnimation = () => {};
const interpolate = (value, input, output) => output[0];
const Extrapolation = { CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity' };
const Easing = {
  linear: (t) => t,
  ease: (t) => t,
  quad: (t) => t,
  cubic: (t) => t,
  bezier: () => (t) => t,
  in: (easing) => easing,
  out: (easing) => easing,
  inOut: (easing) => easing,
};

const FadeIn = { duration: () => ({ withInitialValues: () => ({}) }), delay: () => ({ springify: () => ({ damping: () => ({}) }) }) };
const FadeOut = { duration: () => ({}) };
const FadeInDown = {
  delay: function() { return this; },
  duration: function() { return this; },
  springify: function() { return this; },
  damping: function() { return this; },
};
const FadeOutLeft = {
  duration: function() { return this; },
  delay: function() { return this; },
};

const SlideInRight = { delay: () => ({ springify: () => ({}) }) };
const SlideOutLeft = { duration: () => ({}) };

const Layout = { springify: () => ({}) };

module.exports = {
  __esModule: true,
  default: Animated,
  Animated,
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedScrollHandler,
  withSpring,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  runOnJS,
  runOnUI,
  cancelAnimation,
  interpolate,
  Extrapolation,
  Easing,
  FadeIn,
  FadeOut,
  FadeInDown,
  FadeOutLeft,
  SlideInRight,
  SlideOutLeft,
  Layout,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedGestureHandler: (handlers) => () => {},
  useAnimatedReaction: () => {},
  useWorkletCallback: (fn) => fn,
  makeMutable: (initial) => ({ value: initial }),
};
