// outsource dependencies
import { Formik } from 'formik';
import { RootState } from 'store';
import moment from 'moment/moment';
import React, { useRef } from 'react';
import { useSelector } from 'react-redux';
import { Pressable, StyleSheet, View } from 'react-native';
import { BottomSheetBackdrop, BottomSheetModal } from '@gorhom/bottom-sheet';

// local dependencies
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import Select from 'components/Select.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import DatePickerSelector from 'components/DatePicker.tsx';
import { PREFIXES, SUFFIXES, GENDERS } from 'constants/spec.ts';

const SELECTS = {
    GENDER: 'GENDER',
    PREFIXES: 'PREFIXES',
    SUFFIXES: 'SUFFIXES',
    DATE_OF_BIRTH: 'DATE_OF_BIRTH',
} as const;
type SelectsValue = keyof typeof SELECTS;

export const PersonalInformationScreen = () => {
    const theme = useTheme();
    const user = useSelector((state: RootState) => state.app.user);
    // Select Bottom Sheet
    const [dateModalOpen, setDateModalOpen] = React.useState(false);
    const [select, setSelect] = React.useState<SelectsValue | null>(null);
    const bottomSheetRef = useRef<BottomSheetModal>(null);
    const openBottomSheet = (select: SelectsValue) => {
        setSelect(select);
        bottomSheetRef.current?.present();
    };

    return <>
        <View style={styles.container}>
            <Formik
                initialValues={{
                    prefix: user?.prefix,
                    suffix: user?.suffix,
                    gender: user?.gender,
                    birthday: user?.birthday,
                    lastName: user?.lastName,
                    firstName: user?.firstName,
                    middleName: user?.middleName,
                }}
                onSubmit={async data => {
                    console.log('data', data);
                }}>
                {({ values, errors, touched, handleChange, handleSubmit, dirty }) => (
                    <View style={styles.flex}>
                        <TextInput
                            name="firstName"
                            disabled={false}
                            label="First Name"
                            value={values.firstName}
                            onChangeText={handleChange('firstName')}
                            inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                            error={touched.firstName && errors.firstName ? { [errors.firstName]: errors.firstName } : undefined}
                        />
                        <TextInput
                            name="middleName"
                            disabled={false}
                            label="Middle Name"
                            value={values.middleName}
                            onChangeText={handleChange('middleName')}
                            inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                        />
                        <TextInput
                            name="lastName"
                            disabled={false}
                            label="Last Name"
                            value={values.lastName}
                            onChangeText={handleChange('lastName')}
                            inputStyle={{ ...styles.inputStyle, color: theme.colors.black }}
                            error={touched.lastName && errors.lastName ? { [errors.lastName]: errors.lastName } : undefined}
                        />
                        <View>
                            <Text variant="caption">Prefix</Text>
                            <Pressable
                                onPress={() => openBottomSheet(SELECTS.PREFIXES)}
                                style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                            >
                                <Text
                                    color={values.prefix ? theme.colors.black : theme.colors.grey}
                                >
                                    {values.prefix ? values.prefix : 'Select prefix'}
                                </Text>
                            </Pressable>
                        </View>
                        <View style={styles.paddingVertical}>
                            <Text variant="caption">Suffix</Text>
                            <Pressable
                                onPress={() => openBottomSheet(SELECTS.SUFFIXES)}
                                style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                            >
                                <Text
                                    color={values.suffix ? theme.colors.black : theme.colors.grey}
                                >
                                    {values.suffix ? values.suffix : 'Select suffix'}
                                </Text>
                            </Pressable>
                        </View>
                        <View style={styles.paddingVertical}>
                            <Text variant="caption">Date of Birth</Text>
                            <Pressable
                                onPress={() => setDateModalOpen(true)}
                                style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                            >
                                <Text
                                    color={values.birthday ? theme.colors.black : theme.colors.grey}
                                >
                                    {values.birthday ? moment(values.birthday).format('YYYY-MM-DD') : 'Select birthday'}
                                </Text>
                            </Pressable>
                        </View>
                        <View style={styles.paddingVertical}>
                            <Text variant="caption">Gender</Text>
                            <Pressable
                                onPress={() => openBottomSheet(SELECTS.GENDER)}
                                style={[styles.currentItem, { borderBottomColor: theme.colors.grey }]}
                            >
                                <Text
                                    color={values.gender ? theme.colors.black : theme.colors.grey}
                                >
                                    {values.gender ? filters.humanize(values.gender) : 'Select gender'}
                                </Text>
                            </Pressable>
                        </View>
                        <Button
                            disabled={!dirty}
                            variant="outline"
                            onPress={handleSubmit}
                            title="Update Information"
                            style={styles.updateBtn}
                        />
                        <DatePickerSelector
                            modalOpened={dateModalOpen}
                            onCancel={() => setDateModalOpen(false)}
                            onSelect={(value: string) => handleChange('birthday')(value)}
                            currentDate={values?.birthday ? values.birthday.toString() : new Date().toString()}
                        />
                        <BottomSheetModal
                            ref={bottomSheetRef}
                            enablePanDownToClose
                            snapPoints={['35%']}
                            enableDynamicSizing={false}
                            backdropComponent={backdropProps => (
                            // show overlay
                                <BottomSheetBackdrop
                                    {...backdropProps}
                                    opacity={0.5}
                                    appearsOnIndex={0}
                                    disappearsOnIndex={-1}
                                />
                            )}>
                            {(() => {
                                switch (select) {
                                    case SELECTS.PREFIXES:
                                        return (
                                            <Select
                                                data={PREFIXES}
                                                currentValue={user?.prefix}
                                                onSelect={value => handleChange('prefix')(value)}
                                            />
                                        );
                                    case SELECTS.SUFFIXES:
                                        return (
                                            <Select
                                                data={SUFFIXES}
                                                currentValue={user?.suffix}
                                                onSelect={value => handleChange('suffix')(value)}
                                            />
                                        );
                                    case SELECTS.GENDER:
                                        return (
                                            <Select
                                                data={GENDERS}
                                                currentValue={user?.gender}
                                                onSelect={value => handleChange('gender')(value)}
                                            />
                                        );
                                    default:
                                        return null;
                                }
                            })()}
                        </BottomSheetModal>
                    </View>
                )}
            </Formik>
        </View>
    </>;
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    flex: {
        flex: 1
    },
    inputStyle: {
        textAlign: 'left',
    },
    currentItem: {
        borderBottomWidth: 1,
        paddingTop: OFFSET.POINT * 2,
        paddingBottom: OFFSET.POINT * 4,
    },
    paddingVertical: {
        paddingTop: OFFSET.POINT * 4,
    },
    updateBtn: {
        marginTop: 'auto'
    }
});
