// Pre-setup: runs before any test modules are loaded.
// Polyfill structuredClone so the Expo lazy getter never fires during module
// import, which causes Jest 30's "import outside of test scope" error.
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = require('@ungap/structured-clone').default;
}
