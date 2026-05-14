// outsource dependencies
import _ from 'lodash';
import React from 'react';
import Icon from '@react-native-vector-icons/fontawesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// local dependencies
import { COLORS } from 'constants/colors';
import { OVERVIEW_TYPE, PHASE_ITEM_STATUS } from 'constants/spec';

export type SwipeValueChange = {
    key: string;
    value: number;
    isOpen: boolean;
    direction: 'left' | 'right';
}

interface SwipeListProps {
    data: any[];
    type: string;
    noDelete?: boolean;
    noReplace?: boolean;
    isAnytime?: boolean;
    isPastDate?: boolean;
    styleHiddenItem?: any;
    isFutureDate?: boolean;
    scrollEnabled?: boolean;
    closeOnScroll?: boolean;
    onRowDidClose?: () => void;
    onDelete?: (item: any) => void;
    onReplace?: (item: any) => void;
    recipeReplacementEnable?: boolean;
    keyExtractor?: (item: any) => string;
    noReplaceItem?: (item: any) => boolean;
    handleCheckboxStatus?: (item: any) => void;
    directionalDistanceChangeThreshold?: number;
    onSwipeValueChange?: (item: SwipeValueChange) => void;
    ListHeaderComponent?: () => React.ReactElement | null;
    ListFooterComponent?: () => React.ReactElement | null;
    renderItem: (info: { item: any, index: number, separators: {
        highlight: () => void;
        unhighlight: () => void;
        updateProps: () => void;
    } }) => React.ReactElement;
}


export const SwipeList: React.FC<SwipeListProps> = ({
    data,
    type,
    renderItem,
    onRowDidClose,
    noDelete = false,
    noReplace = false,
    isAnytime = false,
    isPastDate = false,
    onSwipeValueChange,
    ListHeaderComponent,
    ListFooterComponent,
    onDelete = () => {},
    onReplace = () => {},
    handleCheckboxStatus,
    isFutureDate = false,
    scrollEnabled = true,
    closeOnScroll = true,
    styleHiddenItem = null,
    noReplaceItem = () => false,
    recipeReplacementEnable = true,
    keyExtractor = ({ id }) => String(id),
    directionalDistanceChangeThreshold = 2,
}) => {
    const handleReplaceButton = (item: any) => {
        const { status = PHASE_ITEM_STATUS.PENDING } = item;
        const isComplete = [PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.DID_NOT_EAT].includes(status);
        return ((isPastDate && !isComplete) || isComplete);
    };

    const isAddedByPatient = type === OVERVIEW_TYPE.ADDED_BY_PATIENT;
    const isInclude = type === OVERVIEW_TYPE.MEAL || type === OVERVIEW_TYPE.ADDED_BY_PATIENT;
    const width = (noReplace || noDelete || (isFutureDate && isInclude)) ? 100 : 200;

    return (
        <SwipeListView
            data={data}
            useFlatList
            disableRightSwipe
            style={styles.list}
            rightOpenValue={-width}
            recalculateHiddenLayout
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            closeOnScroll={closeOnScroll}
            scrollEnabled={scrollEnabled}
            onRowDidClose={onRowDidClose}
            onSwipeValueChange={onSwipeValueChange}
            ListHeaderComponent={ListHeaderComponent}
            ListFooterComponent={ListFooterComponent}
            disableLeftSwipe={isFutureDate || (noDelete && noReplace)}
            directionalDistanceChangeThreshold={directionalDistanceChangeThreshold}
            renderHiddenItem={(rowData, rowMap) => {
                const { item } = rowData;
                const rowKey = keyExtractor(item);
                return (
                    <View style={StyleSheet.flatten([styles.listItemHidden, styleHiddenItem])}>
                        <View style={[styles.listItemContent, { width }]}>
                            {(
                                noReplace
                                || isAddedByPatient
                                || noReplaceItem(item)
                                || !recipeReplacementEnable
                                || (isInclude && handleReplaceButton(item))
                            ) ? null : (
                                    <TouchableOpacity
                                        onPress={() => onReplace(item)}
                                        style={[styles.button, styles.listItemBtnReplace]}
                                    >
                                        <Icon iconStyle="solid" name="sync" color={COLORS.BLACK} size={30} />
                                        <Text style={styles.replaceBtn}>Replace</Text>
                                    </TouchableOpacity>
                                )}
                            {(_.get(item, 'type') === 'RECIPE' || _.get(item, 'type') === 'FOOD') && !isAnytime ? (
                                !isFutureDate && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            handleCheckboxStatus?.({
                                                ...item,
                                                status: PHASE_ITEM_STATUS.DID_NOT_EAT
                                            });
                                            rowMap[rowKey]?.closeRow();
                                        }}
                                        style={[styles.button, styles.listItemBtnNotEat]}
                                    >
                                        <Icon iconStyle="solid" name="times" color={COLORS.BLACK} size={30} />
                                        <Text style={[styles.notEatBtn, styles.offsetTop]}>Did</Text>
                                        <Text style={styles.notEatBtn}>Not Eat</Text>
                                    </TouchableOpacity>
                                )
                            ) : (
                                (<></>)
                            // <TouchableOpacity
                            //     onPress={() => onDelete(item)}
                            //     style={[styles.button, styles.listItemBtnDelete]}
                            // >
                            //     <Icon style={{ marginRight: 5 }} name="trash-alt" color={COLORS.WHITE} size={18} />
                            //     <Text color={COLORS.WHITE} style={styles.buttonText}>Delete</Text>
                            // </TouchableOpacity>
                            )}
                        </View>
                    </View>
                );
            }}
            onRowOpen={(rowKey, rowMap) => {
                setTimeout(() => {
                    // NOTE Need check to fix redirect issue
                    rowMap[rowKey] && rowMap[rowKey].closeRow();
                }, 10 * 1000);
            }}
        />
    );
};

export default SwipeList;

const styles = StyleSheet.create({
    list: {
    // paddingRight: OFFSET.HORIZONTAL
    // paddingRight: OFFSET.HORIZONTAL / 2
    },
    listItemHidden: {
        height: '100%',
        width: '100%',
        marginRight: 16,
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    listItemContent: {
        display: 'flex',
        flexDirection: 'row',
    },
    backTextWhite: {
        color: COLORS.WHITE,
    },
    button: {
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    buttonText: {
        color: COLORS.WHITE,
    },
    replaceBtn: {
        color: COLORS.BLACK,
        marginLeft: 4,
        marginTop: 20,
    },
    listItemBtnReplace: {
        backgroundColor: '#8EF9F3',
        flex: 1,
        flexDirection: 'column',
    // marginLeft: 5
    },
    notEatBtn: {
        color: COLORS.BLACK,
    },
    offsetTop: {
        marginTop: 20,
    },
    listItemBtnNotEat: {
        backgroundColor: '#E0F6F5',
        flexDirection: 'column',
        flex: 1,
    // borderWidth: 1,
    // borderColor: COLOR.BLACK.hex()
    },
    listItemBtnDelete: {
        backgroundColor: '#F55454',
        flex: 1,
    },
});
