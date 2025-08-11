// outsource dependencies
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';

// local dependencies
import Text from './Text';
import { Button } from './Button';
import { RootState } from '../store';
import { ROUTES } from '../constants/routes';
import { useTheme } from '../hooks/useTheme';
import { navigate } from '../services/navigation';
import { clearSession } from '../store/slices/appSlice';

const { width } = Dimensions.get('window');

interface DrawerItemProps {
    icon: string;
    title: string;
    badge?: number;
    focused: boolean;
    onPress: () => void;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, title, focused, onPress, badge }) => {
    const theme = useTheme();
    
    return (
        <TouchableOpacity
            style={[styles.menuItem, focused && styles.menuItemFocused]}
            onPress={onPress}
        >
            <Icon
                size={24}
                name={icon}
                style={styles.menuIcon}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
            />
            <Text
                variant="h5"
                style={styles.menuText}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
            >
                {title}
            </Text>
            {badge && (
                <View style={[styles.badgeContainer, { backgroundColor: theme.colors.error }]}>
                    <Text
                        variant="bold"
                        color={theme.colors.white}
                        style={styles.badgeText}
                    >
                        {badge > 99 ? '99+' : badge}
                    </Text>
                </View>
            )}
        </TouchableOpacity>
    );
};

interface CustomDrawerContentProps {
    state: any;
    navigation: any;
    descriptors: any;
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = props => {
    const theme = useTheme();
    const dispatch = useDispatch();
    const user = useSelector((state: RootState) => state.app.user);
    
    const handleLogout = () => {
        dispatch(clearSession());
    };

    const menuItems = [
        {
            icon: 'file',
            title: 'My Daily Plan',
            route: ROUTES.DAILY_PLAN,
        },
        {
            icon: 'shopping-cart',
            title: 'Shopping List',
            route: ROUTES.SHOPPING,
        },
        {
            icon: 'comments',
            title: 'Messages',
            route: ROUTES.COMMUNICATION,
        },
        {
            icon: 'chart-bar',
            title: 'My Results',
            route: ROUTES.MY_RESULTS,
        },
        {
            icon: 'clipboard',
            title: 'About Plan',
            route: ROUTES.ABOUT_PLAN,
        },
        {
            icon: 'heartbeat',
            title: 'My Health Profile',
            route: ROUTES.HEALTH_PROFILE,
        },
        {
            icon: 'book',
            title: 'Library',
            route: ROUTES.LIBRARY,
        },
        {
            icon: 'info-circle',
            title: 'Info',
            route: ROUTES.INFO,
        },
        {
            icon: 'award',
            title: 'Cuisine Distribution',
            route: ROUTES.CUISINE_DISTRIBUTION,
        },
    ];

    const getFocusedRoute = () => {
        return props.state?.routes[props.state?.index]?.name;
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                <View style={[styles.profileSection, { borderBottomColor: theme.colors.border }]}>
                    <Text variant="h4" color={theme.colors.text}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    <Text variant="body" color={theme.colors.textSecondary}>
                        {user?.email}
                    </Text>
                </View>
                {menuItems.map(item => {
                    const focused = getFocusedRoute() === item.route;
                    return (
                        <DrawerItem
                            key={item.route}
                            icon={item.icon}
                            focused={focused}
                            title={item.title}
                            onPress={() => navigate(item.route)}
                        />
                    );
                })}
                {user?.preferenceTemplatesExist && <DrawerItem
                    icon="utensils"
                    title="Meal Preferences"
                    onPress={() => navigate(ROUTES.MEAL_PREFERENCES)}
                    focused={getFocusedRoute() === ROUTES.MEAL_PREFERENCES}
                />}

                {/* <DrawerItem
                    icon="award"
                    title="Cuisine Distribution"
                    onPress={() => navigate(ROUTES.CUISINE_DISTRIBUTION)}
                    focused={getFocusedRoute() === ROUTES.CUISINE_DISTRIBUTION}
                /> */}
            </DrawerContentScrollView>

            <Button
                title="LOGOUT"
                variant="outline"
                onPress={handleLogout}
                style={styles.logoutButton}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    drawerContent: {
        paddingTop: 10,
    },
    profileSection: {
        padding: 20,
        borderBottomWidth: 1,
        marginBottom: 10,
    },
    menuItem: {
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 20,
        borderBottomColor: '#E5E5E5',
    },
    menuItemFocused: {
        backgroundColor: '#F0F8FF',
    },
    menuIcon: {
        width: 30,
        marginRight: 10,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
    },
    badgeContainer: {
        minWidth: 20,
        height: 20,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    badgeText: {
        fontSize: 10,
    },
    logoutButton: {
        margin: 20,
        borderRadius: 30,
    },
});
