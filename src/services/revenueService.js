import Purchases from "react-native-purchases";

export const configureRevenueCat = ({ apiKey, appUserId } = {}) => {
  if (!apiKey) {
    return;
  }

  Purchases.configure({ apiKey, appUserID: appUserId });
};

export const getCustomerInfo = () => Purchases.getCustomerInfo();

export const isPremiumCustomer = async () => {
  const customerInfo = await getCustomerInfo();

  return Boolean(customerInfo.entitlements.active.premium);
};
