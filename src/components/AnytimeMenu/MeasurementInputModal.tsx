// outsource dependencies
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import React, { useState, useMemo, useEffect } from 'react';
import {
    View,
    Modal,
    Platform,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
} from 'react-native';
// components
import Text from 'components/Text';
import { HTMLView } from 'components/HTMLView';
import { SwipeablePanel } from 'components/SwipeablePanel';
// hooks
import { useTheme } from 'hooks/useTheme';
import { useHealthIntegration } from 'hooks/useHealthIntegration';
import { useMeasurementSubmit } from 'hooks/useMeasurementSubmit';
import { useGetLastMeasurementQuery } from 'store/api/dayOverviewApi';
// types
import type { MeasurementType } from 'types/health';
import type { AnytimeMeasurementItem } from 'types/anytime';
// utils
import { getMeasurementConfig, getMeasurementValidationSchema } from 'utils/measurement';
// local dependencies
import { GraphIcon, InfoIcon } from '../icons';
import { MeasurementIcon } from './AnytimeIcons';
import { MeasurementField } from './MeasurementField';
import { BloodPressureFields } from './BloodPressureFields';

interface MeasurementInputModalProps {
    visible: boolean;
    disabled?: boolean;
    onClose: () => void;
    item: AnytimeMeasurementItem;
}

export const MeasurementInputModal: React.FC<MeasurementInputModalProps> = ({
    item,
    visible,
    onClose,
    disabled = false,
}) => {
    const theme = useTheme();
    const measurementType = item.measurement?.type as MeasurementType;
    const config = useMemo(() => getMeasurementConfig(measurementType), [measurementType]);
    const validationSchema = useMemo(() => getMeasurementValidationSchema(measurementType), [measurementType]);

    const [selectedUnit, setSelectedUnit] = useState(config.defaultUnit);
    const [showUnitPicker, setShowUnitPicker] = useState(false);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [hasLastMeasurement, setHasLastMeasurement] = useState(false);
    
    const navigation = useNavigation();

    const {
        isAvailable: healthAppAvailable,
        hasPermissions: healthAppPermissions,
        isLoading: healthAppLoading,
        fetchLatestSample,
    } = useHealthIntegration();

    const { submit, isSubmitting } = useMeasurementSubmit(item, {
        onSuccess: onClose,
        onError: error => {
            console.error('[MeasurementInputModal] Submit error:', error);
        },
    });

    const { data: lastMeasurement } = useGetLastMeasurementQuery(measurementType);
    
    useEffect(() => {
        if (lastMeasurement?.values?.[0]) {
            setHasLastMeasurement(true);
        } else {
            setHasLastMeasurement(false);
        }
    }, [lastMeasurement]);

    // Initial form values
    const initialValues = useMemo(() => {
        const values: Record<string, string> = {};
        config.fields.forEach(field => {
            values[field.name] = '';
        });
        return values;
    }, [config]);

    // Handle fetch from health app
    const handleFetchFromHealth = async (setValues: (values: any) => void) => {
        try {
            const sample = await fetchLatestSample(measurementType);
      
            if (!sample) {
                console.warn('[MeasurementInputModal] No health data found for today');
                return;
            }

            if (measurementType === 'BLOOD_PRESSURE') {
                const bpValue = sample.value as { systolic: number; diastolic: number };
                setValues({
                    systolic: String(bpValue.systolic),
                    diastolic: String(bpValue.diastolic),
                });
            } else {
                setValues({
                    value: String(sample.value),
                });
            }

            // Submit immediately with health app source
            await submit(
                [sample],
                Platform.OS === 'ios' ? 'APPLE_HEALTH' : 'GOOGLE_FIT',
                selectedUnit
            );
        } catch (error) {
            console.error('[MeasurementInputModal] Fetch from health error:', error);
        }
    };

    const showHealthButton = config.supportsHealthApp && healthAppAvailable && healthAppPermissions;

    const openPanel = () => setIsPanelOpen(true);
    const closePanel = () => setIsPanelOpen(false);

    const goToChart = () => {
        onClose(); // Close modal first
        (navigation as any).navigate('MeasurementChart', {
            measurementType,
            measurementName: item.measurement?.name,
        });
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={onClose}
            presentationStyle="pageSheet"
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={styles.container}
            >
                <View style={[styles.header, { backgroundColor: '#E0EBF7', borderBottomColor: theme.colors.border }]}>
                    <View style={styles.headerLeft}>
                        <MeasurementIcon size={24} />
                        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                            {item.measurement?.name || 'Measurement'}
                        </Text>
                    </View>
                    <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                        <Icon name="times" size={24} color={theme.colors.text} />
                    </TouchableOpacity>
                </View>

                <Formik
                    initialValues={initialValues}
                    validationSchema={validationSchema}
                    onSubmit={values => submit(values, 'HEALTHENE_MANUAL_INPUT', selectedUnit)}
                >
                    {({ values, errors, touched, setFieldValue, setFieldTouched, handleSubmit, setValues }) => (
                        <ScrollView contentContainerStyle={styles.content}>
                            <Text style={[styles.label, { color: theme.colors.text }]}>
                Input {item.measurement?.name}
                            </Text>
                            {measurementType === 'BLOOD_PRESSURE' ? (
                                <BloodPressureFields
                                    systolicField={config.fields[0]}
                                    diastolicField={config.fields[1]}
                                    disabled={disabled || isSubmitting}
                                    systolicValue={values.systolic || ''}
                                    diastolicValue={values.diastolic || ''}
                                    onSystolicBlur={() => setFieldTouched('systolic')}
                                    onDiastolicBlur={() => setFieldTouched('diastolic')}
                                    onSystolicChange={text => setFieldValue('systolic', text)}
                                    onDiastolicChange={text => setFieldValue('diastolic', text)}
                                    systolicError={touched.systolic ? errors.systolic : undefined}
                                    diastolicError={touched.diastolic ? errors.diastolic : undefined}
                                />
                            ) : (
                                config.fields.map(field => (
                                    <MeasurementField
                                        field={field}
                                        key={field.name}
                                        unit={selectedUnit}
                                        value={values[field.name] || ''}
                                        disabled={disabled || isSubmitting}
                                        onBlur={() => setFieldTouched(field.name)}
                                        onChange={text => setFieldValue(field.name, text)}
                                        error={touched[field.name] ? errors[field.name] : undefined}
                                    />
                                ))
                            )}

                            {/* Unit Selector (if multiple units available and not BP) */}
                            {config.units.length > 1 && measurementType !== 'BLOOD_PRESSURE' && (
                                <View style={styles.unitSelector}>
                                    <TouchableOpacity
                                        onPress={() => setShowUnitPicker(!showUnitPicker)}
                                        style={styles.unitButton}
                                    >
                                        <Text style={[styles.unitButtonText, { color: theme.colors.blue }]}>
                      Unit: {selectedUnit}
                                        </Text>
                                        <Icon
                                            size={16}
                                            color={theme.colors.blue}
                                            name={showUnitPicker ? 'chevron-up' : 'chevron-down'}
                                        />
                                    </TouchableOpacity>

                                    {showUnitPicker && (
                                        <View style={styles.unitPicker}>
                                            {config.units.map(unit => (
                                                <TouchableOpacity
                                                    key={unit.id}
                                                    onPress={() => {
                                                        setSelectedUnit(unit.name);
                                                        setShowUnitPicker(false);
                                                    }}
                                                    style={[styles.unitOption, { borderBottomColor: theme.colors.border }]}
                                                >
                                                    <Text style={[styles.unitOptionText, { color: theme.colors.text }]}>
                                                        {unit.name}
                                                    </Text>
                                                </TouchableOpacity>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            )}

                            {(item.measurement?.video || item.measurement?.description) && (
                                <TouchableOpacity style={styles.infoButton} onPress={openPanel}>
                                    <InfoIcon />
                                    <Text style={[styles.infoButtonText, { color: '#2978A0' }]}>
                                        How do I measure this?
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {hasLastMeasurement && (
                                <TouchableOpacity
                                    onPress={goToChart}
                                    disabled={isSubmitting}
                                    style={styles.graphButton}
                                >
                                    <Text style={[styles.graphButtonText, { color: '#2978A0' }]}>
                                        GRAPH
                                    </Text>
                                    <GraphIcon />
                                </TouchableOpacity>
                            )}
                            {showHealthButton && !healthAppLoading && (
                                <TouchableOpacity
                                    disabled={isSubmitting}
                                    onPress={() => handleFetchFromHealth(setValues)}
                                    style={[styles.healthButton, { borderColor: theme.colors.blue }]}
                                >
                                    <Icon name="apple" size={20} color={theme.colors.blue} />
                                    <Text style={[styles.healthButtonText, { color: theme.colors.blue }]}>
                    Fetch from {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={handleSubmit}
                                disabled={isSubmitting || Object.keys(errors).length > 0 || disabled}
                                style={
                                    isSubmitting || Object.keys(errors).length > 0 || disabled
                                        ? [styles.saveButton, styles.saveButtonDisabled]
                                        : styles.saveButton
                                }
                            >
                                {isSubmitting ? (
                                    <ActivityIndicator color="#4E733C" />
                                ) : (
                                    <Text
                                        style={
                                            Object.keys(errors).length > 0 || disabled
                                                ? [styles.saveButtonText, styles.saveButtonTextDisabled]
                                                : styles.saveButtonText
                                        }
                                    >
                    SAVE
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    )}
                </Formik>

                <SwipeablePanel
                    onClose={closePanel}
                    isActive={isPanelOpen}
                    showCloseButton={false}
                    style={styles.swipePanel}
                    onPressCloseButton={closePanel}
                >
                    <View style={styles.panelContent}>
                        {item.measurement?.video && (
                            <Text style={[styles.panelTitle, { color: theme.colors.text }]}>
                                Video Instructions
                            </Text>
                        )}
                        {item.measurement?.description && (
                            <HTMLView
                                value={item.measurement.description}
                                stylesheet={htmlStyles}
                            />
                        )}
                        <TouchableOpacity onPress={closePanel} style={styles.panelCloseButton}>
                            <Text style={[styles.infoButtonText, { color: '#2978A0' }]}>
                                Close
                            </Text>
                        </TouchableOpacity>
                    </View>
                </SwipeablePanel>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    headerTitle: {
        marginLeft: 12,
        fontSize: 20,
        fontWeight: '700',
    },
    content: {
        flexGrow: 1,
        paddingHorizontal: 20,
        paddingVertical: 32,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    label: {
        fontSize: 30,
        fontWeight: '700',
        marginBottom: 40,
    },
    unitSelector: {
        width: '100%',
        marginBottom: 24,
    },
    unitButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
    },
    unitButtonText: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    unitPicker: {
        marginTop: 8,
        borderRadius: 8,
        overflow: 'hidden',
    },
    unitOption: {
        paddingVertical: 16,
        paddingHorizontal: 24,
        backgroundColor: '#E0EBF766',
        borderBottomWidth: 1,
    },
    unitOptionText: {
        fontSize: 20,
        fontWeight: '500',
        textAlign: 'center',
    },
    healthButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderWidth: 2,
        borderRadius: 25,
        marginBottom: 24,
        width: '100%',
    },
    healthButtonText: {
        fontSize: 18,
        fontWeight: '700',
        marginLeft: 8,
    },
    saveButton: {
        backgroundColor: '#96E072',
        paddingVertical: 18,
        borderRadius: 25,
        width: '100%',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        backgroundColor: '#EEEEEE',
    },
    saveButtonText: {
        color: '#4E733C',
        fontSize: 20,
        fontWeight: '700',
    },
    saveButtonTextDisabled: {
        color: '#888888',
    },
    infoButton: {
        alignSelf: 'flex-start',
        marginBottom: 50,
        marginHorizontal: 25,
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoButtonText: {
        fontSize: 16,
        fontWeight: '700',
        textDecorationLine: 'underline',
        marginLeft: 5,
    },
    graphButton: {
        backgroundColor: 'transparent',
        paddingVertical: 20,
        paddingHorizontal: 25,
        marginHorizontal: 25,
        // marginBottom: 24,
        borderWidth: 2,
        borderColor: '#2978A0',
        borderRadius: 25,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    graphButtonText: {
        fontSize: 20,
        fontWeight: '700',
        marginRight: 5,
    },
    swipePanel: {
        backgroundColor: '#fff',
        height: '55%',
    },
    panelContent: {
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    panelTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    panelCloseButton: {
        marginLeft: 'auto',
        marginTop: 20,
    },
});

const htmlStyles = {
    p: {
        fontSize: 16,
        marginBottom: 10,
        color: '#333',
    },
    strong: {
        fontWeight: 'bold',
    },
    b: {
        fontWeight: 'bold',
    },
    em: {
        fontStyle: 'italic',
    },
    ins: {
        textDecorationLine: 'underline',
    },
    u: {
        textDecorationLine: 'underline',
    },
    li: {
        fontSize: 16,
        color: '#333',
        marginVertical: 5,
    },
    ul: {
        marginLeft: 15,
    },
};
