// outsource dependencies
import React from 'react';
import Svg, { Path, Rect } from 'react-native-svg';


interface IconProps {
  disabled?: boolean;
  size?: number;
}

export const FoodIcon: React.FC<IconProps> = ({ disabled = false, size = 25 }) => {
    return (
        <Svg opacity={disabled ? 0.5 : 1} width={size} height={size * 1.16} viewBox="0 0 25 29" fill="none">
            <Path d="M24.9619 13.5501C24.4235 4.39607 17.5579 5.31421 12.8463 6.8192C6.11538 4.79997 0.73065 6.8192 0.0575591 13.5501C-0.615532 20.281 4.7692 28.3581 8.13465 28.3581C11.5001 28.3581 11.4425 27.0119 12.8463 27.0119C14.0504 27.0119 14.808 28.3581 17.5004 28.3581C20.1927 28.3581 25.5004 22.7042 24.9619 13.5501Z" fill="#2978A0" />
            <Path d="M6.59234 0.867324C6.05078 0.975636 5.69956 1.50246 5.80787 2.04402C5.91618 2.58558 6.44301 2.9368 6.98457 2.82849L6.59234 0.867324ZM6.98457 2.82849C8.08336 2.60873 9.42846 2.50366 10.3966 2.97173C10.8413 3.18673 11.2223 3.53006 11.4823 4.10652C11.7518 4.70402 11.9174 5.61286 11.7928 6.98338L13.7846 7.16445C13.9293 5.57336 13.76 4.29206 13.3054 3.28427C12.8414 2.25544 12.1094 1.57833 11.2671 1.17113C9.66145 0.394821 7.73718 0.638355 6.59234 0.867324L6.98457 2.82849Z" fill="#2978A0" />
        </Svg>
    );
};

export const DrinkIcon: React.FC<IconProps> = ({ disabled = false, size = 26 }) => {
    return (
        <Svg opacity={disabled ? 0.5 : 1} width={size} height={size * 1.23} viewBox="0 0 26 32" fill="none">
            <Path d="M5.98787 9.3374L3.12975 10.2901C2.58868 10.4705 2.24931 11.0067 2.31794 11.5729L4.47206 29.3444C4.54509 29.9469 5.05645 30.4 5.66334 30.4H20.9042C21.5248 30.4 22.043 29.9268 22.0992 29.3087L23.714 11.5465C23.7644 10.992 23.4267 10.4756 22.8984 10.2995L19.8416 9.28056C18.9035 8.96785 17.8917 8.95252 16.9445 9.23668L13.9497 10.1351C12.9444 10.4367 11.8679 10.4005 10.8851 10.0319L9.19116 9.3967C8.1617 9.01065 7.03091 8.98972 5.98787 9.3374Z" fill="#CCDCE4" />
            <Path d="M1.16116 2.34297C1.07544 1.62867 1.63318 1 2.35261 1H23.674C24.384 1 24.9387 1.61298 24.8681 2.3194L22.1081 29.9194C22.0467 30.5328 21.5305 31 20.914 31H5.66461C5.05717 31 4.54553 30.5461 4.47316 29.943L1.16116 2.34297Z" stroke="#2978A0" strokeWidth="2" />
            <Path d="M2.20001 10.6L5.40887 9.3967C6.43833 9.01065 7.56911 8.98972 8.61215 9.3374L10.9584 10.1195C11.8965 10.4322 12.9084 10.4475 13.8555 10.1634L16.6965 9.31107C17.7957 8.98132 18.9766 9.05627 20.0252 9.52234L23.8 11.2" stroke="#2978A0" strokeWidth="2" />
        </Svg>
    );
};

export const SupplementIcon: React.FC<IconProps> = ({ disabled = false, size = 17 }) => {
    return (
        <Svg opacity={disabled ? 0.5 : 1} width={size} height={size * 1.88} viewBox="0 0 17 32" fill="none">
            <Rect x="1.1427" y="1.41667" width="14" height="29.1667" rx="7" stroke="#2978A0" strokeWidth="2" />
            <Path d="M1.1427 8.41668C1.1427 4.55068 4.27671 1.41667 8.1427 1.41667C12.0087 1.41667 15.1427 4.55068 15.1427 8.41667V16.5833H1.1427V8.41668Z" fill="#2978A0" stroke="#2978A0" strokeWidth="2" />
        </Svg>
    );
};

export const MeasurementIcon: React.FC<IconProps> = ({ disabled = false, size = 30 }) => {
    return (
        <Svg opacity={disabled ? 0.5 : 1} width={size} height={size} viewBox="0 0 30 30" fill="none">
            <Rect x="21.8692" width="10.012" height="31.8244" rx="2.503" transform="rotate(43.4075 21.8692 0)" stroke="#2978A0" strokeWidth="2" />
            <Path d="M8.42164 21.5485C8.81217 21.939 9.44533 21.939 9.83585 21.5485C10.2264 21.158 10.2264 20.5248 9.83585 20.1343L8.42164 21.5485ZM5.29289 18.4198L8.42164 21.5485L9.83585 20.1343L6.70711 17.0055L5.29289 18.4198Z" fill="#2978A0" />
            <Path d="M14.4216 15.5485C14.8122 15.939 15.4453 15.939 15.8359 15.5485C16.2264 15.158 16.2264 14.5248 15.8359 14.1343L14.4216 15.5485ZM11.2929 12.4198L14.4216 15.5485L15.8359 14.1343L12.7071 11.0055L11.2929 12.4198Z" fill="#2978A0" />
            <Path d="M19.4216 9.5485C19.8122 9.93903 20.4453 9.93903 20.8359 9.5485C21.2264 9.15798 21.2264 8.52481 20.8359 8.13429L19.4216 9.5485ZM16.2929 6.41975L19.4216 9.5485L20.8359 8.13429L17.7071 5.00554L16.2929 6.41975Z" fill="#2978A0" />
        </Svg>
    );
};

export const ActivityIcon: React.FC<IconProps> = ({ disabled = false, size = 30 }) => {
    return (
        <Svg opacity={disabled ? 0.5 : 1} width={size} height={size * 0.93} viewBox="0 0 30 28" fill="none">
            <Path d="M27.4185 22.7918C25.3521 22.7773 19.5158 22.737 18.5679 22.737C16.6283 22.7957 9.26472 11.7308 5.28016 6.50955C5.125 6.30624 5.0883 6.0395 5.19421 5.8067C5.78304 4.51242 7.07503 2.37505 8.64273 1.85249C10.8094 1.13026 10.8094 1.85249 12.2538 4.74137C13.6983 7.63026 18.7538 6.18582 20.1983 6.18582C21.3538 6.18582 22.1242 12.4451 22.3649 15.5747C22.3649 16.4471 22.9039 17.2184 23.6726 17.6309C25.7575 18.7495 27.6025 20.4457 28.0432 22.0789C28.1476 22.466 27.8194 22.7946 27.4185 22.7918Z" fill="#2978A0" />
            <Path d="M18.5679 22.737C19.5158 22.737 25.3521 22.7773 27.4185 22.7918C27.8194 22.7946 28.1476 22.466 28.0432 22.0789C27.6025 20.4457 25.7575 18.7495 23.6726 17.6309C22.9039 17.2184 22.3649 16.4471 22.3649 15.5747V15.5747C22.1242 12.4451 21.3538 6.18582 20.1983 6.18582C18.7538 6.18582 13.6983 7.63026 12.2538 4.74137C10.8094 1.85249 10.8094 1.13026 8.64273 1.85249C7.07503 2.37505 5.78304 4.51243 5.19421 5.8067C5.0883 6.0395 5.125 6.30624 5.28016 6.50955C9.26472 11.7308 16.6283 22.7957 18.5679 22.737ZM18.5679 22.737C18.6522 22.7345 18.5188 22.737 18.5679 22.737Z" stroke="#2978A0" strokeWidth="1.44444" />
            <Path d="M18.0316 11.9636C17.6327 11.9636 17.3094 12.287 17.3094 12.6859C17.3094 13.0847 17.6327 13.4081 18.0316 13.4081V11.9636ZM23.8094 11.9636H18.0316V13.4081H23.8094V11.9636Z" fill="white" />
            <Path d="M18.0316 8.35255C17.6327 8.35255 17.3094 8.6759 17.3094 9.07477C17.3094 9.47364 17.6327 9.79699 18.0316 9.79699L18.0316 8.35255ZM22.3649 8.35255L18.0316 8.35255L18.0316 9.79699L22.3649 9.79699L22.3649 8.35255Z" fill="white" />
            <Path d="M2.1427 9.07474L14.13 24.2166C15.2259 25.6008 16.8945 26.4081 18.66 26.4081H28.1427" stroke="#2978A0" strokeWidth="2.88889" strokeLinecap="round" />
        </Svg>
    );
};

export const CloseIcon: React.FC<{ size?: number; color?: string }> = ({ size = 20, color = '#181818' }) => {
    return (
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
            <Path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
        </Svg>
    );
};
// think about using the new icons
// outsource dependencies
// import React from 'react';
// import { View, StyleSheet } from 'react-native';
// import Icon from '@react-native-vector-icons/fontawesome5';
// // local dependencies
// import { useTheme } from 'hooks/useTheme';

// const iconStyles = StyleSheet.create({
//     container: {
//         width: 50,
//         height: 50,
//         borderRadius: 25,
//         alignItems: 'center',
//         justifyContent: 'center',
//     },
//     disabled: {
//         opacity: 0.5,
//     },
// });

// interface IconProps {
//   disabled?: boolean;
//   size?: number;
// }

// export const FoodIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
//     const theme = useTheme();
//     return (
//         <View style={[
//             iconStyles.container,
//             { backgroundColor: disabled ? theme.colors.lightGrey : '#FFE0B3' },
//             disabled && iconStyles.disabled
//         ]}>
//             <Icon
//                 name="utensils"
//                 size={size}
//                 color={disabled ? theme.colors.grey : '#C56A00'}
//             />
//         </View>
//     );
// };

// export const DrinkIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
//     const theme = useTheme();
//     return (
//         <View style={[
//             iconStyles.container,
//             { backgroundColor: disabled ? theme.colors.lightGrey : '#E3F2FD' },
//             disabled && iconStyles.disabled
//         ]}>
//             <Icon
//                 name="glass-martini"
//                 size={size}
//                 color={disabled ? theme.colors.grey : '#1976D2'}
//             />
//         </View>
//     );
// };

// export const SupplementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
//     const theme = useTheme();
//     return (
//         <View style={[
//             iconStyles.container,
//             { backgroundColor: disabled ? theme.colors.lightGrey : '#F3E5F5' },
//             disabled && iconStyles.disabled
//         ]}>
//             <Icon
//                 name="capsules"
//                 size={size}
//                 color={disabled ? theme.colors.grey : '#7B1FA2'}
//             />
//         </View>
//     );
// };

// export const MeasurementIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
//     const theme = useTheme();
//     return (
//         <View style={[
//             iconStyles.container,
//             { backgroundColor: disabled ? theme.colors.lightGrey : '#E8F5E8' },
//             disabled && iconStyles.disabled
//         ]}>
//             <Icon
//                 name="ruler"
//                 size={size}
//                 color={disabled ? theme.colors.grey : '#388E3C'}
//             />
//         </View>
//     );
// };

// export const ActivityIcon: React.FC<IconProps> = ({ disabled = false, size = 24 }) => {
//     const theme = useTheme();
//     return (
//         <View style={[
//             iconStyles.container,
//             { backgroundColor: disabled ? theme.colors.lightGrey : '#FFF3E0' },
//             disabled && iconStyles.disabled
//         ]}>
//             <Icon
//                 name="running"
//                 size={size}
//                 color={disabled ? theme.colors.grey : '#F57C00'}
//             />
//         </View>
//     );
// };
