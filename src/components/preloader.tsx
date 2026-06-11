// outsource dependencies
import React, { PureComponent } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { SkypeIndicator, MaterialIndicator } from 'react-native-indicators';
// local dependencies
import Text from './Text';
import { useTheme } from '../hooks/useTheme';

export const TYPE = {
    MAINTENANCE: 'MAINTENANCE',
    SPINNER: 'SPINNER',
    BOX: 'BOX',
} as const;

type PreloaderType = typeof TYPE[keyof typeof TYPE];

interface PreloaderProps {
  active?: boolean;
  type?: PreloaderType;
  children?: React.ReactNode;
  containerStyle?: ViewStyle;
}

class Preloader extends PureComponent<PreloaderProps> {
    static defaultProps = {
        active: false,
        children: null,
        type: undefined,
    };

    render () {
        const { type, active, children, ...attr } = this.props;
        // NOTE do nothing
        if (!active) { return children; }
        // NOTE show preloader
        switch (type) {
            default:
                return <BoxPreloader {...attr} />;
            case TYPE.MAINTENANCE:
                return <Maintenance />;
            case TYPE.BOX:
                return <BoxPreloader {...attr} />;
            case TYPE.SPINNER:
                return <BoxPreloader {...attr} />;
        }
    }
}

const MStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    spinnerRow: {
        display: 'flex',
        marginBottom: 30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    sp1: {
        alignSelf: 'flex-start',
    },
    sp2: {
        margin: -10,
    },
    sp3: {
        alignSelf: 'flex-end',
    },
});

const Maintenance: React.FC = () => {
    const theme = useTheme();
    // BallIndicator, BarIndicator, DotIndicator, MaterialIndicator, PacmanIndicator, PulseIndicator, UIActivityIndicator, WaveIndicator
    return (
        <View style={[MStyles.container, { backgroundColor: theme.colors.background }]}>
            <View style={MStyles.spinnerRow}>
                <MaterialIndicator color={theme.colors.primary} size={70} style={MStyles.sp1} />
                <MaterialIndicator color={theme.colors.secondary} size={150} style={MStyles.sp2} />
                <MaterialIndicator color={theme.colors.success} size={70} style={MStyles.sp3} />
            </View>
            <Text variant="bold" style={{ textAlign: 'center' }}>
          APP IS UNDER MAINTENANCE
            </Text>
            <Text style={{ textAlign: 'center' }}>
          We'll back online shortly!
            </Text>
        </View>
    );
};

const BPStyles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

interface BoxPreloaderProps {
  containerStyle?: ViewStyle;
}

const BoxPreloader: React.FC<BoxPreloaderProps> = ({ containerStyle }) => {
    const theme = useTheme();
    const style = StyleSheet.flatten([BPStyles.container, { backgroundColor: theme.colors.background }, containerStyle]);

    return (
        <View style={style}>
            <SkypeIndicator color={theme.colors.primary} size={120} />
        </View>
    );
};

// shortcut
export const BoxHolder = (props: Omit<PreloaderProps, 'type'>) => (
    <Preloader type={TYPE.BOX} {...props} />
);
export const MaintenanceHolder = (props: Omit<PreloaderProps, 'type'>) => (
    <Preloader type={TYPE.MAINTENANCE} {...props} />
);
export const Spinner = (props: Omit<PreloaderProps, 'type'>) => (
    <Preloader type={TYPE.SPINNER} {...props} />
);
