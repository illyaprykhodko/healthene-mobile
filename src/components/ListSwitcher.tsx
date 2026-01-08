// outsource dependencies
import React, { useState, useRef, memo, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions } from 'react-native';

// local dependencies
import { COLORS } from 'constants/colors';
import { SHOPPING_LIST_TAB, SHOPPING_ITEM_TYPE, ORIENTATION } from 'constants/spec';

interface ListSwitcherProps {
    itemType: string;
    getRescue: () => void;
    getOriginal: () => void;
    disabledOriginal?: boolean;
}

// type Orientation = typeof ORIENTATION[keyof typeof ORIENTATION];
type Tab = typeof SHOPPING_LIST_TAB[keyof typeof SHOPPING_LIST_TAB];

const ListSwitcher: React.FC<ListSwitcherProps> = ({
    itemType,
    disabledOriginal = false,
    getRescue,
    getOriginal,
}) => {
    const getTabFromItemType = (type: string) => {
        return type === SHOPPING_ITEM_TYPE.ORIGINAL
            ? SHOPPING_LIST_TAB.ORIGINAL
            : SHOPPING_LIST_TAB.RESCUE;
    };

    const [selectedTab, setSelectedTab] = useState<Tab>(getTabFromItemType(itemType));
    // const [orientation, setOrientation] = useState<Orientation>(ORIENTATION.PORTRAIT);
    const animation = useRef(new Animated.Value(0)).current;

    // Handle orientation changes
    // useEffect(() => {
    //     const onChange = ({ window }: { window: { width: number; height: number } }) => {
    //         if (window.width > window.height) {
    //             setOrientation(ORIENTATION.LANDSCAPE);
    //         } else {
    //             setOrientation(ORIENTATION.PORTRAIT);
    //         }
    //     };
    //     const subscription = Dimensions.addEventListener('change', onChange);
    //     return () => {
    //         subscription?.remove?.();
    //     };
    // }, []);

    // Handle tab press with animation
    const handleTabPress = useCallback((tab: Tab) => {
        const isOriginalTab = tab === SHOPPING_LIST_TAB.ORIGINAL;
        setSelectedTab(tab);

        if (isOriginalTab) {
            getOriginal();
        } else {
            getRescue();
        }

        Animated.timing(animation, {
            duration: 300,
            useNativeDriver: true,
            toValue: isOriginalTab ? 0 : 1,
        }).start();
    }, [animation, getOriginal, getRescue]);

    // Sync with external itemType changes
    useEffect(() => {
        const newTab = getTabFromItemType(itemType);
        if (newTab !== selectedTab) {
            handleTabPress(newTab);
        }
    }, [itemType]);

    const screenWidth = Dimensions.get('window').width;
    const tabWidth = screenWidth * 0.4;

    const translateX = animation.interpolate({
        inputRange: [0, 1],
        outputRange: [0, tabWidth],
    });

    return (
        <View style={styles.container}>
            <View style={styles.switcher}>
                <Animated.View
                    style={[
                        styles.animatedTab,
                        {
                            width: tabWidth,
                            transform: [{ translateX }],
                        },
                    ]}
                />
                <TouchableOpacity
                    style={styles.tab}
                    disabled={disabledOriginal}
                    onPress={() => handleTabPress(SHOPPING_LIST_TAB.ORIGINAL)}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === SHOPPING_LIST_TAB.ORIGINAL && styles.activeTabText,
                        ]}
                    >
                        My List
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.tab}
                    onPress={() => handleTabPress(SHOPPING_LIST_TAB.RESCUE)}
                >
                    <Text
                        style={[
                            styles.tabText,
                            selectedTab === SHOPPING_LIST_TAB.RESCUE && styles.activeTabText,
                        ]}
                    >
                        Rescue Foods
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingTop: 16,
    },
    switcher: {
        width: '80%',
        borderRadius: 8,
        overflow: 'hidden',
        alignSelf: 'center',
        flexDirection: 'row',
        position: 'relative',
        backgroundColor: '#e0e0e0',
    },
    tab: {
        flex: 1,
        zIndex: 1,
        paddingVertical: 7,
        alignItems: 'center',
    },
    animatedTab: {
        top: 0,
        bottom: 0,
        borderWidth: 2,
        borderRadius: 8,
        position: 'absolute',
        backgroundColor: COLORS.WHITE,
        borderColor: COLORS.DARK_GREY,
    },
    tabText: {
        zIndex: 2,
        fontWeight: 'bold',
        color: COLORS.DARK_GREY,
    },
    activeTabText: {
        color: COLORS.BLUE,
    },
    content: {
        fontSize: 18,
        marginTop: 16,
    },
});

export default memo(ListSwitcher);
