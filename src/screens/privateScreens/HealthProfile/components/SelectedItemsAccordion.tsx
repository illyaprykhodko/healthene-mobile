// // outsource dependencies
// import Animated, {
//     Easing,
//     withTiming,
//     useSharedValue,
//     useDerivedValue,
//     LinearTransition,
//     useAnimatedStyle,
// } from 'react-native-reanimated';
// import { StyleSheet, ListRenderItemInfo, View } from 'react-native';
// import React, { memo, useMemo, useCallback, useEffect } from 'react';

// // local dependencies
// import Text from 'components/Text.tsx';
// import { OFFSET } from 'constants/offset.ts';
// import { useTheme } from 'hooks/useTheme.ts';
// import { Checkbox } from 'components/Checkbox.tsx';
// import Separator from 'components/FlatListSeparator';
// import { MedicalEntity, MedicalEntityItem } from 'types/healthProfile.ts';
// import { HealthProfileSectionType } from './HealthProfileListSection.tsx';

// interface SelectedItemsAccordionProps {
//     isExpanded: boolean;
//     data: MedicalEntity[];
//     type: HealthProfileSectionType;
//     onRemove?: (id: number) => void;
// }

// const SelectedItemsAccordion = ({ data, isExpanded, type, onRemove }: SelectedItemsAccordionProps) => {
//     const theme = useTheme();
//     const styles = useMemo(() => createStyles(theme), [theme]);

//     const selectedItemsList: MedicalEntity[] = useMemo(() => [...data], [data]);

//     const getEntityItem = useCallback((entity: MedicalEntity): MedicalEntityItem | undefined => {
//         if (type === 'medication') {
//             return entity.medication;
//         }
//         return entity.medicalTerm;
//     }, [type]);

//     const expanded = useSharedValue(0);
//     const itemHeight = 74; // Approximate height per item
//     const contentHeight = selectedItemsList.length * itemHeight;

//     useEffect(() => {
//         expanded.value = withTiming(isExpanded ? 1 : 0, {
//             duration: 300,
//             easing: Easing.bezier(0.4, 0.0, 0.2, 1),
//         });
//     }, [isExpanded, expanded]);

//     const animatedHeight = useDerivedValue(() => {
//         return expanded.value * contentHeight;
//     });

//     const animatedStyle = useAnimatedStyle(() => {
//         return {
//             height: animatedHeight.value,
//             opacity: expanded.value,
//         };
//     });

//     const handleCheckboxChange = useCallback((entityId: number, value: boolean) => {
//         if (!value && onRemove) {
//             onRemove(entityId);
//         }
//     }, [onRemove]);

//     const renderItem = useCallback(({ item }: ListRenderItemInfo<MedicalEntity>) => {
//         const entityItem = getEntityItem(item);
//         const displayName = entityItem?.name ?? '';
//         return (
//             <View style={styles.item}>
//                 <Text style={styles.itemText} numberOfLines={1}>{displayName}</Text>
//                 <Checkbox
//                     size={12}
//                     value={true}
//                     onChange={value => {
//                         handleCheckboxChange(item.id, value);
//                     }}
//                 />
//             </View>
//         );
//     }, [styles, getEntityItem, handleCheckboxChange]);

//     const keyExtractor = useCallback((entity: MedicalEntity) => entity.id.toString(), []);

//     if (selectedItemsList.length === 0) {
//         return null;
//     }

//     return (
//         <Animated.View style={[styles.accordionContainer, animatedStyle]}>
//             <Animated.FlatList
//                 scrollEnabled={false}
//                 renderItem={renderItem}
//                 data={selectedItemsList}
//                 keyExtractor={keyExtractor}
//                 itemLayoutAnimation={LinearTransition}
//                 ItemSeparatorComponent={Separator}
//                 contentContainerStyle={styles.listContent}
//             />
//         </Animated.View>
//     );
// };

// export default memo(SelectedItemsAccordion);

// const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
//     accordionContainer: {
//         overflow: 'hidden',
//     },
//     listContent: {
//         paddingVertical: OFFSET.VERTICAL,
//     },
//     item: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         justifyContent: 'space-between',
//         paddingVertical: OFFSET.VERTICAL,
//         paddingHorizontal: OFFSET.HORIZONTAL,
//     },
//     itemText: {
//         flex: 1,
//         paddingRight: OFFSET.POINT * 2,
//         color: theme.colors.text,
//     },
// });
