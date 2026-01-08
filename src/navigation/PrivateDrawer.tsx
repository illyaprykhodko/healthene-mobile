// outsource dependencies
import React from 'react';
import { Dimensions } from 'react-native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { createDrawerNavigator } from '@react-navigation/drawer';

// local dependencies
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset.ts';
import BackButton from 'components/BackButton.tsx';
import Shopping from 'screens/privateScreens/Shopping';
import MessengerStack from 'navigation/MessengerStack.tsx';
import DayOverview from 'screens/privateScreens/DayOverview';
import { MainScreen } from 'screens/privateScreens/MainScreen';
import { CustomDrawerContent } from 'components/CustomDrawerContent';
import AboutPlanScreen from 'screens/privateScreens/AboutPlanScreen.tsx';
import { PlaceholderScreen } from 'screens/privateScreens/PlaceholderScreen';

const Drawer = createDrawerNavigator();
const { width } = Dimensions.get('window');

export const PrivateDrawer: React.FC = () => {
    const theme = useTheme();

    return (
        <Drawer.Navigator
            backBehavior="history"
            initialRouteName={ROUTES.MAIN}
            drawerContent={props => <CustomDrawerContent {...props} />}
            screenOptions={({ navigation }) => ({
                headerShown: true,
                drawerPosition: 'right',
                gestureDirection: 'horizontal-inverted',
                headerLeft: () => (
                    <BackButton navigation={navigation} theme={theme} />
                ),
                headerStyle: {
                    backgroundColor: theme.colors.primary,
                },
                headerTintColor: theme.colors.white,
                headerLeftContainerStyle: {
                    paddingLeft: OFFSET.HORIZONTAL,
                },
                headerTitleStyle: {
                    fontWeight: '600'
                },
                drawerActiveBackgroundColor: 'transparent',
                drawerLabelStyle: {
                    fontSize: 16,
                    color: theme.colors.text,
                },
                drawerStyle: {
                    width: width * 0.8,
                    backgroundColor: theme.colors.background,
                },
            })}
        >
            <Drawer.Screen
                name={ROUTES.MAIN}
                component={MainScreen}
                options={{
                    headerShown: false,
                    drawerItemStyle: { display: 'none' },
                }}
            />

            <Drawer.Screen
                component={DayOverview}
                name={ROUTES.DAILY_PLAN}
                options={{
                    headerShown: false,
                    title: 'My Daily Plan',
                    drawerIcon: ({ color }) => (
                        <Icon name="file" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                component={Shopping}
                name={ROUTES.SHOPPING}
                options={{
                    headerShown: false,
                    title: 'Shopping List',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="shopping-cart" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.MESSENGER}
                component={MessengerStack}
                options={{
                    headerShown: false,
                    drawerIcon: ({ color }) => (
                        <Icon name="comments" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.MY_RESULTS}
                component={PlaceholderScreen}
                options={{
                    title: 'My Results',
                    drawerIcon: ({ color }) => (
                        <Icon name="chart-bar" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.ABOUT_PLAN}
                component={AboutPlanScreen}
                options={{
                    title: 'About Plan',
                    drawerIcon: ({ color }) => (
                        <Icon name="clipboard" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.HEALTH_PROFILE}
                component={PlaceholderScreen}
                options={{
                    title: 'My Health Profile',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="heartbeat" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.LIBRARY}
                component={PlaceholderScreen}
                options={{
                    title: 'Library',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="book" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.INFO}
                component={PlaceholderScreen}
                options={{
                    title: 'Info',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="info-circle" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.MEAL_PREFERENCES}
                component={PlaceholderScreen}
                options={{
                    title: 'Meal Preferences',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="glasses" size={24} color={color} />
                    ),
                }}
            />

            <Drawer.Screen
                name={ROUTES.CUISINE_DISTRIBUTION}
                component={PlaceholderScreen}
                options={{
                    title: 'Cuisine Distribution',
                    drawerIcon: ({ color }) => (
                        <Icon iconStyle="solid" name="award" size={24} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};
