const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */

const {
    wrapWithReanimatedMetroConfig,
  } = require('react-native-reanimated/metro-config');

const {
 withSentryConfig
} = require("@sentry/react-native/metro");

const config = {};


const defaultConfig = getDefaultConfig(__dirname);

const merged = mergeConfig(defaultConfig, config);
module.exports = withSentryConfig(wrapWithReanimatedMetroConfig(merged));
