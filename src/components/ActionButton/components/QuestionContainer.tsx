// outsource dependencies
import React, { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

// local dependencies
import Text from 'components/Text.tsx';
import TextInput from 'components/TextInput.tsx';
import { useTheme } from 'hooks/useTheme.ts';
import { OFFSET } from 'constants/offset.ts';
import { PatientFoodCategoryQuestion } from 'types/overview.ts';
import { useAppDispatch, useAppSelector } from 'store/index.ts';
import { setResponseText, reset } from 'store/slices/questionSlice.ts';

interface QuestionContainerProps {
  onClose?: () => void;
  data: PatientFoodCategoryQuestion;
}

export const QuestionContainer = memo(({ onClose, data }: QuestionContainerProps) => {
    const theme = useTheme();
    const dispatch = useAppDispatch();
    const responseText = useAppSelector(state => state.question.responseText);

    const styles = useMemo(() => createStyles(theme), [theme]);
    const isUserEnteredResponse = useMemo(() => data?.question?.response?.type === 'USER_ENTERED_RESPONSE', [data]);
    const isSubmitDisabled = isUserEnteredResponse && !responseText.trim();

    return (
        <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
            <View style={styles.header}>
                <Pressable onPress={() => { dispatch(reset()); onClose?.(); }}>
                    <Text color={theme.colors.primary}>Cancel</Text>
                </Pressable>
                <Text color={theme.colors.text}>
                    Health Question
                </Text>
                <Pressable
                    onPress={() => {}}
                    disabled={isSubmitDisabled}
                    style={({ pressed }) => [{ opacity: isSubmitDisabled ? 0.5 : pressed ? 0.7 : 1 }]}
                >
                    <Text color={theme.colors.primary}>Submit</Text>
                </Pressable>
            </View>
            <View style={styles.content}>
                <Text variant="h6" color={theme.colors.text}>
                    {data.question.title}
                </Text>
            </View>
            {isUserEnteredResponse && (
                <TextInput
                    multiline
                    name="response"
                    textAlign="left"
                    disabled={false}
                    value={responseText}
                    color={theme.colors.black}
                    styleWrapper={styles.input}
                    placeholder="Please explain"
                    onChangeText={text => dispatch(setResponseText(text))}
                />
            )}
        </View>
    );
});

QuestionContainer.displayName = 'QuestionContainer';

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: OFFSET.POINT * 2,
    },
    container: {
        flex: 1,
    },
    content: {
        marginTop: OFFSET.VERTICAL * 2,
        paddingVertical: OFFSET.VERTICAL,
        paddingHorizontal: OFFSET.HORIZONTAL,
        backgroundColor: theme.colors.grey,
    },
    input: {
        paddingHorizontal: OFFSET.HORIZONTAL,
    }
});
