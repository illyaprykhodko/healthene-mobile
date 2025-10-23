// outsource dependencies
import React from 'react';
import moment from 'moment';
import WebView from "react-native-webview";
import {Linking, Pressable, StyleSheet, Text, View} from 'react-native';

// local dependencies
import { config } from 'constants'
import {BUSINESS_PROPERTIES} from "types";
import {useTheme} from "hooks/useTheme.ts";
import Screen from "components/Screen.tsx";
import {useGetTermsQuery} from "store/api/publicApi.ts";

export const TermsAndConditions = () => {
  const theme = useTheme();
  const handleAttach = async () => {
    if (config.landingUrl) {
      try {
        const supported = await Linking.canOpenURL(config.landingUrl);
        if (supported) {
          await Linking.openURL(config.landingUrl);
        } else {
          console.warn("Doesn't support URL: " + config.landingUrl);
        }
      } catch (err) {
        console.error('Open link Error:', err);
      }
    }
  };
  const { data, isLoading } = useGetTermsQuery(BUSINESS_PROPERTIES.TERMS_AND_CONDITIONS);
  console.log('Data', data);
  return <Screen initialized={!isLoading}>
    {data?.value
      ? <WebView
        allowFileAccess
        originWhitelist={['*']}
        source={{ html: html(data.value) }}
      />
      : null
    }
    <View style={styles.footer}>
      <Text>
        Healthene &copy;
        {' '}
        {moment().format('MMMM, YYYY')}
      </Text>
      <Pressable onPress={handleAttach}>
        <Text style={styles.link}>www.Healthene.com</Text>
      </Pressable>
    </View>
  </Screen>;
};

const styles = StyleSheet.create({
  footer: {
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: '#156F93',
    borderTopWidth: 1,
    borderTopColor: '#F3F3F3',
  },
  link: {
    fontSize: 12,
    color: '#F3F3F3',
    textDecorationLine: 'underline',
  },
});

const html = (data: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta content="text/html; charset=UTF-8" http-equiv="content-type">
  <meta name="viewport" content="user-scalable=no, initial-scale=1.0, maximum-scale=1.0, width=device-width">
  <title> Term and Conditionals </title>
</head>
<style>
  body {
    padding-left: 15px;
    padding-right: 15px;
    font-family: 'Roboto', sans-serif, Arial, Helvetica;
  }
</style>
<body>
  ${data}
</body>
</html>
`;
