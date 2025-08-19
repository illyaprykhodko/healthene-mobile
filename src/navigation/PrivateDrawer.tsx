// outsource dependencies
import React from 'react';
import { Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { createDrawerNavigator } from '@react-navigation/drawer';

// local dependencies
import { ROUTES } from '../constants/routes';
import { useTheme } from '../hooks/useTheme';
import DayOverview from '../screens/privateScreens/DayOverview';
import { MainScreen } from '../screens/privateScreens/MainScreen';
import { CustomDrawerContent } from '../components/CustomDrawerContent';
import { PlaceholderScreen } from '../screens/privateScreens/PlaceholderScreen';

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
                drawerPosition: 'right',
                gestureDirection: 'horizontal-inverted',
                // headerShown: true,
                headerShown: false,
                headerStyle: {
                    backgroundColor: theme.colors.background,
                },
                headerTintColor: theme.colors.text,
                headerTitleStyle: {
                    fontWeight: '600',
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
                    title: 'My Daily Plan',
                    drawerIcon: ({ color }) => (
                        <Icon name="file" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.SHOPPING}
                component={() => <PlaceholderScreen title="Shopping List" />}
                options={{
                    title: 'Shopping List',
                    drawerIcon: ({ color }) => (
                        <Icon name="shopping-cart" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.COMMUNICATION}
                component={() => <PlaceholderScreen title="Messages" />}
                options={{
                    title: 'Messages',
                    drawerIcon: ({ color }) => (
                        <Icon name="comments" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.MY_RESULTS}
                component={() => <PlaceholderScreen title="My Results" />}
                options={{
                    title: 'My Results',
                    drawerIcon: ({ color }) => (
                        <Icon name="chart-bar" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.ABOUT_PLAN}
                component={() => <PlaceholderScreen title="About Plan" />}
                options={{
                    title: 'About Plan',
                    drawerIcon: ({ color }) => (
                        <Icon name="clipboard" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.HEALTH_PROFILE}
                component={() => <PlaceholderScreen title="My Health Profile" />}
                options={{
                    title: 'My Health Profile',
                    drawerIcon: ({ color }) => (
                        <Icon name="heartbeat" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.LIBRARY}
                component={() => <PlaceholderScreen title="Library" />}
                options={{
                    title: 'Library',
                    drawerIcon: ({ color }) => (
                        <Icon name="book" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.INFO}
                component={() => <PlaceholderScreen title="Info" />}
                options={{
                    title: 'Info',
                    drawerIcon: ({ color }) => (
                        <Icon name="info-circle" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.MEAL_PREFERENCES}
                component={() => <PlaceholderScreen title="Meal Preferences" />}
                options={{
                    title: 'Meal Preferences',
                    drawerIcon: ({ color }) => (
                        <Icon name="glass" size={24} color={color} />
                    ),
                }}
            />
            
            <Drawer.Screen
                name={ROUTES.CUISINE_DISTRIBUTION}
                component={() => <PlaceholderScreen title="Cuisine Distribution" />}
                options={{
                    title: 'Cuisine Distribution',
                    drawerIcon: ({ color }) => (
                        <Icon name="award" size={24} color={color} />
                    ),
                }}
            />
        </Drawer.Navigator>
    );
};
