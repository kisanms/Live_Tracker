// notifee-plugin.js
const { withPlugins, createRunOncePlugin } = require("@expo/config-plugins");
const { withAndroidManifest } = require("@expo/config-plugins");

const withNotifeePermissions = (config) => {
  return withAndroidManifest(config, async (config) => {
    const manifest = config.modResults;
    const mainApplication = manifest.manifest.application[0];

    manifest.manifest["uses-permission"] = [
      ...(manifest.manifest["uses-permission"] || []),
      { $: { "android:name": "android.permission.VIBRATE" } },
      { $: { "android:name": "android.permission.RECEIVE_BOOT_COMPLETED" } },
    ];

    mainApplication.service = [
      ...(mainApplication.service || []),
      {
        $: {
          "android:name": "io.invertase.notifee.NotifeeService",
          "android:exported": "false",
        },
      },
    ];

    return config;
  });
};

module.exports = createRunOncePlugin(
  withNotifeePermissions,
  "notifee",
  "1.0.0"
);
