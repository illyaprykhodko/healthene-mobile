// outsource dependencies
import { Formik } from 'formik';
import { StyleSheet, View } from 'react-native';
import React, { useCallback, useMemo } from 'react';

// local dependencies
import { useTheme } from 'hooks/useTheme.ts';
import { Stats } from 'types/healthProfile.ts';
import { RootState, useAppSelector } from 'store';

// components
import { Button } from 'components/Button.tsx';
import TextInput from 'components/TextInput.tsx';
import { GENDERS } from 'constants/spec.ts';
import OptionSelector from 'components/Selector/OptionSelector.tsx';


interface StatsFormProps {
  // props here
}

const StatsForm = (props: StatsFormProps) => {
    const theme = useTheme();
    const styles = useMemo(() => createStyles(theme), [theme]);
    const user = useAppSelector((state: RootState) => state.app.user);

    const handleSubmit = useCallback(async (data: Stats) => {

        // navigation.goBack();
    }, []);

    return <Formik<Stats>
        enableReinitialize
        onSubmit={handleSubmit}
        initialValues={{
            gender: user?.gender,
            heightFt: user?.heightFt ?? 0,
            weightLb: user?.weightLb ?? 0,
            heightInches: user?.heightInches ?? 0,
        }}
        // validationSchema={validationSchema}
    >
        {({ values, errors, touched, handleChange, handleSubmit }) => {
            return <View>
                <TextInput
                    name="heightFt"
                    disabled={false}
                    textAlign="left"
                    label="Height (ft)"
                    keyboardType="numeric"
                    color={theme.colors.black}
                    value={values.heightFt.toString()}
                    onChangeText={handleChange('heightFt')}
                    error={touched.heightFt && errors.heightFt ? { heightFt: errors.heightFt } : undefined}
                />
                <TextInput
                    disabled={false}
                    textAlign="left"
                    name="heightInches"
                    label="Height (in)"
                    keyboardType="numeric"
                    color={theme.colors.black}
                    value={values.heightInches.toString()}
                    onChangeText={handleChange('heightInches')}
                    error={touched.heightInches && errors.heightInches ? { heightInches: errors.heightInches } : undefined}
                />
                <TextInput
                    name="weightLb"
                    disabled={false}
                    textAlign="left"
                    label="Weight (lb)"
                    keyboardType="numeric"
                    color={theme.colors.black}
                    value={values.weightLb.toString()}
                    onChangeText={handleChange('weightLb')}
                    error={touched.weightLb && errors.weightLb ? { weightLb: errors.weightLb } : undefined}
                />
                <OptionSelector
                    label="Gender"
                    data={GENDERS}
                    value={values.gender}
                    onSelect={data => handleChange('gender')(data?.value)}
                />
                <Button
                    variant="outline"
                    onPress={handleSubmit}
                    title="SAVE INFORMATION"
                />
            </View>;
        }}
    </Formik>;
};

export default StatsForm;
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    container: {
    // style here
    },
});
