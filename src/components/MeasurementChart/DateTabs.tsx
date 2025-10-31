/**
 * DateTabs Component
 * Tab selector for measurement chart date periods (D, W, M, 6M, Y)
 */
// outsource dependencies
import React, { memo, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// local dependencies
import { getMeasurementTabs, type MeasurementTab } from 'constants/measurement-chart';

interface DateTabsProps {
    disabled?: boolean;
    activeTab: MeasurementTab;
    onTabChange: (tab: MeasurementTab) => void;
    date?: string;
}

const DateTabs: React.FC<DateTabsProps> = ({
    date,
    activeTab,
    onTabChange,
    disabled = false,
}) => {
    const tabs = useMemo(() => getMeasurementTabs(date), [date]);
    
    const activeIndex = useMemo(
        () => tabs.findIndex(tab => tab.name === activeTab.name),
        [tabs, activeTab]
    );

    return (
        <View style={styles.container}>
            <View style={styles.wrapper}>
                {tabs.map((tab, index) => {
                    const isActive = tab.name === activeTab.name;
                    const isBeforeActive = index === activeIndex - 1;
                    const isLast = index === tabs.length - 1;

                    return (
                        <View
                            key={tab.name}
                            style={[
                                styles.tabContainer,
                                !isLast && styles.borderRight,
                                isActive && styles.transparentBorder,
                                isBeforeActive && styles.transparentBorder,
                            ]}
                        >
                            <TouchableOpacity
                                disabled={disabled}
                                onPress={() => onTabChange(tab)}
                                style={[
                                    styles.tab,
                                    isActive && styles.activeTab,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tabText,
                                        isActive && styles.activeTabText,
                                    ]}
                                >
                                    {tab.short}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

export default memo(DateTabs);

const styles = StyleSheet.create({
    container: {
        paddingVertical: 10,
        paddingHorizontal: 20,
    },
    wrapper: {
        flexDirection: 'row',
        borderRadius: 6,
        backgroundColor: '#E5E5E5',
        paddingVertical: 3,
        paddingHorizontal: 1,
    },
    tabContainer: {
        flex: 1,
    },
    tab: {
        paddingVertical: 7,
        paddingHorizontal: 8,
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeTab: {
        backgroundColor: '#FFFFFF',
        borderRadius: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    tabText: {
        fontSize: 14,
        color: '#000000',
    },
    activeTabText: {
        fontWeight: '600',
    },
    borderRight: {
        borderRightWidth: 1,
        borderRightColor: '#000000',
    },
    transparentBorder: {
        borderRightWidth: 0,
        borderRightColor: 'transparent',
    },
});
