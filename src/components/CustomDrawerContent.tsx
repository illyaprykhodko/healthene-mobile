// outsource dependencies
import _ from 'lodash';
import dayjs from 'services/date';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Icon from '@react-native-vector-icons/fontawesome5';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import {
    View, StyleSheet, TouchableOpacity, Pressable, Alert
} from 'react-native';

// local dependencies
import { RootState } from 'store';
import Text from 'components/Text';
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { navigate } from 'services/navigation';
import ProfileImage from 'components/ProfileImage.tsx';
import {
    useGetMedicalProblemsQuery,
    useGetMedicationAllergiesQuery,
    useGetLibraryItemsTotalTreeQuery,
    useGetUntrackedMeasurementsQuery,
    useGetIncompleteQuestionsVideosQuery,
} from 'store/api/dayOverviewApi';
import { SafeAreaView } from 'react-native-safe-area-context';

const DESTINATIONS = {
    MESSAGES: 'MESSAGES',
    DAILY_PLAN: 'DAILY_PLAN',
    ABOUT_PLAN: 'ABOUT_PLAN',
    SHOPPING_LIST: 'SHOPPING_LIST',
    MY_HEALTH_PROFILE: 'MY_HEALTH_PROFILE',
};

type DrawerIconName =
    | 'file'
    | 'book'
    | 'award'
    | 'comments'
    | 'utensils'
    | 'chart-bar'
    | 'clipboard'
    | 'heartbeat'
    | 'info-circle'
    | 'shopping-cart';

interface DrawerItemProps {
    title: string;
    focused: boolean;
    onPress: () => void;
    icon: DrawerIconName;
    badge?: number | null;
}

const DrawerItem: React.FC<DrawerItemProps> = ({ icon, title, focused, onPress, badge }) => {
    const theme = useTheme();

    return (
        <TouchableOpacity
            onPress={onPress}
            style={[
                styles.menuItem,
                { borderBottomColor: theme.colors.border },
                focused && { backgroundColor: theme.colors.surfaceAlt },
            ]}
        >
            <Icon
                size={24}
                name={icon}
                iconStyle="solid"
                style={styles.menuIcon}
                color={theme.colors.primary}
            />
            <Text
                variant="h5"
                style={styles.menuText}
                color={focused ? theme.colors.primary : theme.colors.textSecondary}
            >
                {title}
            </Text>
            {!!badge && badge > 0 && (
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

const SectionHeader: React.FC<{ title: string }> = ({ title }) => {
    const theme = useTheme();
    return (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceAlt }]}>
            <Text variant="h5" style={styles.sectionHeaderText} color={theme.colors.textSecondary}>
                {title}
            </Text>
        </View>
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

    // Fetch badge data
    const currentDate = useMemo(() => dayjs().format('YYYY-MM-DD'), []);
    const { data: dailyPlanCounter } = useGetIncompleteQuestionsVideosQuery(currentDate);
    const { data: untrackedMeasurementsCounter } = useGetUntrackedMeasurementsQuery(currentDate);
    const { data: libraryItemsTree } = useGetLibraryItemsTotalTreeQuery();
    const { data: medicalProblems } = useGetMedicalProblemsQuery();
    const { data: medicationAllergies } = useGetMedicationAllergiesQuery();

    const badges = useMemo(() => {
        // Get list from library items tree
        const list = _.get(_.first(libraryItemsTree), 'list', []) as any[];

        // Calculate health profile badge
        const medicalProblemsCount = _.size(
            _.flatMap(medicalProblems || [], ({ readyToSeeAttachments }) => readyToSeeAttachments)
        );
        const medicationAllergiesCount = _.size(
            _.flatMap(medicationAllergies || [], ({ readyToSeeAttachments }) => readyToSeeAttachments)
        );
        const healthProfileBadge = medicalProblemsCount + medicationAllergiesCount;
        const dailyPlanBadge = (dailyPlanCounter || 0) + (untrackedMeasurementsCounter || 0);

        // Get badges from list by destination
        const getBadgeByDestination = (destination: string): number | null => {
            const item = list.find((i: any) => i.categoryDestination === destination);
            return item?.totalItemsCountWithInnerElements || null;
        };

        return {
            dailyPlan: dailyPlanBadge > 0 ? dailyPlanBadge : null,
            messages: getBadgeByDestination(DESTINATIONS.MESSAGES),
            aboutPlan: getBadgeByDestination(DESTINATIONS.ABOUT_PLAN),
            shoppingList: getBadgeByDestination(DESTINATIONS.SHOPPING_LIST),
            healthProfile: healthProfileBadge > 0 ? healthProfileBadge : null,
        };
    }, [
        medicalProblems,
        dailyPlanCounter,
        libraryItemsTree,
        medicationAllergies,
        untrackedMeasurementsCounter,
    ]);

    const handleLogout = async () => {
        Alert.alert(
            'Sign Out',
            'Please confirm you really want to sign out from the Healthene®',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ok',
                    onPress: async () => {
                        await signOut();
                    },
                },
            ]
        );
    };
    // const menuItems: {
    //     title: string,
    //     route: RouteName,
    //     icon: DrawerIconName,
    // }[] = [
    //     {
    //         icon: 'file',
    //         title: 'My Daily Plan',
    //         route: ROUTES.DAILY_PLAN,
    //     },
    //     {
    //         icon: 'shopping-cart',
    //         title: 'Shopping List',
    //         route: ROUTES.SHOPPING,
    //     },
    //     {
    //         icon: 'comments',
    //         title: 'Messages',
    //         route: ROUTES.MESSENGER,
    //     },
    //     {
    //         icon: 'chart-bar',
    //         title: 'My Results',
    //         route: ROUTES.MY_RESULTS,
    //     },
    //     {
    //         icon: 'clipboard',
    //         title: 'About Plan',
    //         route: ROUTES.ABOUT_PLAN,
    //     },
    //     {
    //         icon: 'heartbeat',
    //         title: 'My Health Profile',
    //         route: ROUTES.HEALTH_PROFILE,
    //     },
    //     {
    //         icon: 'book',
    //         title: 'Library',
    //         route: ROUTES.LIBRARY,
    //     },
    //     {
    //         title: 'Info',
    //         icon: 'info-circle',
    //         route: ROUTES.INFO,
    //     },
    //     {
    //         icon: 'award',
    //         title: 'Cuisine Distribution',
    //         route: ROUTES.CUISINE_DISTRIBUTION,
    //     },
    // ];
    const getFocusedRoute = () => {
        return props.state?.routes[props.state?.index]?.name;
    };

    const goToAccountSettings = () => navigate(ROUTES.SETTINGS_STACK);

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <Pressable onPress={goToAccountSettings} style={[styles.profileSection, { borderBottomColor: theme.colors.border }]}>
                <ProfileImage style={styles.userIcon} uri={user?.coverImage?.url} />
                <View style={styles.profileTextContainer}>
                    <Text variant="h4" style={styles.userName} color={theme.colors.text}>
                        {user?.firstName} {user?.lastName}
                    </Text>
                    {/* <Text variant="body" color={theme.colors.textSecondary}>
                            {user?.email}
                        </Text> */}
                    <Text color={theme.colors.primary}>Account Setting</Text>
                </View>
            </Pressable>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                {/* {menuItems.map(item => {
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
                />} */}
                <DrawerItem
                    icon="file"
                    title="My Daily Plan"
                    badge={badges.dailyPlan}
                    focused={getFocusedRoute() === ROUTES.DAILY_PLAN}
                    onPress={() => navigate(ROUTES.DAILY_PLAN, { screen: ROUTES.DAY_OVERVIEW })}
                />
                <DrawerItem
                    icon="shopping-cart"
                    title="Shopping List"
                    badge={badges.shoppingList}
                    onPress={() => navigate(ROUTES.SHOPPING)}
                    focused={getFocusedRoute() === ROUTES.SHOPPING}
                />
                <DrawerItem
                    icon="comments"
                    title="Messages"
                    badge={badges.messages}
                    onPress={() => navigate(ROUTES.MESSENGER)}
                    focused={getFocusedRoute() === ROUTES.MESSENGER}
                />
                <DrawerItem
                    icon="chart-bar"
                    title="My Results"
                    onPress={() => navigate(ROUTES.MY_RESULTS)}
                    focused={getFocusedRoute() === ROUTES.MY_RESULTS}
                />

                <SectionHeader title="PREFERENCES" />
                <DrawerItem
                    icon="award"
                    title="International Cuisine"
                    onPress={() => navigate(ROUTES.CUISINE_DISTRIBUTION)}
                    focused={getFocusedRoute() === ROUTES.CUISINE_DISTRIBUTION}
                />
                {user?.preferenceTemplatesExist && (
                    <DrawerItem
                        icon="utensils"
                        title="Meal Preferences"
                        onPress={() => navigate(ROUTES.MEAL_PREFERENCES)}
                        focused={getFocusedRoute() === ROUTES.MEAL_PREFERENCES}
                    />
                )}

                <SectionHeader title="ADDITIONAL INFORMATION" />
                <DrawerItem
                    icon="clipboard"
                    title="About Plan"
                    badge={badges.aboutPlan}
                    onPress={() => navigate(ROUTES.ABOUT_PLAN)}
                    focused={getFocusedRoute() === ROUTES.ABOUT_PLAN}
                />
                <DrawerItem
                    icon="heartbeat"
                    title="My Health Profile"
                    badge={badges.healthProfile}
                    onPress={() => navigate(ROUTES.HEALTH_PROFILE)}
                    focused={getFocusedRoute() === ROUTES.HEALTH_PROFILE}
                />
                <DrawerItem
                    icon="book"
                    title="Library"
                    onPress={() => navigate(ROUTES.LIBRARY)}
                    focused={getFocusedRoute() === ROUTES.LIBRARY}
                />
                <DrawerItem
                    title="Info"
                    icon="info-circle"
                    onPress={() => navigate(ROUTES.INFO)}
                    focused={getFocusedRoute() === ROUTES.INFO}
                />
            </DrawerContentScrollView>
            <Button
                title="LOGOUT"
                variant="outline"
                onPress={handleLogout}
                textStyle={{ color: theme.colors.error }}
                style={[styles.logoutButton, { borderColor: theme.colors.error }]}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    drawerContent: {
        paddingTop: 0,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        borderBottomWidth: 1,
        // marginBottom: OFFSET.POINT * 2.5,
    },
    userIcon: {
        marginRight: OFFSET.POINT * 2,
        borderWidth: 1,
    },
    menuItem: {
        paddingVertical: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        paddingHorizontal: 20,
    },
    menuIcon: {
        width: 30,
        marginRight: OFFSET.POINT * 2.5,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        marginLeft: 10,
    },
    badgeContainer: {
        minWidth: 20,
        height: 20,
        paddingHorizontal: 5,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 10,
    },
    badgeText: {
        fontSize: 10,
    },
    sectionHeader: {
        padding: 10,
    },
    sectionHeaderText: {
        fontSize: 11,
        fontWeight: '600',
    },
    logoutButton: {
        borderRadius: 30,
        margin: OFFSET.VERTICAL,
    },
    userName: {
        fontSize: 16,
        fontWeight: '600',
    },
    profileTextContainer: {
        flex: 1,
    },
});
