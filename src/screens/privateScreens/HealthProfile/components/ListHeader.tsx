// // outsource dependencies
// import Animated, {
//     Easing,
//     withTiming,
//     useSharedValue,
//     useAnimatedStyle,
// } from 'react-native-reanimated';
// import React, { useEffect } from 'react';
// import { Pressable, StyleSheet, View } from 'react-native';
// import Icon from '@react-native-vector-icons/fontawesome5';

// // local dependencies
// import Text from 'components/Text.tsx';
// import { useTheme } from 'hooks/useTheme.ts';
// import { OFFSET } from 'constants/offset.ts';

// interface ListHeaderProps {
//     title: string;
//     onAction: () => void;
//     onToggleAccordion?: () => void;
//     isAccordionExpanded?: boolean;
//     showAccordionToggle?: boolean;
// }

// const AnimatedIcon = Animated.createAnimatedComponent(Icon);

// const ListHeader = ({ onAction, title, onToggleAccordion, isAccordionExpanded = false, showAccordionToggle = false }: ListHeaderProps) => {
//     const theme = useTheme();
//     const rotation = useSharedValue(0);

//     useEffect(() => {
//         rotation.value = withTiming(isAccordionExpanded ? 180 : 0, {
//             duration: 300,
//             easing: Easing.bezier(0.4, 0.0, 0.2, 1),
//         });
//     }, [isAccordionExpanded, rotation]);

//     const chevronStyle = useAnimatedStyle(() => {
//         return {
//             transform: [{ rotate: `${rotation.value}deg` }],
//         };
//     });

//     return <View style={styles.container}>
//         <View style={styles.leftSection}>
//             <Text variant="h4" color={theme.colors.primary}>{title}</Text>
//         </View>
//         <View style={styles.rightSection}>
//             {showAccordionToggle && onToggleAccordion && (
//                 <Pressable onPress={onToggleAccordion} style={styles.chevronButton}>
//                     <AnimatedIcon
//                         size={24}
//                         iconStyle="solid"
//                         name="chevron-down"
//                         style={chevronStyle}
//                         color={theme.colors.grey}
//                     />
//                 </Pressable>
//             )}
//             <Pressable onPress={onAction}>
//                 <Icon iconStyle="solid" name="edit" size={24} color={theme.colors.grey} />
//             </Pressable>
//         </View>
//     </View>;
// };

// export default ListHeader;
// const styles = StyleSheet.create({
//     container: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         paddingTop: OFFSET.VERTICAL,
//     },
//     leftSection: {
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: OFFSET.POINT * 2,
//     },
//     chevronButton: {
//         padding: OFFSET.POINT,
//     },
//     rightSection: {
//         marginLeft: 'auto',
//         flexDirection: 'row',
//         alignItems: 'center',
//         gap: OFFSET.HORIZONTAL,
//     }
// });
