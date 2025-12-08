// outsource dependencies
import * as yup from 'yup';
import { Formik } from 'formik';
import { useSelector } from 'react-redux';
import React, { useCallback } from 'react';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

// local dependencies
import Text from 'components/Text.tsx';
import { filters } from 'services/filter';
import Screen from 'components/Screen.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { Button } from 'components/Button.tsx';
import { MessageForm } from 'types/messenger.ts';
import TextInput from 'components/TextInput.tsx';
import { RootState, useAppSelector } from 'store';
import ProfileImage from 'components/ProfileImage.tsx';
import { RootStackParamList } from 'services/navigation';
import { useCreateChainMutation, useReplyToChainMutation } from 'store/api/messengerApi.ts';

// configure
const ATTACHMENTS = {
    VIDEO: 'VIDEO',
    AUDIO: 'AUDIO',
    FILE: 'FILE',
};
type AttachmentType = typeof ATTACHMENTS[keyof typeof ATTACHMENTS];
const validationSchema = yup.object().shape({
    subject: yup.string()
        .trim()
        .required('Subject is required.')
        .min(5, 'Subject should contain at least 5 symbol character.'),
    text: yup.string()
        .trim()
        .required('Subject is required.')
        .min(5, 'Subject should contain at least 5 symbol character.'),
});

const WriteMessageScreen = () => {
    const theme = useTheme();
    const user = useAppSelector((state: RootState) => state.app.user);
    const chain = useSelector((state: RootState) => state.messenger.reply);
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    const [replyChain] = useReplyToChainMutation();
    const [createChain] = useCreateChainMutation();
    const handleSubmit = useCallback(async (data: MessageForm) => {
        if (chain) {
            await replyChain({ chain, ...data }).unwrap();
        } else {
            await createChain(data);
        }
        navigation.goBack();
    }, [chain, navigation]);

    const getAttachment = useCallback((item: AttachmentType) => {
        switch (item) {
            default: return <Pressable key={item} style={[styles.mediaButton, { backgroundColor: theme.colors.lightGrey }]}>
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.lighterGrey }]}>
                    <Icon name="video" color={theme.colors.darkGrey} size={20} />
                </View>
                <Text color={theme.colors.darkGrey}>{filters.humanize(item)}</Text>
            </Pressable>;
            case ATTACHMENTS.AUDIO: return <Pressable key={item} style={[styles.mediaButton, { backgroundColor: theme.colors.lightGrey }]}>
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.lighterGrey }]}>
                    <Icon name="microphone" color={theme.colors.darkGrey} size={20} />
                </View>
                <Text color={theme.colors.darkGrey}>{filters.humanize(item)}</Text>
            </Pressable>;
            case ATTACHMENTS.FILE: return <Pressable key={item} style={[styles.mediaButton, { backgroundColor: theme.colors.lightGrey }]}>
                <View style={[styles.mediaButtonIcon, { backgroundColor: theme.colors.lighterGrey }]}>
                    <Icon name="paperclip" color={theme.colors.darkGrey} size={20} />
                </View>
                <Text color={theme.colors.darkGrey}>{filters.humanize(item)}</Text>
            </Pressable>;
        }
    }, []);

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
                validationSchema={validationSchema}
                initialValues={{
                    text: '',
                    subject: chain?.subject ?? ''
                }}
            >
                {({ values, errors, touched, handleChange, handleSubmit }) => {
                    return <View style={styles.formContainer}>
                        <TextInput
                            name="subject"
                            label="Subject"
                            disabled={false}
                            textAlign="left"
                            touched={touched}
                            value={values.subject}
                            color={theme.colors.black}
                            onChangeText={handleChange('subject')}
                            error={touched.subject && errors.subject ? { subject: errors.subject } : undefined}
                        />
                        <TextInput
                            multiline
                            name="text"
                            label="Text"
                            disabled={false}
                            textAlign="left"
                            touched={touched}
                            value={values.text}
                            color={theme.colors.black}
                            onChangeText={handleChange('text')}
                            error={touched.text && errors.text ? { text: errors.text } : undefined}
                        />
                        <View style={styles.attachmentsContainer}>
                            {Object.values(ATTACHMENTS).map(item => getAttachment(item))}
                        </View>
                        <Button
                            variant="outline"
                            title="SEND MESSAGE"
                            onPress={handleSubmit}
                        />
                    </View>;
                }}
            </Formik>
        </ScrollView>
    </Screen>;
};

export default WriteMessageScreen;

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
    attachmentsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginVertical: OFFSET.VERTICAL
    },
    mediaButtonIcon: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: OFFSET.POINT
    },
    mediaButton: {
        width: '30%',
        alignItems: 'center',
        padding: 20,
        justifyContent: 'space-around',
        borderRadius: 5,
    },
    row: {
        flexDirection: 'row'
    }
});
