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
import { COLORS } from 'constants/colors';
import { Button } from 'components/Button';
import { TextLogo } from 'components/TextLogo';
import StackHeader from 'components/StackHeader';
import { RootState, useAppSelector } from 'store';
import { SplashScreen } from 'components/SplashScreen';
import { useGetWelcomeQuery } from 'store/api/publicApi';

type DrawerParamList = {
    [ROUTES.MAIN]: undefined;
    [ROUTES.INFO]: undefined;
    [ROUTES.LIBRARY]: undefined;
    [ROUTES.SHOPPING]: undefined;
    [ROUTES.MESSENGER]: undefined;
    [ROUTES.ABOUT_PLAN]: undefined;
    [ROUTES.MY_RESULTS]: undefined;
    [ROUTES.MEAL_PREFERENCES]: undefined;
    [ROUTES.HEALTH_PROFILE_STACK]: undefined;
    [ROUTES.CUISINE_DISTRIBUTION]: undefined;
    [ROUTES.DAILY_PLAN]: { screen?: string } | undefined;
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
        navigation.navigate(ROUTES.DAILY_PLAN, { screen: ROUTES.DAY_OVERVIEW });
    };

    const handleOpenDrawer = () => {
        navigation.openDrawer();
    };
    if (isLoading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    return (
        <Screen style={styles.container} initialized={true}>
            <StackHeader
                showBack={false}
                onOpenDrawer={handleOpenDrawer}
                centerContent={<TextLogo color={theme.colors.background} />}
            />

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
                    title="Get Started"
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
        borderWidth: 2,
        borderColor: COLORS.BLACK,
        backgroundColor: 'transparent',
        marginBottom: 15
    },
    buttonText: {
        fontSize: 16,
        color: COLORS.BLACK,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});
