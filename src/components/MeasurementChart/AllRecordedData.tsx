// outsource dependencies
import moment from 'moment';
import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    FlatList,
    StyleSheet,
    Dimensions,
    ActivityIndicator,
} from 'react-native';
// local dependencies
import { useGetLoggedMeasurementDataMutation } from 'store/api/dayOverviewApi';

interface RecordItem {
    id: string;
    date: string;
    value: string;
}

interface AllRecordedDataProps {
    measurementType: string;
    title: string;
}

const AllRecordedData: React.FC<AllRecordedDataProps> = ({
    measurementType,
    title,
}) => {
    const [page, setPage] = useState(0);
    const [records, setRecords] = useState<RecordItem[]>([]);
    const [totalPages, setTotalPages] = useState(0);

    const [getLoggedData, { isLoading }] = useGetLoggedMeasurementDataMutation();

    useEffect(() => {
        loadData(0);
    }, [measurementType]);

    const loadData = useCallback(
        async (pageNumber: number) => {
            try {
                const response = await getLoggedData({
                    size: 15,
                    page: pageNumber,
                    type: measurementType,
                    sort: 'timestamp,DESC',
                }).unwrap();

                const newRecords = (response?.content || []).map((item: any) => ({
                    id: String(item?.id),
                    value: `${(item?.values?.[0]?.value || 0).toFixed(0)} ${item?.values?.[0]?.measurementUnit?.name || ''}`,
                    date: moment(item?.timestamp).format('MMM DD, YYYY [at] h:mm A'),
                }));

                if (pageNumber === 0) {
                    setRecords(newRecords);
                } else {
                    setRecords(prev => [...prev, ...newRecords]);
                }

                setPage(response?.pageNumber || 0);
                setTotalPages(response?.totalPages || 0);
            } catch (error) {
                console.error('[AllRecordedData] Error loading data:', error);
            }
        },
        [measurementType, getLoggedData]
    );

    const handleLoadMore = useCallback(() => {
        if (!isLoading && page < totalPages - 1) {
            loadData(page + 1);
        }
    }, [isLoading, page, totalPages, loadData]);

    const renderItem = useCallback(
        ({ item }: { item: RecordItem }) => (
            <View style={styles.row}>
                <Text style={styles.value}>{item.value}</Text>
                <Text style={styles.date}>{item.date}</Text>
            </View>
        ),
        []
    );

    const renderFooter = useCallback(() => {
        if (!isLoading) { return null; }
        return (
            <View style={styles.footer}>
                <ActivityIndicator size="small" color="#2978A0" />
            </View>
        );
    }, [isLoading]);

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>{title}</Text>
                <Text style={styles.headerText}>Date</Text>
            </View>
            <FlatList
                data={records}
                style={styles.list}
                renderItem={renderItem}
                initialNumToRender={15}
                onEndReachedThreshold={0.5}
                onEndReached={handleLoadMore}
                keyExtractor={item => item.id}
                ListFooterComponent={renderFooter}
            />
        </View>
    );
};

export default AllRecordedData;

// Configure
const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingVertical: 10,
        borderBottomWidth: 1,
        flexDirection: 'row',
        paddingHorizontal: 15,
        backgroundColor: '#F4F4F4',
        borderBottomColor: '#E0E0E0',
        justifyContent: 'space-between',
    },
    headerText: {
        fontSize: 14,
        fontWeight: '300',
        color: '#888888',
        width: '50%',
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 15,
        paddingHorizontal: 7,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    value: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333333',
        width: '45%',
    },
    date: {
        fontSize: 14,
        color: '#888888',
        width: '50%',
        textAlign: 'left',
    },
    list: {
        width: width * 0.95,
        marginHorizontal: width * 0.025,
    },
    footer: {
        paddingVertical: 20,
        alignItems: 'center',
    },
});
