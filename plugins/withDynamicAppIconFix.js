const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Patches expo-dynamic-app-icon's build.gradle to use JVM 17
 * instead of 11, fixing the "Inconsistent JVM Target" build error.
 */
const withDynamicAppIconFix = (config) =>
  withDangerousMod(config, [
    "android",
    (config) => {
      const buildGradlePath = path.join(
        config.modRequest.projectRoot,
        "node_modules",
        "expo-dynamic-app-icon",
        "android",
        "build.gradle"
      );

      let contents = fs.readFileSync(buildGradlePath, "utf8");

      contents = contents
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

      fs.writeFileSync(buildGradlePath, contents, "utf8");
      return config;
    },
  ]);

module.exports = withDynamicAppIconFix;
