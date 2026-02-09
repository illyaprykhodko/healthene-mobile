// outsource dependencies
import moment from 'moment';
import React, { useMemo, useCallback, memo } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { View, FlatList, StyleSheet, TouchableOpacity } from 'react-native';

// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { filters } from 'services/filter';
import DefImage from 'components/DefImage';
import { ListItemSkeleton } from 'components/Skeleton';
import { RootStackParamList } from 'services/navigation';
import { useGetMeasurementTypesQuery } from 'store/api/dayOverviewApi';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

interface MeasurementType {
    id: number;
    name: string;
    type: string;
    coverImage?: {
        url?: string;
    };
}

interface ListItemProps {
    item: MeasurementType;
    disabled?: boolean;
}

const ListItem = memo<ListItemProps>(({ item, disabled = false }) => {
    const navigation = useNavigation<Navigation>();

    const handlePress = useCallback(() => {
        navigation.navigate(ROUTES.MEASUREMENT_CHART, {
            measurementType: item.type,
            measurementName: item.name,
        });
    }, [navigation, item.type, item.name]);

    return (
        <View style={styles.listItem}>
            <View style={styles.listItemMain}>
                <TouchableOpacity
                    disabled={disabled}
                    onPress={handlePress}
                    style={styles.listItemLink}
                >
                    <DefImage
                        style={styles.image}
                        src={item.coverImage?.url}
                    />
                    <Text variant="bold" style={styles.title}>
                        {filters.humanize(item.name)}
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
});

const MyResultsScreen: React.FC = () => {
    const theme = useTheme();

    // Query params for measurement types
    const queryArgs = useMemo(() => ({
        dateTime: moment().format(),
        period: '1-year',
    }), []);

    const { data: measurementTypesData, isLoading, isFetching } = useGetMeasurementTypesQuery(queryArgs);

    // Transform data to get measurement objects
    const measurementsList = useMemo(() => {
        if (!measurementTypesData) { return []; }
        return measurementTypesData.map((item: any) => item.measurement).filter(Boolean);
    }, [measurementTypesData]);

    const renderItem = useCallback(({ item }: { item: MeasurementType }) => (
        <ListItem item={item} disabled={isFetching} />
    ), [isFetching]);

    const keyExtractor = useCallback((item: MeasurementType) => String(item.id), []);

    if (isLoading) {
        return (
            <Screen initialized style={styles.container}>
                <View style={styles.divider}>
                    <Text color={theme.colors.grey} variant="h4">Measurements:</Text>
                </View>
                <View style={styles.skeletonContainer}>
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                    <ListItemSkeleton />
                </View>
            </Screen>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={styles.content}>
                <View style={styles.divider}>
                    <Text color="#979797" variant="h4">Measurements:</Text>
                </View>
                <FlatList
                    data={measurementsList}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                />
            </View>
        </Screen>
    );
};

export default memo(MyResultsScreen);

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
        backgroundColor: '#F0F1F5',
    },
    content: {
        flex: 1,
    },
    divider: {
        padding: 10,
        borderTopWidth: 1,
        flexDirection: 'row',
        borderColor: '#E0E0E0',
        backgroundColor: '#F0F1F5',
    },
    listContent: {
        paddingBottom: OFFSET.VERTICAL * 2,
    },
    listItem: {
        display: 'flex',
        paddingBottom: OFFSET.VERTICAL,
        paddingTop: OFFSET.VERTICAL,
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E9E9E9',
        marginBottom: OFFSET.VERTICAL / 2,
    },
    listItemMain: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: OFFSET.HORIZONTAL,
        paddingRight: OFFSET.HORIZONTAL,
    },
    listItemLink: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: OFFSET.HORIZONTAL,
    },
    image: {
        width: 40,
        height: 40,
        borderRadius: 8,
        marginRight: OFFSET.HORIZONTAL,
    },
    title: {
        marginLeft: 10,
        flexShrink: 1,
    },
    skeletonContainer: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingTop: OFFSET.VERTICAL,
    },
});

