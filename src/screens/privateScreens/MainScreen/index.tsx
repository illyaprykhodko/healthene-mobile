// outsource dependencies
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { View, StyleSheet, Image, Dimensions } from 'react-native';

// local dependencies
import Text from '../../../components/Text';
import Screen from '../../../components/Screen';
import { useTheme } from '../../../hooks/useTheme';
import { ROUTES } from '../../../constants/routes';
import { Button } from '../../../components/Button';
import { Hamburger } from '../../../components/Hamburger';
import { RootState, useAppSelector } from '../../../store';

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

    return (
        <Screen style={styles.container} initialized={true}>
            <View style={[styles.header, { backgroundColor: theme.colors.background }]}>
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
                
                <Button
                    title="Get Started"
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
    header: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 10,
    },
    hamburger: {
        marginRight: 8,
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    descriptionWrapper: {
        flexDirection: 'row',
        marginBottom: 20,
        marginTop: 40,
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
        paddingTop: 40,
    },
    image: {
        height: '100%',
        width: '100%',
        maxWidth: width * 0.8,
    },
    button: {
        marginBottom: 24,
    },
});
