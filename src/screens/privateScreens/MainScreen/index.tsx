// outsource dependencies
import moment from 'moment';
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
import DefImage from 'components/DefImage';
import { TextLogo } from 'components/TextLogo';
import { Hamburger } from 'components/Hamburger';
import { RootState, useAppSelector } from 'store';
import { SplashScreen } from 'components/SplashScreen';
import { useDayAdherence } from 'hooks/useDayAdherence';
import { ActivityRings } from 'components/ActivityRings';
import { useGetWelcomeQuery } from 'store/api/publicApi';
import { DayAdherenceCard } from 'components/DayAdherenceCard';

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
    const adherence = useDayAdherence(moment().format('YYYY-MM-DD'));

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
    if (isLoading) {
        return <SplashScreen onFinish={() => {}} />;
    }

    return (
        <Screen style={styles.container} initialized={true}>
            <View style={[styles.header, { backgroundColor: theme.colors.headerBg }]}>
                <View style={styles.textLogoWrapper}>
                    <TextLogo color={theme.colors.headerText} />
                </View>
                <Hamburger onPress={handleOpenDrawer} style={styles.hamburger} />
            </View>

            <View style={styles.content}>
                {/* {adherence.hasData && (
                    <View style={styles.ringsWrapper}>
                        <DayAdherenceCard date={moment().format('YYYY-MM-DD')} />
                        <ActivityRings
                            gap={4}
                            size={104}
                            strokeWidth={9}
                            rings={adherence.rings}
                            centerText={`${Math.round(adherence.overall * 100)}%`}
                        />
                    </View>
                )} */}
                <View style={styles.descriptionWrapper}>
                    <Text variant="h1" style={[styles.title, { color: theme.colors.text }]}>
                        {timeGreeting()}
                    </Text>
                </View>
                { theme.dark
                    ? <View style={styles.altWrapper}>
                        {/* <DayAdherenceCard date={moment().format('YYYY-MM-DD')} /> */}
                        {adherence.hasData && (
                            <ActivityRings
                                gap={4}
                                size={250}
                                strokeWidth={25}
                                rings={adherence.rings}
                                centerText={`${Math.round(adherence.overall * 100)}%`}
                            />)}
                    </View>
                    : <View style={styles.imageWrapper}>
                        {welcomeImageUrl && (
                        // <DefImage src={welcomeImageUrl} style={styles.image} />
                            <Image
                                resizeMode="contain"
                                style={styles.image}
                                source={{ uri: welcomeImageUrl }}
                            />
                        )}
                    </View>
                }
                <Button
                    title="Get Started"
                    onPress={handleGetStarted}
                    style={[styles.button, { borderColor: theme.colors.text }]}
                    textStyle={StyleSheet.flatten([styles.buttonText, { color: theme.colors.text }])}
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
    ringsWrapper: {
        alignItems: 'center',
        marginVertical: OFFSET.POINT,
    },
    altWrapper: {
        flex: 1,
        alignItems: 'center',
        paddingTop: OFFSET.VERTICAL * 5,
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
        // borderColor: 'transparent',
        // backgroundColor: '#96E072',
    },
    buttonText: {
        fontSize: 16,
        color: COLORS.BLACK,
        // color: '#4E733C',
        // paddingVertical: 3,
        fontWeight: Platform.OS === 'ios' ? '600' : '700',
    },
});
