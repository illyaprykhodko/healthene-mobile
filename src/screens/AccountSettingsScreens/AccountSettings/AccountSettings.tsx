// outsource dependencies
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';

// local dependencies
import { OFFSET } from 'constants/offset.ts';
import { useTheme } from 'hooks/useTheme.ts';
import LoadingOverlay from 'components/LoadingOverlay.tsx';
import EmailForm from 'screens/AccountSettingsScreens/AccountSettings/EmailForm.tsx';
import AccountInformationForm from 'screens/AccountSettingsScreens/AccountSettings/AccountInformationForm.tsx';

const AccountSettings = () => {
    const theme = useTheme();
    const [preloader, setPreloader] = useState(false);
    return <View style={[styles.container, { backgroundColor: theme.colors.white }]}>
        <LoadingOverlay init={preloader} />
        <EmailForm onPreloader={setPreloader} />
        <AccountInformationForm onPreloader={setPreloader} />
    </View>;
};

export default AccountSettings;
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
});
