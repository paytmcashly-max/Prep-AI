const trimTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const defaultSiteUrl = "https://intervueai.tech";
const defaultApkDownloadUrl =
  "https://github.com/paytmcashly-max/Prep-AI/releases/download/v1.0.0-public-beta/app-release.apk";
const defaultAppDeepLink = "prepai://";
const defaultSupportEmail = "kishan@kishan.codes";

const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || defaultSiteUrl;
const rawApkDownloadUrl = process.env.NEXT_PUBLIC_APK_DOWNLOAD_URL || defaultApkDownloadUrl;
const rawAppDeepLink = process.env.NEXT_PUBLIC_APP_DEEP_LINK || defaultAppDeepLink;
const rawSupportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL || defaultSupportEmail;

export const siteUrl = trimTrailingSlash(rawSiteUrl);
export const apkDownloadUrl = rawApkDownloadUrl;
export const appDeepLink = rawAppDeepLink;
export const supportEmail = rawSupportEmail;
export const supportEmailHref = `mailto:${rawSupportEmail}`;
export const paywallDeepLink = rawAppDeepLink.endsWith("/")
  ? `${rawAppDeepLink}paywall`
  : `${rawAppDeepLink}/paywall`;
