# EAS Update / OTA Updates

PrepAI uses EAS Update for over-the-air updates that are compatible with the installed native runtime.

## What OTA Can Change

OTA updates are suitable for JavaScript and UI changes, such as:

- Copy and wording updates.
- Layout, spacing, and style fixes.
- Non-native screen logic fixes.
- API request handling changes that do not require native config changes.

## What Requires A New APK

Build a new APK whenever a change affects native runtime compatibility, including:

- Adding, removing, or upgrading native dependencies.
- Changing Expo plugins or native app config.
- Changing Android permissions, notification channel behavior that depends on native config, package name, icons, splash assets that require native rebuilds, or build profile settings.
- Changing `runtimeVersion` policy or app version.

This repository has a native `android/` directory, so EAS treats it as a native/bare workflow project. Runtime version policies are not supported in that mode. The app therefore uses a manual runtime version that matches the current app version:

```json
{
  "runtimeVersion": "1.0.0"
}
```

This means OTA updates are compatible only with builds that have the same `1.0.0` runtime. Native/runtime changes require a new APK and, when appropriate, a new runtime version.

## Channels

EAS build profiles use these channels:

- `development` for development-client builds.
- `preview` for internal preview APK builds.
- `production` for future store builds.

## Publish A Preview OTA Update

After a preview APK has been built and installed with the `preview` channel, publish JS/UI-only fixes with:

```sh
eas update --branch preview --message "Describe the JS/UI fix"
```

Do not publish OTA updates for native dependency, Expo plugin, or native configuration changes. Build a new APK instead.

## Runtime Behavior

The app checks for updates once after startup/auth initialization. Update checks are skipped in `__DEV__` and fail silently if unavailable.
