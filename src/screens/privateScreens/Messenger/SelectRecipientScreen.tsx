// outsource dependencies
import Toast from 'react-native-toast-message';
import * as Sentry from '@sentry/react-native';
import Icon from '@react-native-vector-icons/fontawesome5';
import { SectionList, StyleSheet, View } from 'react-native';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { COLORS } from 'constants/colors';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { Recipient } from 'types/messenger';
import SearchInput from 'components/SearchInput';
import { setCollocutor } from 'store/slices/messengerSlice';
import { RootState, useAppDispatch, useAppSelector } from 'store';
import { CLINIC_ROLE_ORDER, getClinicRoleLabel } from 'constants/spec';
import { RoleChips } from 'screens/privateScreens/Messenger/components/RoleChips';
import { RecipientRow } from 'screens/privateScreens/Messenger/components/RecipientRow';
import { useFilterDoctorsQuery, useGetClinicRolesQuery, FilterDoctorsBody } from 'store/api/messengerApi';
import { RecipientPickerSkeleton } from 'screens/privateScreens/Messenger/components/RecipientPickerSkeleton';

const PAGE_SIZE = 100;
const SEARCH_DEBOUNCE_MS = 300;
const UNKNOWN_ROLE = 'UNKNOWN';

type Section = {
    role: string;
    title: string;
    data: Recipient[];
};

const buildFilterBody = ({
    user,
    query,
    roleFilter,
}: {
    user: { clinic?: { id: number }; tenant?: { id: number } } | null;
    query: string;
    roleFilter: string | null;
}): FilterDoctorsBody => {
    const body: FilterDoctorsBody = {};
    const clinicId = user?.clinic?.id;
    const tenantId = user?.tenant?.id;
    if (clinicId) { body.clinicId = clinicId; }
    if (tenantId) { body.tenantId = tenantId; }
    const trimmed = query.trim();
    if (trimmed) { body.name = trimmed; }
    if (roleFilter) { body.clinicRoles = [roleFilter]; }
    return body;
};

// NOTE Groups the flat list by `clinicRole`, moves the primary physician to
// the top inside its group, and orders sections by CLINIC_ROLE_ORDER.
// Unknown (not-listed) roles fall to the bottom in alphabetical order.
const buildSections = (list: Recipient[], primaryId: number | null): Section[] => {
    const groups: Record<string, Recipient[]> = {};
    list.forEach(item => {
        const role = item.clinicRole || UNKNOWN_ROLE;
        if (!groups[role]) { groups[role] = []; }
        groups[role].push(item);
    });

    const knownOrder = CLINIC_ROLE_ORDER.filter(role => groups[role]?.length);
    const extraRoles = Object.keys(groups)
        .filter(role => !(CLINIC_ROLE_ORDER as readonly string[]).includes(role))
        .sort();

    return [...knownOrder, ...extraRoles].map(role => ({
        role,
        title: role === UNKNOWN_ROLE ? 'Other' : getClinicRoleLabel(role),
        data: [...groups[role]].sort((a, b) => {
            // primary physician on top
            if (primaryId && a.id === primaryId) { return -1; }
            if (primaryId && b.id === primaryId) { return 1; }
            const an = (a.lastName ?? '').toLowerCase();
            const bn = (b.lastName ?? '').toLowerCase();
            return an.localeCompare(bn);
        }),
    }));
};

const keyExtractor = (item: Recipient) => String(item.id);

const SelectRecipientScreen: React.FC = () => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const navigation = useNavigation();
    const route = useRoute<RouteProp<{ params: { selectedId?: number } }, 'params'>>();
    const selectedRouteId = route.params?.selectedId;

    const user = useAppSelector((state: RootState) => state.app.user);
    const primaryId = user?.physician?.id ?? null;

    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState<string | null>(null);
    const [page, setPage] = useState(0);
    const [refreshing, setRefreshing] = useState(false);
    const preselectedId = selectedRouteId ?? primaryId ?? null;

    // NOTE debounce search input — we don't want to hit /doctors/filter on every keystroke.
    useEffect(() => {
        const handle = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
        return () => clearTimeout(handle);
    }, [query]);

    // NOTE reset pagination when filters change
    useEffect(() => {
        setPage(0);
    }, [debouncedQuery, roleFilter]);

    const { data: roles = [], error: rolesError } = useGetClinicRolesQuery();

    const filterArgs = useMemo(() => ({
        body: buildFilterBody({ user, query: debouncedQuery, roleFilter }),
        params: { page, size: PAGE_SIZE },
    }), [
        page,
        user,
        roleFilter,
        debouncedQuery,
    ]);

    const {
        refetch,
        isFetching,
        data: doctors,
        error: doctorsError,
    } = useFilterDoctorsQuery(filterArgs);

    useEffect(() => {
        if (doctorsError) {
            Sentry.captureException(doctorsError);
            Toast.show({
                type: 'error',
                text1: 'Select Recipient',
                text2: 'We faced a problem loading recipients',
            });
        }
    }, [doctorsError]);

    useEffect(() => {
        if (rolesError) {
            Sentry.captureException(rolesError);
        }
    }, [rolesError]);

    const handleSelect = useCallback((recipient: Recipient) => {
        dispatch(setCollocutor(recipient));
        navigation.goBack();
    }, [dispatch, navigation]);

    const handleClearQuery = useCallback(() => setQuery(''), []);

    const handleEndReached = useCallback(() => {
        if (!doctors || isFetching) { return; }
        if (page + 1 >= doctors.totalPages) { return; }
        setPage(p => p + 1);
    }, [
        page,
        doctors,
        isFetching,
    ]);

    const handleRefresh = useCallback(async () => {
        try {
            setRefreshing(true);
            setPage(0);
            await refetch();
        } finally {
            setRefreshing(false);
        }
    }, [refetch]);

    const sections = useMemo(
        () => buildSections(doctors?.data ?? [], primaryId),
        [doctors, primaryId]
    );

    const renderItem = useCallback(({ item }: { item: Recipient }) => (
        <RecipientRow
            data={item}
            onPress={handleSelect}
            isPrimary={primaryId === item.id}
            selected={preselectedId === item.id}
        />
    ), [
        primaryId,
        handleSelect,
        preselectedId,
    ]);

    const renderSectionHeader = useCallback(({ section }: { section: Section }) => (
        <View style={[styles.sectionHeader, { backgroundColor: theme.colors.surfaceAlt, borderBottomColor: theme.colors.border }]}>
            <Text variant="bold" style={styles.sectionHeaderLabel} color={theme.colors.textSecondary}>
                {section.title}
            </Text>
            <Text style={styles.sectionHeaderCount} color={theme.colors.textSecondary}>
                {String(section.data.length)}
            </Text>
        </View>
    ), [theme.colors]);

    // NOTE Initial load = no doctors data yet AND a request is in flight on page 0.
    // While in this state we keep the search input and role chips interactive and
    // render the skeleton in place of the SectionList — no big spinner replacing
    // the whole screen, no layout shift when results arrive.
    const isInitialLoad = isFetching && page === 0 && !doctors;

    const emptyComponent = useMemo(() => {
        if (isFetching || !doctors) { return null; }
        return (
            <View style={styles.empty}>
                <Icon
                    size={48}
                    iconStyle="solid"
                    name="user-slash"
                    color={COLORS.GREY}
                    style={styles.emptyIcon}
                />
                <Text variant="h3" textAlign="center" color={COLORS.GREY} style={styles.emptyText}>
                    No recipients found
                </Text>
                <Text textAlign="center" color={COLORS.DARK_GREY}>
                    {query
                        ? 'Try a different name or role.'
                        : 'There are no specialists available for messaging yet.'}
                </Text>
            </View>
        );
    }, [
        isFetching,
        doctors,
        query,
    ]);

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.searchWrapper}>
                <SearchInput
                    editable
                    value={query}
                    onChange={setQuery}
                    onClear={handleClearQuery}
                    placeholder="Search by name"
                />
            </View>
            <RoleChips
                roles={roles}
                selected={roleFilter}
                onSelect={setRoleFilter}
            />
            {isInitialLoad ? (
                <RecipientPickerSkeleton />
            ) : (
                <SectionList<Recipient, Section>
                    sections={sections}
                    renderItem={renderItem}
                    refreshing={refreshing}
                    onRefresh={handleRefresh}
                    stickySectionHeadersEnabled
                    keyExtractor={keyExtractor}
                    onEndReachedThreshold={0.5}
                    onEndReached={handleEndReached}
                    keyboardShouldPersistTaps="handled"
                    ListEmptyComponent={emptyComponent}
                    renderSectionHeader={renderSectionHeader}
                />
            )}
        </Screen>
    );
};

SelectRecipientScreen.displayName = ROUTES.SELECT_RECIPIENT;

export default SelectRecipientScreen;

const styles = StyleSheet.create({
    container: {
        paddingTop: 10,
        paddingLeft: 0,
        paddingRight: 0,
    },
    searchWrapper: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    sectionHeader: {
        borderBottomWidth: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.POINT * 2,
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    sectionHeaderLabel: {
        fontSize: 13,
        letterSpacing: 0.5,
        textTransform: 'uppercase',
    },
    sectionHeaderCount: {
        fontSize: 13,
    },
    empty: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL * 4,
    },
    emptyIcon: {
        marginBottom: OFFSET.VERTICAL,
    },
    emptyText: {
        marginBottom: OFFSET.POINT,
    },
});
