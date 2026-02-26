const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Patches expo-dynamic-app-icon:
 * 1. build.gradle: JVM 11 → 17 (fixes "Inconsistent JVM Target" build error)
 * 2. withDynamicIcon.js: backgroundColor "#ffffff" → "transparent" and
 *    resizeMode "cover" → "contain" for Android icons, so the launcher
 *    doesn't wrap them in a white circle on Pixel devices.
 */
const withDynamicAppIconFix = (config) =>
  withDangerousMod(config, [
    "android",
    (config) => {
      const root = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "expo-dynamic-app-icon"
      );

      // Patch 1: build.gradle JVM target
      const buildGradlePath = path.join(root, "android", "build.gradle");
      let gradle = fs.readFileSync(buildGradlePath, "utf8");
      gradle = gradle
        .replace(
          "sourceCompatibility JavaVersion.VERSION_11",
          "sourceCompatibility JavaVersion.VERSION_17"
        )
        .replace(
          "targetCompatibility JavaVersion.VERSION_11",
          "targetCompatibility JavaVersion.VERSION_17"
        )
        .replace(
          "jvmTarget = JavaVersion.VERSION_11.majorVersion",
          "jvmTarget = JavaVersion.VERSION_17.majorVersion"
        );
      fs.writeFileSync(buildGradlePath, gradle, "utf8");

      // Patch 2: remove hardcoded white background on Android icons
      // The plugin forces backgroundColor: "#ffffff" + resizeMode: "cover"
      // which causes a white circle on Pixel adaptive icon launchers.
      // We remove the backgroundColor so the image is used as-is.
      const pluginPath = path.join(
        root,
        "plugin",
        "build",
        "withDynamicIcon.js"
      );
      let plugin = fs.readFileSync(pluginPath, "utf8");
      // Android block: 28-space indent, preceded by "// removeTransparency" comment
      plugin = plugin.replace(
        '\n                            backgroundColor: "#ffffff",\n                            resizeMode: "cover",',
        '\n                            resizeMode: "contain",'
      );
      fs.writeFileSync(pluginPath, plugin, "utf8");

      return config;
    },
  ]);

module.exports = withDynamicAppIconFix;
