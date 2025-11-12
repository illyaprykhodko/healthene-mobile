// outsource dependencies
import React from 'react';
import Svg, { Path, Circle } from 'react-native-svg';

const InfoIcon: React.FC = () => (
    <Svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <Circle cx="9" cy="9" r="8" stroke="#2978A0" strokeWidth="2" />
        <Path
            d="M7.868 14V7.28H9.408V14H7.868ZM8.638 6.048C8.37667 6.048 8.15733 5.95933 7.98 5.782C7.812 5.60467 7.728 5.38533 7.728 5.124C7.728 4.86267 7.812 4.64333 7.98 4.466C8.15733 4.28867 8.37667 4.2 8.638 4.2C8.90867 4.2 9.128 4.28867 9.296 4.466C9.464 4.64333 9.548 4.86267 9.548 5.124C9.548 5.38533 9.464 5.60467 9.296 5.782C9.128 5.95933 8.90867 6.048 8.638 6.048Z"
            fill="#2978A0"
        />
    </Svg>
);

export default InfoIcon;
