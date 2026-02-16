// // outsource dependencies
// import React, { memo, useMemo } from 'react';
// import { StyleSheet, View } from 'react-native';
// import { DotIndicator } from 'react-native-indicators';

// // local dependencies
// import { OFFSET } from 'constants/offset.ts';
// import { useTheme } from 'hooks/useTheme.ts';

// interface FooterProps {
//     isLoading: boolean;
// }

// const Footer = ({ isLoading }: FooterProps) => {
//     const theme = useTheme();
//     const styles = useMemo(() => createStyles(), []);

//     if (!isLoading) {
//         return null;
//     }

//     return (
//         <View style={styles.footer}>
//             <DotIndicator color={theme.colors.primary} size={12} />
//         </View>
//     );
// };

// export default memo(Footer);

// const createStyles = () => StyleSheet.create({
//     footer: {
//         paddingVertical: OFFSET.VERTICAL * 2,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
// });
