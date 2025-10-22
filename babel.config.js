module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@constants': './src/constants',
          '@services': './src/services',
          '@store': './src/store',
          '@screens': './src/screens',
          '@navigation': './src/navigation',
        },
      },
    ],
    // important: the reanimated plugin must be last
    'react-native-worklets/plugin'
  ],
};
