// outsource dependencies
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
import { Formik } from 'formik';
import { useNavigation } from '@react-navigation/native';
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { useState, useMemo, useEffect } from 'react';
// components
import Text from 'components/Text';
// hooks
import { useTheme } from 'hooks/useTheme';
// import { useHealthIntegration } from 'hooks/useHealthIntegration';
import { useGetLastMeasurementQuery } from 'store/api/dayOverviewApi';
import { MeasurementItem, useMeasurementSubmit } from 'hooks/useMeasurementSubmit';
// types
import type { MeasurementType } from 'types/health';
// utils
import {
    getMeasurementConfig,
    getMeasurementValidationSchema,
} from 'utils/measurement';
// local dependencies
import { GraphIcon, InfoIcon } from '../icons';
import { MeasurementIcon } from './AnytimeIcons';
import Description from 'components/Description';
import { MeasurementField } from './MeasurementField';
import AnimatedDropdown from 'components/AnimatedDropdown';
import { BloodPressureFields } from './BloodPressureFields';

interface MeasurementInputModalProps {
  visible: boolean;
  disabled?: boolean;
  onClose: () => void;
  item: MeasurementItem;
}

export const MeasurementInputModal: React.FC<MeasurementInputModalProps> = ({
    item,
    visible,
    onClose,
    disabled = false,
}) => {
    const theme = useTheme();
    const measurementType = item.measurement?.type as MeasurementType;
    const config = useMemo(
        () => getMeasurementConfig(measurementType),
        [measurementType],
    );
    const validationSchema = useMemo(
        () => getMeasurementValidationSchema(measurementType),
        [measurementType],
    );

    const availableUnits = useMemo(() => {
        if (item.measurement?.units?.length) {
            return item.measurement.units;
        }
        return config.units;
    }, [item.measurement?.units, config.units]);

    const [selectedUnit, setSelectedUnit] = useState(
        availableUnits[0]?.name || config.defaultUnit
    );
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [hasLastMeasurement, setHasLastMeasurement] = useState(false);

    useEffect(() => {
        setSelectedUnit(availableUnits[0]?.name || config.defaultUnit);
    }, [availableUnits, config.defaultUnit, measurementType]);

    const navigation = useNavigation();
    // const {
    //     isAvailable: healthAppAvailable,
    //     hasPermissions: healthAppPermissions,
    //     isLoading: healthAppLoading,
    //     fetchLatestSample,
    // } = useHealthIntegration();

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
    // const handleFetchFromHealth = async (setValues: (values: any) => void) => {
    //     try {
    //         const sample = await fetchLatestSample(measurementType);

    //         if (!sample) {
    //             console.warn('[MeasurementInputModal] No health data found for today');
    //             return;
    //         }

    //         if (measurementType === 'BLOOD_PRESSURE') {
    //             const bpValue = sample.value as { systolic: number; diastolic: number };
    //             setValues({
    //                 systolic: String(bpValue.systolic),
    //                 diastolic: String(bpValue.diastolic),
    //             });
    //         } else {
    //             setValues({
    //                 value: String(sample.value),
    //             });
    //         }

    //         // Submit immediately with health app source
    //         await submit(
    //             [sample],
    //             Platform.OS === 'ios' ? 'APPLE_HEALTH' : 'GOOGLE_FIT',
    //             selectedUnit,
    //         );
    //     } catch (error) {
    //         console.error('[MeasurementInputModal] Fetch from health error:', error);
    //     }
    // };

    // const showHealthButton
    // = config.supportsHealthApp && healthAppAvailable && healthAppPermissions;

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
        <>
            <Modal
                visible={visible}
                animationType="slide"
                onRequestClose={onClose}
                presentationStyle="pageSheet"
            >
                <KeyboardAvoidingView
                    style={styles.container}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <View
                        style={[
                            styles.header,
                            {
                                backgroundColor: '#E0EBF7',
                                borderBottomColor: theme.colors.border,
                            },
                        ]}
                    >
                        <View style={styles.headerLeft}>
                            <MeasurementIcon size={24} />
                            <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
                                {item.measurement?.name || 'Measurement'}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} disabled={isSubmitting}>
                            <Icon iconStyle="solid" name="times" size={24} color={theme.colors.text} />
                        </TouchableOpacity>
                    </View>

                    <Formik
                        initialValues={initialValues}
                        validationSchema={validationSchema}
                        onSubmit={values =>
                            submit(values, 'HEALTHENE_MANUAL_INPUT', selectedUnit)
                        }
                    >
                        {({
                            values,
                            errors,
                            touched,
                            setValues,
                            handleSubmit,
                            setFieldValue,
                            setFieldTouched,
                        }) => (
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
                                        onDiastolicChange={text =>
                                            setFieldValue('diastolic', text)
                                        }
                                        systolicError={
                                            touched.systolic ? errors.systolic : undefined
                                        }
                                        diastolicError={
                                            touched.diastolic ? errors.diastolic : undefined
                                        }
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
                                            error={
                                                touched[field.name] ? errors[field.name] : undefined
                                            }
                                        />
                                    ))
                                )}

                                {/* Unit Selector (if multiple units available and not BP) */}
                                {availableUnits.length > 1
                  && measurementType !== 'BLOOD_PRESSURE' && (
                                    <View style={styles.unitSelector}>
                                        <AnimatedDropdown
                                            prefix="Unit: "
                                            maxHeight={190}
                                            valueLabel={selectedUnit}
                                            options={availableUnits.map(unit => ({
                                                id: unit.id,
                                                label: unit.name,
                                            }))}
                                            onSelect={option => setSelectedUnit(option.label)}
                                        />
                                    </View>
                                )}

                                {(item.measurement?.video || item.measurement?.description) && (
                                    <TouchableOpacity
                                        style={styles.infoButton}
                                        onPress={openPanel}
                                    >
                                        <InfoIcon />
                                        <Text style={[styles.infoButtonText, { color: '#2978A0' }]}>
                      How do I measure this?
                                        </Text>
                                    </TouchableOpacity>
                                )}
                                <Description
                                    onClose={closePanel}
                                    isActive={isPanelOpen}
                                    video={(item.measurement?.video as any) || null}
                                    description={item.measurement?.description || ''}
                                />
                                <View style={styles.buttonsContainer}>
                                    {hasLastMeasurement && (
                                        <TouchableOpacity
                                            onPress={goToChart}
                                            disabled={isSubmitting}
                                            style={styles.graphButton}
                                        >
                                            <Text
                                                style={[styles.graphButtonText, { color: '#2978A0' }]}
                                            >
                      GRAPH
                                            </Text>
                                            <GraphIcon />
                                        </TouchableOpacity>
                                    )}
                                    {/* {showHealthButton && !healthAppLoading && (
                                    <TouchableOpacity
                                        disabled={isSubmitting}
                                        onPress={() => handleFetchFromHealth(setValues)}
                                        style={[
                                            styles.healthButton,
                                            { borderColor: theme.colors.blue },
                                        ]}
                                    >
                                        <Icon name="apple" size={20} color={theme.colors.blue} />
                                        <Text
                                            style={[
                                                styles.healthButtonText,
                                                { color: theme.colors.blue },
                                            ]}
                                        >
                      Fetch from{' '}
                                            {Platform.OS === 'ios' ? 'Apple Health' : 'Google Fit'}
                                        </Text>
                                    </TouchableOpacity>
                                )} */}
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        disabled={
                                            isSubmitting || Object.keys(errors).length > 0 || disabled
                                        }
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
                                                        ? [
                                                            styles.saveButtonText,
                                                            styles.saveButtonTextDisabled,
                                                        ]
                                                        : styles.saveButtonText
                                                }
                                            >
                      SAVE
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                </View>
                            </ScrollView>
                        )}
                    </Formik>
                </KeyboardAvoidingView>
            </Modal>
        </>
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
        zIndex: 20,
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
        marginBottom: 24,
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
    buttonsContainer: {
        width: '100%',
        alignItems: 'center',
        justifyContent: 'flex-end',
    }
});
