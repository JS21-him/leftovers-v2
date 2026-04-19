// Web stub for react-native-purchases — native module not available on web
const Purchases = {
  setLogLevel: () => {},
  configure: () => {},
  getCustomerInfo: async () => ({ entitlements: { active: {} } }),
  getOfferings: async () => ({ current: null }),
  purchasePackage: async () => { throw new Error('Purchases not available on web'); },
  restorePurchases: async () => ({ entitlements: { active: {} } }),
};

export const LOG_LEVEL = { ERROR: 'ERROR' };
export default Purchases;
