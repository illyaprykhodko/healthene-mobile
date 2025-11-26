// outsource dependencies
import React from 'react';
import { Formik } from 'formik';
import { RouteProp } from '@react-navigation/native';
import { ScrollView, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import TextInput from 'components/TextInput.tsx';
import { RootState, useAppSelector } from 'store';
import ProfileImage from 'components/ProfileImage.tsx';
import { RootStackParamList } from 'services/navigation';

interface MessageScreenProps {
  route: RouteProp<RootStackParamList, 'MessageScreen'>
}

const MessageScreen = ({ route }: MessageScreenProps) => {
    const theme = useTheme();
    const user = useAppSelector((state: RootState) => state.app.user);
    const handleSubmit = () => {
        console.log('DAta');
    };
    return <Screen initialized={true} style={styles.container}>
        <ScrollView>
            <View style={styles.row}>
                <ProfileImage style={{ ...styles.profileImg, borderColor: theme.colors.grey }} uri={user?.physician?.coverImage?.url} />
                <View>
                    <Text>
                        To:
                        &nbsp;
                        {user?.physician?.name ?? '-'}
                    </Text>
                    <Text variant="caption" color={theme.colors.grey}>Physician</Text>
                </View>
            </View>
            <Formik
                onSubmit={handleSubmit}
                // validationSchema={validationSchema}
                initialValues={{
                    text: '',
                    subject: route.params.subject ?? ''
                }}
            >
                {({ values, errors, touched, handleChange, handleSubmit, dirty }) => {
                    return <View style={styles.formContainer}>
                        <TextInput
                            name="subject"
                            label="Subject"
                            disabled={false}
                            textAlign="left"
                            value={values.subject}
                            color={theme.colors.black}
                            onChangeText={handleChange('subject')}
                        />
                        <TextInput
                            multiline
                            name="text"
                            label="Text"
                            disabled={false}
                            textAlign="left"
                            value={values.text}
                            color={theme.colors.black}
                            onChangeText={handleChange('text')}
                        />
                    </View>;
                }}
            </Formik>
        </ScrollView>
    </Screen>;
};

export default MessageScreen;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: OFFSET.HORIZONTAL,
        paddingVertical: OFFSET.VERTICAL,
    },
    profileImg: {
        borderWidth: 1,
        marginRight: OFFSET.HORIZONTAL,
    },
    formContainer: {
        marginVertical: OFFSET.VERTICAL,
    },
    row: {
        flexDirection: 'row'
    }
});
