// outsource dependencies
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import EmailForm from 'screens/AccountSettingsScreens/AccountSettings/EmailForm.tsx';
import AccountInformationForm from 'screens/AccountSettingsScreens/AccountSettings/AccountInformationForm.tsx';

const AccountSettings = () => {
    const theme = useTheme();
    const [preloader, setPreloader] = useState(false);
    return <>
        <LoadingOverlay init={preloader} />
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 80 : 100}
        >
            <ScrollView style={[styles.container, { backgroundColor: theme.colors.white }]}>
                <EmailForm onPreloader={setPreloader} />
                <AccountInformationForm onPreloader={setPreloader} />
            </ScrollView>
        </KeyboardAvoidingView>
    </>;
};

export default AccountSettings;
const styles = StyleSheet.create({
    flex: {
        flex: 1
    },
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
});
