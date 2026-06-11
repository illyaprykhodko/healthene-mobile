// outsource dependencies
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useRoute } from '@react-navigation/native';
// local dependencies
import { useTheme } from 'hooks/useTheme';
import { AllRecordedData } from 'components/MeasurementChart';

const AllRecordedDataScreen: React.FC = () => {
    const route = useRoute();
    const theme = useTheme();
    const { measurementType, title } = (route.params as any) || {};

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <AllRecordedData
                measurementType={measurementType}
                title={title || measurementType}
            />
        </View>
    );
};

export default AllRecordedDataScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
});
