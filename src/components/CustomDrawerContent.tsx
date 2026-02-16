// outsource dependencies
import _ from 'lodash';
import moment from 'moment';
import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import Icon from '@react-native-vector-icons/fontawesome5';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, StyleSheet, TouchableOpacity, Pressable } from 'react-native';

// local dependencies
import {
    useGetMedicalProblemsQuery,
    useGetMedicationAllergiesQuery,
    useGetLibraryItemsTotalTreeQuery,
    useGetIncompleteQuestionsVideosQuery,
} from 'store/api/dayOverviewApi';
import { RootState } from 'store';
import Text from 'components/Text';
import { useAuth } from 'hooks/useAuth';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { Button } from 'components/Button';
import { navigate } from 'services/navigation';
import ProfileImage from 'components/ProfileImage.tsx';

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
            style={[styles.menuItem, focused && styles.menuItemFocused]}
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
                <View style={styles.badgeContainer}>
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

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <View style={styles.sectionHeader}>
        <Text variant="h5" style={styles.sectionHeaderText}>
            {title}
        </Text>
    </View>
);

interface CustomDrawerContentProps {
    state: any;
    navigation: any;
    descriptors: any;
}

export const CustomDrawerContent: React.FC<CustomDrawerContentProps> = props => {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const { signOut } = useAuth();
    const user = useSelector((state: RootState) => state.app.user);

    // Fetch badge data
    const currentDate = useMemo(() => moment().format('YYYY-MM-DD'), []);
    const { data: dailyPlanCounter } = useGetIncompleteQuestionsVideosQuery(currentDate);
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

        // Get badges from list by destination
        const getBadgeByDestination = (destination: string): number | null => {
            const item = list.find((i: any) => i.categoryDestination === destination);
            return item?.totalItemsCountWithInnerElements || null;
        };

        return {
            dailyPlan: dailyPlanCounter || null,
            shoppingList: getBadgeByDestination(DESTINATIONS.SHOPPING_LIST),
            messages: getBadgeByDestination(DESTINATIONS.MESSAGES),
            aboutPlan: getBadgeByDestination(DESTINATIONS.ABOUT_PLAN),
            healthProfile: healthProfileBadge > 0 ? healthProfileBadge : null,
        };
    }, [dailyPlanCounter, libraryItemsTree, medicalProblems, medicationAllergies]);

    const handleLogout = async () => {
        await signOut();
    };

    const getFocusedRoute = () => {
        return props.state?.routes[props.state?.index]?.name;
    };

    const goToAccountSettings = () => navigate(ROUTES.SETTINGS_STACK);

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <DrawerContentScrollView {...props} contentContainerStyle={styles.drawerContent}>
                <Pressable onPress={goToAccountSettings} style={[styles.profileSection, { borderBottomColor: theme.colors.border, paddingTop: insets.top }]}>
                    <ProfileImage style={styles.userIcon} uri={user?.coverImage?.url} />
                    <View>
                        <Text variant="h4" color={theme.colors.text}>
                            {user?.firstName} {user?.lastName}
                        </Text>
                        <Text color={theme.colors.primary}>Account Setting</Text>
                    </View>
                </Pressable>
                <DrawerItem
                    icon="file"
                    title="My Daily Plan"
                    badge={badges.dailyPlan}
                    onPress={() => navigate(ROUTES.DAILY_PLAN)}
                    focused={getFocusedRoute() === ROUTES.DAILY_PLAN}
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
        paddingTop: OFFSET.VERTICAL,
    },
    profileSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingBottom: OFFSET.VERTICAL,
        borderBottomWidth: 1,
        marginBottom: OFFSET.POINT * 2.5,
    },
    userIcon: {
        marginRight: OFFSET.POINT * 2,
        borderWidth: 1
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
        backgroundColor: '#E74C3C',
    },
    badgeText: {
        fontSize: 10,
    },
    sectionHeader: {
        padding: 10,
        backgroundColor: '#F0F1F5',
    },
    sectionHeaderText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666666',
    },
    logoutButton: {
        margin: OFFSET.VERTICAL,
        borderRadius: 30,
        borderColor: '#E74C3C',
    },
});
