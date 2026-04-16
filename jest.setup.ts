import '@testing-library/jest-native/extend-expect';

// Eagerly resolve the ExpoImportMetaRegistry lazy getter to prevent
// "import outside of test scope" errors from Jest 30 + Expo SDK 54.
if (typeof (globalThis as Record<string, unknown>).__ExpoImportMetaRegistry === 'undefined') {
  // Access the property to trigger the lazy getter while still inside test scope.
  void (globalThis as Record<string, unknown>).__ExpoImportMetaRegistry;
}

// Suppress act() warnings from async state updates completing after test teardown.
// These occur when hooks have async useEffect calls that resolve after the test assertions.
const originalError = console.error.bind(console.error);
beforeAll(() => {
  console.error = (msg: string, ...args: unknown[]) => {
    if (
      typeof msg === 'string' &&
      msg.includes('not wrapped in act')
    ) {
      return;
    }
    originalError(msg, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
