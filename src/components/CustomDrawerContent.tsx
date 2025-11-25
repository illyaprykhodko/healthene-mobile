// outsource dependencies
import React from 'react';
import { useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { View, StyleSheet, TouchableOpacity, Pressable, Image } from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text';
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { navigate } from 'services/navigation';
import FeatherIcon from 'react-native-vector-icons/Feather';

// const { width } = Dimensions.get('window');

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
            onPress={onPress}
            style={[styles.menuItem, focused && styles.menuItemFocused]}
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
                        style={styles.badgeText}
                        color={theme.colors.white}
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
    const { signOut } = useAuth();
    const user = useSelector((state: RootState) => state.app.user);

    const handleLogout = async () => {
        await signOut();
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
            title: 'Info',
            icon: 'info-circle',
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

    const goToAccountSettings = () => navigate('AccountSettings');

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                <Pressable onPress={goToAccountSettings} style={[styles.profileSection, { borderBottomColor: theme.colors.border }]}>
                    <View style={styles.userIcon}>
                        {user?.coverImage?.url
                            ? <Image source={{ uri: user?.coverImage.url }} width={48} height={48} />
                            : <FeatherIcon size={48} name="user" />
                        }
                    </View>
                    <View>
                        <Text variant="h4" color={theme.colors.text}>
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text variant="body" color={theme.colors.textSecondary}>
                            {user?.email}
                        </Text>
                        <Text color={theme.colors.primary}>Account Settings</Text>
                    </View>
                </Pressable>
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
        paddingTop: OFFSET.VERTICAL + 5,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        borderBottomWidth: 1,
        marginBottom: OFFSET.POINT * 2.5,
    },
    userIcon: {
        marginRight: OFFSET.POINT * 2,
        borderWidth: 1,
        borderRadius: 48/2,
        overflow: 'hidden',
    },
    menuItem: {
        paddingVertical: OFFSET.VERTICAL - 5,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: OFFSET.HORIZONTAL + 4,
        borderBottomColor: '#E5E5E5',
    },
    menuItemFocused: {
        backgroundColor: '#F0F8FF',
    },
    menuIcon: {
        width: 30,
        marginRight: OFFSET.POINT * 2.5,
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
        margin: OFFSET.VERTICAL,
        borderRadius: 30,
    },
});
