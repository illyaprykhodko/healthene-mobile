// outsource dependencies
import _ from 'lodash';
import React from 'react';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { SwipeListView } from 'react-native-swipe-list-view';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// local dependencies
import { COLORS } from '../../constants/colors';

// Temporary constants until full migration
const OVERVIEW_TYPE = {
    MEAL: 'MEAL',
    SUPPLEMENT: 'SUPPLEMENT',
    MEDICATION: 'MEDICATION',
    MEASUREMENT: 'MEASUREMENT',
    ADDED_BY_PATIENT: 'ADDED_BY_PATIENT',
    PHYSICAL_ACTIVITY: 'PHYSICAL_ACTIVITY',
};

const PHASE_ITEM_STATUS = {
    DONE: 'DONE',
    PENDING: 'PENDING',
    DID_NOT_EAT: 'DID_NOT_EAT',
};

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
    onRowDidClose?: () => void;
    onDelete?: (item: any) => void;
    onReplace?: (item: any) => void;
    onSwipeValueChange?: () => void;
    recipeReplacementEnable?: boolean;
    keyExtractor?: (item: any) => string;
    noReplaceItem?: (item: any) => boolean;
    handleCheckboxStatus?: (item: any) => void;
    ListHeaderComponent?: () => React.ReactElement | null;
    renderItem: (info: { item: any }) => React.ReactElement;
}

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
        color: '#FFF',
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
        backgroundColor: COLORS.RED,
        flex: 1,
    },
});

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
    onDelete = () => {},
    onReplace = () => {},
    handleCheckboxStatus,
    isFutureDate = false,
    scrollEnabled = true,
    styleHiddenItem = null,
    noReplaceItem = () => false,
    recipeReplacementEnable = true,
    keyExtractor = ({ id }) => String(id),
}) => {
    const handleReplaceButton = (item: any) => {
        const { status = PHASE_ITEM_STATUS.PENDING } = item;
        const isComplete = [PHASE_ITEM_STATUS.DONE, PHASE_ITEM_STATUS.DID_NOT_EAT].includes(status);
        return ((isPastDate && !isComplete) || isComplete);
    };

    const isAddedByPatient = type === OVERVIEW_TYPE.ADDED_BY_PATIENT;
    const isInclude = [OVERVIEW_TYPE.MEAL, OVERVIEW_TYPE.ADDED_BY_PATIENT].includes(type);
    const width = (noReplace || noDelete || (isFutureDate && isInclude)) ? 100 : 200;

    return (
        <SwipeListView
            data={data}
            useFlatList
            closeOnScroll
            disableRightSwipe
            style={styles.list}
            rightOpenValue={-width}
            recalculateHiddenLayout
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={scrollEnabled}
            onRowDidClose={onRowDidClose}
            onSwipeValueChange={onSwipeValueChange}
            ListHeaderComponent={ListHeaderComponent}
            disableLeftSwipe={isFutureDate || (noDelete && noReplace)}
            renderHiddenItem={({ item }) => {
                const isDidNotEatStatus = item.status === PHASE_ITEM_STATUS.DID_NOT_EAT;
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
                                        <Icon name="sync" color={COLORS.BLACK} size={30} />
                                        <Text style={styles.replaceBtn}>Replace</Text>
                                    </TouchableOpacity>
                                )}
                            {(_.get(item, 'type') === 'RECIPE' || _.get(item, 'type') === 'FOOD') && !isAnytime ? (
                                !isFutureDate && (
                                    <TouchableOpacity
                                        onPress={() => handleCheckboxStatus?.(
                                            isDidNotEatStatus
                                                ? { item: { ...item }, status: PHASE_ITEM_STATUS.DID_NOT_EAT }
                                                : { item }
                                        )}
                                        style={[styles.button, styles.listItemBtnNotEat]}
                                    >
                                        <Icon name="times" color={COLORS.BLACK} size={30} />
                                        <Text style={[styles.notEatBtn, styles.offsetTop]}>Did</Text>
                                        <Text style={styles.notEatBtn}>Not Eat</Text>
                                    </TouchableOpacity>
                                )
                            ) : (
                                <></>
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
