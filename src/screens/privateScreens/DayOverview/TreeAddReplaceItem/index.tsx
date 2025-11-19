// outsource dependencies
import _ from 'lodash';
import React, { useState, useCallback, useEffect } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
    FlatList,
    View,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { ROUTES } from 'constants/routes';
import { RootStackParamList } from 'services/navigation';
import { TAG_TYPE, ENTITY_TYPE } from 'constants/spec';
import ConfirmationReplaceModal from 'components/modals/ConfirmationReplaceModal';

interface TreeItem {
    id: number;
    name: string;
    coverImage?: {
        url: string;
    };
    list?: TreeItem[];
}

interface TreeAddReplaceItemProps {
    date: string;
    entityType: string;
    substanceType: string;
    onApply?: (data: any) => void;
}

const TreeAddReplaceItem: React.FC = () => {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const { date, entityType, substanceType, onApply } = route.params as TreeAddReplaceItemProps;

    const [list, setList] = useState<TreeItem[]>([]);
    const [breadcrumb, setBreadcrumb] = useState<TreeItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedTab, setSelectedTab] = useState(entityType || TAG_TYPE.PATIENT_FOOD);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedItem, setSelectedItem] = useState<TreeItem | null>(null);
    const [prevItem, setPrevItem] = useState<any>(null);

    // TODO: Replace with actual API call
    useEffect(() => {
        // Simulate API call
        setTimeout(() => {
            setList([
                {
                    id: 1,
                    name: 'Fruits',
                    list: [
                        { id: 11, name: 'Apple', coverImage: { url: '' } },
                        { id: 12, name: 'Banana', coverImage: { url: '' } },
                    ],
                },
                {
                    id: 2,
                    name: 'Vegetables',
                    list: [
                        { id: 21, name: 'Carrot', coverImage: { url: '' } },
                        { id: 22, name: 'Broccoli', coverImage: { url: '' } },
                    ],
                },
            ]);
            setIsLoading(false);
        }, 500);
    }, [selectedTab]);

    const handleSelectItem = useCallback((item: TreeItem) => {
        if (item.list && item.list.length > 0) {
            setBreadcrumb(prev => [...prev, item]);
            setList(item.list || []);
        } else {
            setSelectedItem(item);
            setPrevItem(route.params?.prevItem);
            setShowConfirmModal(true);
        }
    }, [route.params]);

    const handleGoBack = useCallback(() => {
        if (breadcrumb.length > 0) {
            const newBreadcrumb = [...breadcrumb];
            const parent = newBreadcrumb.pop();
            setBreadcrumb(newBreadcrumb);
            
            if (newBreadcrumb.length > 0) {
                const currentParent = newBreadcrumb[newBreadcrumb.length - 1];
                setList(currentParent.list || []);
            } else {
                // TODO: Load root categories
                setIsLoading(true);
                setTimeout(() => {
                    setList([
                        {
                            id: 1,
                            name: 'Fruits',
                            list: [
                                { id: 11, name: 'Apple', coverImage: { url: '' } },
                                { id: 12, name: 'Banana', coverImage: { url: '' } },
                            ],
                        },
                        {
                            id: 2,
                            name: 'Vegetables',
                            list: [
                                { id: 21, name: 'Carrot', coverImage: { url: '' } },
                                { id: 22, name: 'Broccoli', coverImage: { url: '' } },
                            ],
                        },
                    ]);
                    setIsLoading(false);
                }, 300);
            }
        } else {
            navigation.goBack();
        }
    }, [breadcrumb, navigation]);

    const handleConfirmReplace = useCallback(async ({ prevItem, nextItem }: { prevItem: any; nextItem: any }) => {
        try {
            if (onApply) {
                onApply({ item: nextItem });
            }
            
            // Navigate back
            navigation.goBack();
        } catch (error) {
            console.error('Error replacing item:', error);
        }
    }, [onApply, navigation]);

    const renderTabs = useCallback(() => {
        const tabs = [
            { label: 'Food/Drink', value: TAG_TYPE.PATIENT_FOOD },
            { label: 'Recipes', value: TAG_TYPE.PATIENT_RECIPES },
            { label: 'Restaurants', value: TAG_TYPE.RESTAURANT },
        ];

        return (
            <View style={styles.tabsRow}>
                {tabs.map((tab, index) => {
                    const isActive = selectedTab === tab.value;
                    return (
                        <TouchableOpacity
                            key={tab.value}
                            style={[
                                styles.tabButton,
                                { backgroundColor: theme.colors.lightGrey },
                                isActive && { backgroundColor: theme.colors.primary },
                                { borderRightWidth: tabs.length === index + 1 ? 0 : 2 },
                                { borderRightColor: '#156F93' },
                            ]}
                            onPress={() => setSelectedTab(tab.value)}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    { color: theme.colors.black },
                                    isActive ? { color: theme.colors.white, fontWeight: '600' } : {},
                                ]}
                            >
                                {tab.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        );
    }, [selectedTab, theme]);

    const renderItem = useCallback(({ item }: { item: TreeItem }) => {
        const hasSubcategories = !!item.list && item.list.length > 0;

        return (
            <TouchableOpacity
                onPress={() => handleSelectItem(item)}
                style={[styles.listItem, { borderBottomColor: theme.colors.border }]}
            >
                {item.coverImage?.url ? (
                    <View style={[styles.image, { backgroundColor: theme.colors.lightGrey }]} />
                ) : (
                    <View style={[styles.image, { backgroundColor: theme.colors.lightGrey }]} />
                )}
                <Text variant="h4" numberOfLines={1} style={[styles.listItemText, { color: theme.colors.text }]}>
                    {item.name}
                </Text>
                <Icon name="chevron-right" color={theme.colors.black} size={16} />
            </TouchableOpacity>
        );
    }, [theme, handleSelectItem]);

    useEffect(() => {
        navigation.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={handleGoBack}>
                    <Icon name="arrow-left" size={24} color={theme.colors.text} />
                </TouchableOpacity>
            ),
        });
    }, [navigation, handleGoBack, theme]);

    if (isLoading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
        );
    }

    return (
        <Screen initialized style={styles.container}>
            <View style={[styles.header, { backgroundColor: '#E0EBF7', marginBottom: OFFSET.VERTICAL }]}>
                <Text color="#181818" style={styles.itemName}>
                    Add item
                </Text>
            </View>
            {renderTabs()}
            <View style={[styles.search, styles.offset]}>
                {/* <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onClear={() => setSearchQuery('')}
                /> */}
            </View>
            {/* <Text>{JSON.stringify(list)}</Text> */}
            <FlatList
                data={list}
                initialNumToRender={10}
                renderItem={renderItem}
                onEndReachedThreshold={0.1}
                keyExtractor={({ id }) => String(id)}
            />

            <ConfirmationReplaceModal
                prevItem={prevItem}
                nextItem={selectedItem}
                visible={showConfirmModal}
                onApply={handleConfirmReplace}
                onClose={() => setShowConfirmModal(false)}
            />
        </Screen>
    );
};

export default TreeAddReplaceItem;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingLeft: 0,
        paddingRight: 0,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    offset: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    header: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        justifyContent: 'center',
        paddingVertical: OFFSET.VERTICAL,
        height: 65,
    },
    itemName: {
        width: '100%',
        fontWeight: '400',
        fontSize: 18,
        textAlign: 'center',
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
    },
    tabText: {
        fontWeight: '500',
    },
    search: {
        marginBottom: OFFSET.VERTICAL,
    },
    listItem: {
        width: '100%',
        display: 'flex',
        borderBottomWidth: 2,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: OFFSET.VERTICAL * 1.5,
        borderBottomColor: '#D9D9D9',
        paddingHorizontal: OFFSET.HORIZONTAL,
    },
    listItemText: {
        flex: 3,
        fontSize: 18,
        fontWeight: '400',
    },
    image: {
        width: 48,
        height: 48,
        marginRight: OFFSET.HORIZONTAL,
        borderRadius: 8,
    },
});
