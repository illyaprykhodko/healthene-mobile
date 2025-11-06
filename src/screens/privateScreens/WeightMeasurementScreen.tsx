// outsource dependencies
import * as yup from 'yup';
import moment from 'moment';
import { Formik } from 'formik';
import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    Platform,
    TextInput,
    StyleSheet,
    TouchableOpacity,
    KeyboardAvoidingView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useNavigation, useRoute } from '@react-navigation/native';
// local dependencies
import { ROUTES } from 'constants/routes';
import { useTheme } from 'hooks/useTheme';
import { RootStackParamList } from 'services/navigation/types';
import { useMeasurementSubmit } from 'hooks/useMeasurementSubmit';

type Navigation = StackNavigationProp<RootStackParamList>;

const validationSchema = yup.object().shape({
    value: yup
        .string()
        .matches(/^\d+([.,]\d{1})?$/, { message: 'Shouldn\'t have more than 1 symbol after comma' })
        .required('Weight is required'),
});

const WeightMeasurementScreen: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const route = useRoute();
    const theme = useTheme();
    const [isPanelOpen, setIsPanelOpen] = useState(false);

    const measurementPhaseItem = (route.params as any)?.measurementPhaseItem;
    const item = measurementPhaseItem || {};

    const { submit, isSubmitting } = useMeasurementSubmit(item, {
        onSuccess: () => {
            navigation.goBack();
        },
        onError: error => {
            // console.error('[WeightMeasurementScreen] Submit error:', error);
        },
    });

    const handleSmartScalePress = useCallback(() => {
        if (isPanelOpen) {
            setIsPanelOpen(false);
            return;
        }
        navigation.navigate(ROUTES.SMART_SCALE, {
            measurementPhaseItem: item,
        });
    }, [navigation, item, isPanelOpen]);

    const handleManualPress = useCallback(() => {
        setIsPanelOpen(!isPanelOpen);
    }, [isPanelOpen]);

    const handleSubmit = useCallback(
        async (values: { value: string }) => {
            setIsPanelOpen(false);
            await submit(
                { value: values.value.replace(',', '.') },
                'HEALTHENE_MANUAL_INPUT',
                'lbs'
            );
        },
        [submit]
    );

    return (
        <View style={styles.container}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                {isPanelOpen && (
                    <TouchableOpacity
                        activeOpacity={1}
                        style={styles.overlayBackground}
                        onPress={() => setIsPanelOpen(false)}
                    />
                )}

                <TouchableOpacity
                    onPress={handleSmartScalePress}
                    style={[styles.scaleButton, { borderColor: theme.colors.success }]}
                >
                    <Text style={[styles.scaleButtonText, { color: theme.colors.text }]}>
                        Step on Scale
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={handleManualPress}
                    style={[styles.manualButton, { borderColor: theme.colors.primary }]}
                >
                    <Text style={[styles.manualButtonText, { color: theme.colors.primary }]}>
                        Add your Weight Manually
                    </Text>
                </TouchableOpacity>

                {isPanelOpen && (
                    <Formik
                        onSubmit={handleSubmit}
                        initialValues={{ value: '' }}
                        validationSchema={validationSchema}
                    >
                        {({ values, errors, touched, setFieldValue, setFieldTouched, handleSubmit }) => (
                            <View style={styles.formContainer}>
                                <View style={styles.header}>
                                    <TouchableOpacity
                                        onPress={() => setIsPanelOpen(false)}
                                        style={styles.headerButton}
                                    >
                                        <Text style={[styles.headerButtonText, { color: theme.colors.primary }]}>
                                            Cancel
                                        </Text>
                                    </TouchableOpacity>
                                    <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                        Weight
                                    </Text>
                                    <TouchableOpacity
                                        onPress={() => handleSubmit()}
                                        disabled={!values.value || !!errors.value || isSubmitting}
                                        style={styles.headerButton}
                                    >
                                        <Text
                                            style={[
                                                styles.headerButtonText,
                                                {
                                                    color:
                                                        !values.value || errors.value
                                                            ? theme.colors.textSecondary
                                                            : theme.colors.primary,
                                                },
                                            ]}
                                        >
                                            {isSubmitting ? 'Adding...' : 'Add'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.dateContainer}>
                                    <View style={[styles.item, { borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                                            Date
                                        </Text>
                                        <Text style={[styles.itemValue, { color: theme.colors.text }]}>
                                            {moment().format('MMM Do YY')}
                                        </Text>
                                    </View>
                                    <View style={[styles.item, { borderBottomColor: theme.colors.border }]}>
                                        <Text style={[styles.itemLabel, { color: theme.colors.text }]}>
                                            Time
                                        </Text>
                                        <Text style={[styles.itemValue, { color: theme.colors.text }]}>
                                            {moment().format('LT')}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.item,
                                            { borderBottomColor: theme.colors.border },
                                            errors.value && touched.value && styles.errorInput,
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.itemLabel,
                                                { color: theme.colors.text },
                                                errors.value && touched.value && styles.errorText,
                                            ]}
                                        >
                                            lbs.
                                        </Text>
                                        <TextInput
                                            maxLength={40}
                                            placeholder="0.0"
                                            value={values.value}
                                            keyboardType="decimal-pad"
                                            onBlur={() => setFieldTouched('value')}
                                            placeholderTextColor={theme.colors.textSecondary}
                                            onChangeText={text => {
                                                const processedText = text.replace(/[^0-9.,]/g, '');
                                                const parts = processedText.split('.');
                                                if (parts.length <= 2) {
                                                    setFieldValue('value', processedText);
                                                }
                                            }}
                                            style={[
                                                styles.input,
                                                { color: theme.colors.text },
                                                Platform.OS === 'ios' && styles.inputIOS,
                                            ]}
                                        />
                                    </View>
                                    {errors.value && touched.value && (
                                        <Text style={[styles.errorTextSmall, { color: theme.colors.error }]}>
                                            {errors.value}
                                        </Text>
                                    )}
                                </View>
                            </View>
                        )}
                    </Formik>
                )}
            </KeyboardAvoidingView>
        </View>
    );
};

export default WeightMeasurementScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    overlayBackground: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#DADADA99',
        zIndex: 1,
    },
    scaleButton: {
        marginTop: 70,
        marginHorizontal: 20,
        height: 80,
        borderWidth: 2,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#E8F5E9',
    },
    scaleButtonText: {
        fontSize: 24,
        fontWeight: '600',
    },
    manualButton: {
        marginTop: 30,
        marginHorizontal: 20,
        paddingVertical: 16,
        borderWidth: 2,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    manualButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    formContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 10,
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        paddingTop: 20,
        backgroundColor: '#FFFFFF',
        minHeight: '50%',
        zIndex: 2,
        // iOS shadow
        shadowOffset: { width: 0, height: -2 },
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 5,
        // Android shadow
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    },
    headerButton: {
        width: '33.33%',
    },
    headerButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    headerTitle: {
        width: '33.33%',
        fontSize: 20,
        fontWeight: 'bold',
        textAlign: 'center',
    },
    dateContainer: {
        paddingTop: 10,
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    itemLabel: {
        fontSize: 18,
        fontWeight: '500',
    },
    itemValue: {
        fontSize: 18,
        fontWeight: '400',
    },
    input: {
        width: 200,
        fontSize: 18,
        textAlign: 'right',
    },
    inputIOS: {
        paddingVertical: 4,
    },
    errorInput: {
        borderBottomColor: '#D32F2F',
    },
    errorText: {
        color: '#D32F2F',
    },
    errorTextSmall: {
        padding: 5,
        fontSize: 12,
        textAlign: 'right',
        paddingRight: 20,
    },
});
