// outsource dependencies
import React, { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { View, StyleSheet, Image, Dimensions, Platform } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { TextLogo } from 'components/TextLogo';
import { Hamburger } from 'components/Hamburger';
import { RootState, useAppSelector } from 'store';
import RNFS from 'react-native-fs';
import { WebView } from 'react-native-webview';

const { width } = Dimensions.get('window');

type DrawerParamList = {
    [ROUTES.MAIN]: undefined;
    [ROUTES.INFO]: undefined;
    [ROUTES.LIBRARY]: undefined;
    [ROUTES.SHOPPING]: undefined;
    [ROUTES.DAILY_PLAN]: undefined;
    [ROUTES.ABOUT_PLAN]: undefined;
    [ROUTES.MY_RESULTS]: undefined;
    [ROUTES.COMMUNICATION]: undefined;
    [ROUTES.HEALTH_PROFILE]: undefined;
    [ROUTES.MEAL_PREFERENCES]: undefined;
    [ROUTES.CUISINE_DISTRIBUTION]: undefined;
};

export const MainScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const user = useAppSelector((state: RootState) => state.app.user);
    const timeGreeting = () => {
        const hour = new Date().getHours();
        const name = user?.firstName || '';

        if (hour < 12) { return `Good Morning ${name}`; }
        if (hour < 18) { return `Good Afternoon ${name}`; }
        return `Good Evening ${name}`;
    };

    const handleGetStarted = () => {
        navigation.navigate(ROUTES.DAILY_PLAN);
    };

    const handleOpenDrawer = () => {
        navigation.openDrawer();
    };

    const [videoHtml, setVideoHtml] = useState('');
    const [video, setVideo] = useState('');


    useEffect(() => {


        const loadBase64 = async () => {
            try {
                const fileName = Platform.OS === 'ios'
                    ? 'bird_gabi.mov'
                    : 'bird_default.webm';

                const path = Platform.OS === 'ios'
                    ? `${RNFS.MainBundlePath}/${fileName}`
                    : `raw://${fileName.replace(/\.[^/.]+$/, '')}`;
                console.log('Path', path);
                const base64 = await RNFS.readFile(path, 'base64');
                setVideo(path);
                setVideoHtml(`
                                            <html>
                                              <head>
                                                <style>
                                                  body {
                                                    margin: 0;
                                                    background: transparent;
                                                    overflow: hidden;
                                                  }
                                                  #videoContainer {
                                                    position: absolute;
                                                    left: unset;
                                                    top: 0;
                                                    width: 250px;
                                                    height: 250px;
                                                    border: #449fdb 1px solid;
                                                   
                                                  }
                                                  #video {
                                                    z-index: 9999;
                                                  }
                                                  video {
                                                    width: 100%;
                                                    height: 100%;
                                                    object-fit: contain;
                                                  }
                                                </style>
                                              </head>
                                              <body>
                                                <div id="videoContainer">
                                                  <video 
                                                    loop 
                                                    muted
                                                    autoplay 
                                                    playsinline id="video"
                                                    onloadeddata="window.ReactNativeWebView.postMessage('Video loaded')"
                                                    onerror="window.ReactNativeWebView.postMessage('Video failed to load')"
                                                  >
                                                        <source src="data:video/mp4;base64,${base64}" type="video/mp4"/>
                                                  </video>
                                                </div>
                                                <script>
                                                  window.ReactNativeWebView.postMessage("Video script loaded successfully");
                                                  const container = document.getElementById('videoContainer');
                                                  const screenWidth = window.innerWidth;
                                                  const screenHeight = window.innerHeight;

                                                  let x = screenWidth - 150; // Start at right edge (minus video width)
                                                  let y = 0;
                                                  let phase = 1;

                                                  function animate() {
                                                    requestAnimationFrame(animate);

                                                    if (phase === 1) {
                                                      x -= 2;
                                                      y += 2;

                                                      // Phase 1 ends when at left edge and halfway down screen
                                                      if (x <= 0 && y >= screenHeight / 2) {
                                                        x = 0;
                                                        y = screenHeight / 2;
                                                        phase = 2;
                                                      }
                                                    } else if (phase === 2) {
                                                      x += 2;
                                                      y += 2;

                                                      // Phase 2 ends at bottom center
                                                      if (x >= screenWidth / 2 - 75 && y >= screenHeight - 150) {
                                                        x = screenWidth / 2 - 75;
                                                        y = screenHeight - 150;
                                                        phase = 3; // Stop
                                                      }
                                                    }

                                                    container.style.left = \`\${x}px\`;
                                                    container.style.top = \`\${y}px\`;
                                                  }

                                                  animate();
                                                </script>
                                              </body>
                                            </html>
                                            `);
            } catch (e) {
                console.warn('Error loading video HTML or base64:', e);
            }
        };
        loadBase64();
    }, []);

    return (
        <Screen style={styles.container} initialized={true}>
            <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
                <View style={styles.textLogoWrapper}>
                    <TextLogo color={theme.colors.background} />
                </View>
                <Hamburger onPress={handleOpenDrawer} style={styles.hamburger} />
            </View>

            <View style={styles.content}>
                <View style={styles.descriptionWrapper}>
                    <Text variant="h1" style={[styles.title, { color: theme.colors.text }]}>
                        {timeGreeting()}
                    </Text>
                </View>

                <View style={styles.imageWrapper}>
                    <Image
                        resizeMode="contain"
                        style={styles.image}
                        source={{ uri: 'https://via.placeholder.com/400x300/007AFF/FFFFFF?text=Welcome+Image' }}
                    />
                </View>
                <View
                    style={{
                        borderWidth: 1,
                        position: 'absolute',
                        top: 0,
                        bottom: 0,
                        left: 0,
                        right: 0,
                        zIndex: 1,
                        pointerEvents: 'none'
                    }}
                >
                    <WebView
                        style={{ backgroundColor: 'transparent' }}
                        source={{
                            html: videoHtml,
                        }}
                        onMessage={event => {
                            console.log('WebView JS:', event.nativeEvent.data);
                        }}
                        onError={e => console.log('Video error', e)}
                        allowsInlineMediaPlayback={true}
                        mediaPlaybackRequiresUserAction={false}
                        useWebKit={true}
                        originWhitelist={['*']}
                    />
                </View>
                <Button
                    title="GET STARTED"
                    style={styles.button}
                    onPress={handleGetStarted}
                />
            </View>
        </Screen>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    textLogo: {
        alignSelf: 'center',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        paddingTop: OFFSET.VERTICAL * 2.5,
        paddingBottom: OFFSET.POINT * 2.5,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    textLogoWrapper: {
        width: '90%',

    },
    hamburger: {
        marginRight: 8,
        alignItems: 'flex-end',
    },
    content: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingBottom: OFFSET.VERTICAL,
    },
    descriptionWrapper: {
        flexDirection: 'row',
        marginBottom: OFFSET.VERTICAL,
        marginTop: OFFSET.VERTICAL * 2,
    },
    title: {
        flex: 1,
        fontSize: 24,
        textAlign: 'center',
        fontWeight: '600',
    },
    imageWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingTop: OFFSET.VERTICAL * 2,
    },
    image: {
        height: '100%',
        width: '100%',
        maxWidth: width * 0.8,
    },
    button: {
        paddingVertical: OFFSET.VERTICAL,
        marginBottom: OFFSET.VERTICAL,
        borderRadius: 50,
        width: '90%',
        alignSelf: 'center',
    },
});
