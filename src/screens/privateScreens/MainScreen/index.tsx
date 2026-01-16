// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { View, StyleSheet, Image, Platform } from 'react-native';

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
import { useGetWelcomeQuery } from 'store/api/publicApi';

type DrawerParamList = {
    [ROUTES.MAIN]: undefined;
    [ROUTES.INFO]: undefined;
    [ROUTES.LIBRARY]: undefined;
    [ROUTES.SHOPPING]: undefined;
    [ROUTES.MESSENGER]: undefined;
    [ROUTES.DAILY_PLAN]: undefined;
    [ROUTES.ABOUT_PLAN]: undefined;
    [ROUTES.MY_RESULTS]: undefined;
    [ROUTES.MEAL_PREFERENCES]: undefined;
    [ROUTES.HEALTH_PROFILE_STACK]: undefined;
    [ROUTES.CUISINE_DISTRIBUTION]: undefined;
};

export const MainScreen: React.FC = () => {
    const theme = useTheme();
    const navigation = useNavigation<DrawerNavigationProp<DrawerParamList>>();
    const user = useAppSelector((state: RootState) => state.app.user);

    const { data: welcomeData, isLoading } = useGetWelcomeQuery();
    const welcomeImageUrl = welcomeData?.image?.url;

    const timeGreeting = () => {
        const hour = new Date().getHours();
        const name = user?.firstName || '';

        if (hour < 12) { return `Good Morning\n${name}`; }
        if (hour < 18) { return `Good Afternoon\n${name}`; }
        return `Good Evening\n${name}`;
    };

    const handleGetStarted = () => {
        navigation.navigate(ROUTES.DAILY_PLAN);
    };

    const handleOpenDrawer = () => {
        navigation.openDrawer();
    };

    return (
        <Screen style={styles.container} initialized={!isLoading}>
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
                    {welcomeImageUrl && (
                        <Image
                            resizeMode="contain"
                            style={styles.image}
                            source={{ uri: welcomeImageUrl }}
                        />
                    )}
                </View>

                <Button
                    title="GET STARTED"
                    style={styles.button}
                    onPress={handleGetStarted}
                    textStyle={styles.buttonText}
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
        marginTop: OFFSET.VERTICAL * 5,
    },
    title: {
        flex: 1,
        fontSize: 32,
        textAlign: 'center',
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
    imageWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingTop: OFFSET.VERTICAL * 2,
    },
    image: {
        height: '100%',
        width: '100%',
        resizeMode: 'contain',
    },
    button: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#96E072',
        borderColor: 'transparent',
    },
    buttonText: {
        fontSize: 20,
        color: '#4E733C',
        paddingVertical: 3,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});
