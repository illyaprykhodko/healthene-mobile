
// outsource dependencies
import moment from 'moment';
import { useRoute, useNavigation } from '@react-navigation/native';
import React, { useCallback, useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions, Image } from 'react-native';

// local dependencies
import { ExerciseType } from 'types';
import { useTheme } from 'hooks/useTheme';
import { OFFSET } from 'constants/offset';
import { COLORS } from 'constants/colors';
import { filters } from 'services/filter';
import { PHASE_ITEM_STATUS } from 'constants/spec';
import { EXERCISE_CONFIGS } from './exerciseFactory';
import { useAppDispatch, useAppSelector } from 'store';
import { initializeExercise, updateSteps, setLoading, clearExercise } from 'store/slices/exerciseSlice';
import { useGetPhysicalActivityItemQuery, useGetStretchingExerciseQuery, useGetAerobicExerciseQuery, useGetResistanceExerciseQuery, useUpdateStretchingStepsMutation, useUpdateAerobicStepsMutation, useUpdateResistanceStepsMutation, useUpdatePhaseItemMutation } from 'store/api/dayOverviewApi';

// components
import Text from 'components/Text';
import Screen from 'components/Screen';
import { Button } from 'components/Button';
import Checkbox from 'components/Checkbox';
import { HTMLView } from 'components/HTMLView';
import YoutubeVideo from 'components/YoutubeVideo';
import { IconButton } from 'components/IconButton';
import PrivateVideo from 'components/PrivateVideo';
import { SwipeablePanel } from 'components/SwipeablePanel';

// Helper function to get exercise step parameters
const getExerciseStepParams = (exercise: any, step: any, subtype: any) => ({
    exerciseType: exercise.type,
    goalType: step.type,
    subtype,
});

export default function ExerciseDetails () {
    const theme = useTheme();
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { exercise, refreshCurrentList, parentNavigation, deepPhaseId, date, onRefresh } = route.params || {};
    const [showGoodWork, setShowGoodWork] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const title = exercise?.title || 'Exercise';
    const isFutureDay = moment(date).isAfter(moment(), 'day');

    // Load exercise data based on type
    const { data: stretchingData, isLoading: stretchingLoading } = useGetStretchingExerciseQuery(exercise?.id?.toString() || '', {
        skip: !exercise?.id || exercise?.type !== ExerciseType.STRETCHING
    });
    
    const { data: aerobicData, isLoading: aerobicLoading } = useGetAerobicExerciseQuery(exercise?.id?.toString() || '', {
        skip: !exercise?.id || exercise?.type !== ExerciseType.AEROBIC
    });
    
    const { data: resistanceData, isLoading: resistanceLoading } = useGetResistanceExerciseQuery(exercise?.id?.toString() || '', {
        skip: !exercise?.id || exercise?.type !== ExerciseType.RESISTANCE
    });
    
    // Fallback to general physical activity item query
    const { data: fallbackData, isLoading: fallbackLoading } = useGetPhysicalActivityItemQuery(
        exercise?.id?.toString() || '',
        {
            skip: !exercise?.id || (
                exercise?.type === ExerciseType.STRETCHING
                || exercise?.type === ExerciseType.AEROBIC
                || exercise?.type === ExerciseType.RESISTANCE
            )
        }
    );
    
    // Get the appropriate data based on exercise type
    const exerciseData = useMemo(() => (exercise?.type === ExerciseType.STRETCHING
        ? stretchingData
        : exercise?.type === ExerciseType.AEROBIC
            ? aerobicData
            : exercise?.type === ExerciseType.RESISTANCE
                ? resistanceData
                : fallbackData), [exercise?.type, stretchingData, aerobicData, resistanceData, fallbackData]);
    // const exerciseData = exercise?.type === ExerciseType.STRETCHING
    //     ? stretchingData
    //     : exercise?.type === ExerciseType.AEROBIC
    //         ? aerobicData
    //         : exercise?.type === ExerciseType.RESISTANCE
    //             ? resistanceData
    //             : fallbackData;
    
    const isLoading = useMemo(
        () => (exercise?.type === ExerciseType.STRETCHING
            ? stretchingLoading
            : exercise?.type === ExerciseType.AEROBIC
                ? aerobicLoading
                : exercise?.type === ExerciseType.RESISTANCE
                    ? resistanceLoading
                    : fallbackLoading),
        [exercise?.type, stretchingLoading, aerobicLoading, resistanceLoading, fallbackLoading]
    );
    // const isLoading = exercise?.type === ExerciseType.STRETCHING
    //     ? stretchingLoading
    //     : exercise?.type === ExerciseType.AEROBIC
    //         ? aerobicLoading
    //         : exercise?.type === ExerciseType.RESISTANCE
    //             ? resistanceLoading
    //             : fallbackLoading;

    // Get exercise state from Redux
    const exerciseState = useAppSelector((state: any) => state.exercise || {});
    const { steps = [], scientificDescription, scientificVideo, subtype, isDirty = false } = exerciseState;
    
    const memoizedSteps = useMemo(() => {
        return steps;
    }, [steps]);
    // }, [steps.length, steps.map((s: any) => s?.id).join(',')]);

    // Clear exercise state when exercise ID changes
    useEffect(() => {
        if (exercise?.id && exerciseState.id && exerciseState.id !== exercise.id) {
            dispatch(clearExercise());
        }
    }, [exercise?.id, exerciseState.id, dispatch]);

    // Initialize exercise when data loads
    useEffect(() => {
        if (exerciseData && exercise?.id && exercise?.type) {
            // Only initialize if we don't have data for this exercise yet or if the data is different
            if (exerciseState.id !== exercise.id || !exerciseState.initialized) {
                const processedData = {
                    ...exerciseData,
                    exerciseType: exercise.type,
                    subtype: exerciseData?.type,
                    originalSteps: exerciseData?.steps,
                    scientificVideo: exerciseData?.scientificVideo,
                    scientificDescription: exerciseData?.scientificDescription,
                    steps: [...(exerciseData?.steps || [])]?.sort((a: any, b: any) => a?.order - b?.order) || [],
                };
            
                dispatch(initializeExercise({
                    id: exercise.id,
                    exerciseType: exercise.type,
                    data: { ...processedData, isDirty: false }
                }));
            }
        }
    }, [exerciseData, exercise?.id, exercise?.type, dispatch, exerciseState.id, exerciseState.initialized]);

    useLayoutEffect(() => {
        parentNavigation?.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: theme.colors.white }}>Back</Text>
                </TouchableOpacity>
            )
        });
    }, [parentNavigation, navigation]);

    // Define tabs
    const TABS = [
        { key: exercise?.type, label: filters.humanize(exercise?.type?.replace(/^EXERCISE_/, '') || '') },
        { key: 'science', label: 'Science' },
    ];
    const [activeTab, setActiveTab] = useState(TABS[0].key);

    // Get mutation based on exercise type
    const [updateStretchingSteps] = useUpdateStretchingStepsMutation();
    const [updateAerobicSteps] = useUpdateAerobicStepsMutation();
    const [updateResistanceSteps] = useUpdateResistanceStepsMutation();
    const [updatePhaseItemApi] = useUpdatePhaseItemMutation();

    const updateExerciseDataCallback = useCallback(async (status: string, steps: any[]) => {
        // Persist phase item status first
        if (exercise?.id && deepPhaseId) {
            try {
                const payload = {
                    status,
                    id: exercise.id,
                    type: exercise?.type,
                    title: exercise?.title || (exercise as any)?.name || title,
                };
                await updatePhaseItemApi({ id: exercise.id, phaseId: deepPhaseId, data: payload as any, date }).unwrap();
            } catch (error) {
                console.error('Failed to update phase item status:', error);
            }
        }
        
        // Update steps via API
        const updateMutation = exercise?.type === ExerciseType.STRETCHING
            ? updateStretchingSteps
            : exercise?.type === ExerciseType.AEROBIC
                ? updateAerobicSteps
                : exercise?.type === ExerciseType.RESISTANCE
                    ? updateResistanceSteps
                    : null;
        
        if (updateMutation && exercise?.id) {
            try {
                dispatch(setLoading(true));
                await updateMutation(steps).unwrap();
                // info: mutation executed
                // await updateMutation({ steps }).unwrap();
                dispatch(setLoading(false));
            } catch (error) {
                console.error('Failed to update exercise steps:', error);
                dispatch(setLoading(false));
            }
        }
    }, [updatePhaseItemApi, deepPhaseId, exercise?.id, exercise?.type, updateStretchingSteps, updateAerobicSteps, updateResistanceSteps, dispatch]);

    const handleDone = useCallback(async () => {
        setShowGoodWork(true);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
        }).start();
        setTimeout(() => {
            Animated.timing(fadeAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShowGoodWork(false));
        }, 3000);
        
        const nextStatus = memoizedSteps.every((step: any) => step.completed)
            ? PHASE_ITEM_STATUS.DONE
            : memoizedSteps.some((step: any) => step.completed) ? PHASE_ITEM_STATUS.INCOMPLETE : PHASE_ITEM_STATUS.PENDING;
        
        // Save changes and reset dirty flag
        try {
            await updateExerciseDataCallback(nextStatus, memoizedSteps);
            dispatch(updateSteps({
                isDirty: false, // Reset dirty flag after successful save
                steps: memoizedSteps,
                selectedSteps: memoizedSteps.filter((step: any) => step.completed),
            }));
            refreshCurrentList?.(exercise.id, 'status', nextStatus);
            onRefresh?.();
            
            if (nextStatus === PHASE_ITEM_STATUS.DONE) {
                setTimeout(() => {
                    navigation.goBack();
                }, 700);
            }
        } catch (error) {
            console.error('Failed to save exercise:', error);
        }
    }, [memoizedSteps, exercise?.id, refreshCurrentList, updateExerciseDataCallback, navigation, fadeAnim, dispatch, onRefresh]);

    // Panel state for video/instruction
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [videoData, setVideoData] = useState<any>(null);
    const [instructionData, setInstructionData] = useState<string>('');

    // Step management functions
    const updateStepCallback = useCallback((stepId: string | number, vals: any) => {
        const updatedSteps = (memoizedSteps || [])?.map((step: any) =>
            (step.id === stepId ? { ...step, ...vals, modified: true } : step));
        dispatch(updateSteps({
            isDirty: true,
            steps: updatedSteps,
            selectedSteps: updatedSteps.filter((step: any) => step.completed),
        }));
    }, [memoizedSteps, dispatch]);

    const completeStep = useCallback((stepId: string | number) => {
        const updatedSteps = (memoizedSteps || [])?.map((step: any) =>
            (step.id === stepId ? { ...step, completed: !step.completed } : step));
        dispatch(updateSteps({
            isDirty: true,
            steps: updatedSteps,
            selectedSteps: updatedSteps.filter((step: any) => step.completed),
        }));
    }, [memoizedSteps, dispatch]);

    // Render tabs
    const renderTabs = useCallback(() => (
        <View style={[styles.tabsRow, { borderColor: theme.colors.primary }]}>
            {TABS.map((tab, index) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            { backgroundColor: theme.colors.surfaceAlt },
                            isActive && [styles.activeTabButton, { backgroundColor: theme.colors.info }],
                            { borderRightWidth: TABS.length === index + 1 ? 0 : 2, borderRightColor: theme.colors.primary },
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={StyleSheet.flatten([
                            styles.tabText,
                            { color: theme.colors.primary },
                            isActive ? StyleSheet.flatten([styles.activeTabText, { color: theme.colors.white }]) : {},
                        ])}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [activeTab]);

    // Render exercise content
    const renderExerciseContent = useCallback(() => {
        return (memoizedSteps || []).map((step: any) => {
            const { id: itemId, image, instruction, video, completed, modified } = step;
            const exerciseParams = getExerciseStepParams(exercise, step, subtype) || {};
            let goalDisplay = '';
            let extraDisplay: any[] = [];
            const config = EXERCISE_CONFIGS[exercise?.type]?.[exerciseParams.subtype || 'DEFAULT']?.[exerciseParams.goalType || 'DEFAULT'];
            const isExerciseComplete = memoizedSteps.every((step: any) => step.completed);
            
            if (config) {
                goalDisplay = config.renderGoal(step);
                extraDisplay = config.renderExtra(step);
            }
            return (
                <View
                    key={Math.random()}
                    style={[
                        styles.tabContent,
                        isExerciseComplete && { opacity: 0.5 },
                        { borderBottomWidth: 1, borderColor: theme.colors.border },
                    ]}
                >
                    {(video || instruction) ? (
                        <TouchableOpacity
                            disabled={isFutureDay}
                            style={[{ alignSelf: 'flex-end' }, exercise?.type !== ExerciseType.RESISTANCE && completed && { opacity: 0.1 }]}
                            onPress={() => {
                                setVideoData(video);
                                setIsPanelOpen(true);
                                setInstructionData(normalizeDescription(instruction));
                            }}
                        >
                            <Text style={[styles.videoText, { color: theme.colors.info }]}>Video</Text>
                        </TouchableOpacity>
                    ) : null}
                    
                    <View style={[styles.imageContainer, { backgroundColor: theme.dark ? theme.colors.grey : theme.colors.white }]}>
                        {image ? (
                            <Image
                                resizeMode="contain"
                                // source={{ uri: image?.url }}
                                source={{ uri: image?.url?.replace(/^http:\/\//i, 'https://') }}
                                style={[styles.image, exercise?.type !== ExerciseType.RESISTANCE && completed && { opacity: 0.5 }]}
                            />
                        ) : null}
                    </View>
                    
                    {/* Goal row */}
                    <View style={styles.repsContainer}>
                        <TouchableOpacity
                            disabled={isFutureDay}
                            style={(completed || isFutureDay)&& { opacity: 0.5 }}
                            onPress={() => {
                                navigation.navigate('EditExercise', {
                                    title,
                                    itemId,
                                    onApply: (vals: any) => updateStepCallback(itemId, vals),
                                    ...exerciseParams,
                                });
                            }}
                        >
                            <Text style={[styles.videoText, { color: theme.colors.info }]}>{goalDisplay}</Text>
                        </TouchableOpacity>
                        <Checkbox
                            size={15}
                            value={completed}
                            editable={!isFutureDay}
                            onChange={() => completeStep(itemId)}
                        />
                    </View>
                    
                    {/* Extra fields */}
                    {extraDisplay && extraDisplay.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            {extraDisplay.map((line: string) => (
                                <TouchableOpacity
                                    key={line}
                                    disabled={isFutureDay}
                                    onPress={() => navigation.navigate('EditExercise', {
                                        itemId,
                                        viewOnlyExtra: true,
                                        onApply: (vals: any) => updateStepCallback(itemId, vals),
                                        ...exerciseParams,
                                    })}
                                >
                                    <Text style={[styles.videoText, { marginBottom: 5, color: theme.colors.info }]}>{line}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                    {modified && <Text style={styles.editedByMeText}>Edited by me</Text>}
                </View>
            );
        });
    }, [memoizedSteps, exercise?.type, subtype, navigation, updateStepCallback, completeStep, title]);

    // Science content toggle
    const [toggle, setToggle] = useState(false);
    const toggleText = useCallback(() => setToggle(prevState => !prevState), []);

    // Theme-aware HTML stylesheet for HTMLView so paragraphs/lists/headings adapt to dark mode.
    const themedHtmlStyles = useMemo(() => StyleSheet.create({
        ...htmlStyles,
        ol: { marginLeft: 15 },
        div: { color: theme.colors.text },
        span: { color: theme.colors.text },
        u: { ...htmlStyles.u, color: theme.colors.text },
        b: { ...htmlStyles.b, color: theme.colors.text },
        p: { ...htmlStyles.p, color: theme.colors.text },
        em: { ...htmlStyles.em, color: theme.colors.text },
        li: { ...htmlStyles.li, color: theme.colors.text },
        ins: { ...htmlStyles.ins, color: theme.colors.text },
        strong: { ...htmlStyles.strong, color: theme.colors.text },
        a: { color: theme.colors.info, textDecorationLine: 'underline' },
        h1: { fontSize: 24, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h2: { fontSize: 22, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h3: { fontSize: 20, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h4: { fontSize: 18, fontWeight: 'bold', marginVertical: 6, color: theme.colors.text },
        h5: { fontSize: 16, fontWeight: 'bold', marginVertical: 6, color: theme.colors.text },
        h6: { fontSize: 14, fontWeight: 'bold', marginVertical: 4, color: theme.colors.text },
    }), [theme.colors.text, theme.colors.info]);

    const themedRenderNode = useMemo(() => createRenderNode(theme.colors.text), [theme.colors.text]);

    // Render science content
    const renderScienceContent = useCallback(() => (
        <View>
            {scientificVideo || scientificDescription ? (
                <View>
                    <View style={{ marginTop: 16 }}>
                        {!toggle
                            ? scientificVideo
                                ? scientificVideo?.embedUrl
                                    ? <YoutubeVideo url={scientificVideo?.embedUrl} />
                                    : <PrivateVideo video={scientificVideo} />
                                : <Text color={theme.colors.textSecondary}>No video available</Text>
                            : scientificDescription?.length > 0 ? (
                                <HTMLView
                                    value={scientificDescription}
                                    renderNode={themedRenderNode}
                                    stylesheet={themedHtmlStyles}
                                />
                            ) : <Text color={theme.colors.textSecondary}>No scientific information available</Text>}
                    </View>
                    <TouchableOpacity onPress={toggleText}>
                        <Text style={[styles.helpLink, styles.swipePanelButton, { color: theme.colors.info }]}>
                            {toggle ? 'Back' : 'More'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text color={theme.colors.textSecondary}>No scientific information available</Text>
            )}
        </View>
    ), [scientificVideo, scientificDescription, toggle, toggleText, theme.colors.info, theme.colors.textSecondary, themedHtmlStyles, themedRenderNode]);

    // const clearHandler = useCallback(() => {
    //     dispatch(updateSteps({ steps: memoizedSteps, selectedSteps: [] }));
    // }, [dispatch, memoizedSteps]);
    return (
        <Screen initialized={!isLoading} clear={() => {}} style={[styles.container, { backgroundColor: theme.colors.background }]}>
            {renderTabs()}
            <View style={[styles.headerBanner, { backgroundColor: theme.colors.surfaceAlt || theme.colors.surface }]}>
                <View style={styles.row} />
                <Text textAlign="center" style={[styles.name, { color: theme.colors.text }]}>
                    {title}
                </Text>
                <IconButton
                    size={24}
                    icon="times"
                    iconStyle="solid"
                    color={theme.colors.text}
                    onPress={() => navigation.goBack()}
                />
            </View>
            <ScrollView>
                <View style={styles.tabContent}>
                    {activeTab === exercise?.type && renderExerciseContent()}
                    {activeTab === 'science' && renderScienceContent()}
                </View>
            </ScrollView>

            <Description
                style={{ backgroundColor: theme.colors.background }}
                video={videoData}
                isPanelOpen={isPanelOpen}
                description={instructionData}
                closePanel={() => setIsPanelOpen(false)}
            />
            {showGoodWork && (
                <Animated.View style={[
                    { opacity: fadeAnim },
                    styles.goodWorkContainer,
                    { backgroundColor: theme.colors.surfaceAlt },
                ]}>
                    <Text style={[styles.goodWorkText, { color: theme.colors.text }]}>Good Work!</Text>
                </Animated.View>
            )}
            {activeTab === exercise?.type && (
                <Button
                    title="DONE"
                    variant="primary"
                    disabled={!isDirty}
                    onPress={handleDone}
                    style={styles.submitBtn}
                    textStyle={{ fontSize: 20, fontWeight: '500', paddingVertical: 3 }}
                />
            )}
        </Screen>
    );
}

// Description component for swipeable panel
const Description = React.memo(({ closePanel, isPanelOpen, description, video, style }: any) => {
    const [toggle, setToggle] = useState(false);
    const theme = useTheme();
    const toggleText = useCallback(() => setToggle(prevState => !prevState), []);
    const normalizedDescription = normalizeDescription(description);
    const hasDescription = normalizedDescription.trim().length > 0;
    console.log(normalizedDescription);
    const hasVideo = Boolean(video);
    const themedHtmlStyles = useMemo(() => StyleSheet.create({
        ...htmlStyles,
        p: { ...htmlStyles.p, color: theme.colors.text },
        li: { ...htmlStyles.li, color: theme.colors.text },
        h1: { fontSize: 24, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h2: { fontSize: 22, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h3: { fontSize: 20, fontWeight: 'bold', marginVertical: 8, color: theme.colors.text },
        h4: { fontSize: 18, fontWeight: 'bold', marginVertical: 6, color: theme.colors.text },
        h5: { fontSize: 16, fontWeight: 'bold', marginVertical: 6, color: theme.colors.text },
        h6: { fontSize: 14, fontWeight: 'bold', marginVertical: 4, color: theme.colors.text },
        strong: { ...htmlStyles.strong, color: theme.colors.text },
        b: { ...htmlStyles.b, color: theme.colors.text },
        em: { ...htmlStyles.em, color: theme.colors.text },
        ins: { ...htmlStyles.ins, color: theme.colors.text },
        u: { ...htmlStyles.u, color: theme.colors.text },
        span: { color: theme.colors.text },
        div: { color: theme.colors.text },
        ol: { marginLeft: 15 },
        a: { color: theme.colors.info, textDecorationLine: 'underline' },
    }), [theme.colors.text, theme.colors.info]);
    const themedRenderNode = useMemo(() => createRenderNode(theme.colors.text), [theme.colors.text]);
    return (
        <SwipeablePanel
            fullWidth
            openLarge
            onlyLarge
            showCloseButton
            closeOnTouchOutside
            onClose={closePanel}
            snapPoints={['65%']}
            isActive={isPanelOpen}
            onPressCloseButton={closePanel}
            style={StyleSheet.flatten([styles.swipePanel, style])}
            closeIconStyle={{
                borderWidth: 1.5,
                borderColor: theme.colors.grey,
                backgroundColor: theme.colors.grey,
            }}
            closeRootStyle={{ backgroundColor: 'transparent' }}
        >
            <View style={{ paddingHorizontal: OFFSET.HORIZONTAL, marginTop: OFFSET.VERTICAL }}>
                <View style={{ marginTop: 16 * 2 }}>
                    {!toggle
                        ? hasVideo
                            ? video?.embedUrl
                                ? <YoutubeVideo url={video?.embedUrl} />
                                : <PrivateVideo video={video} />
                            : hasDescription
                                ? <HTMLView
                                    renderNode={themedRenderNode}
                                    stylesheet={themedHtmlStyles}
                                    value={normalizedDescription}
                                />
                                : <Text textAlign="center" color={theme.colors.textSecondary}>No video available</Text>
                        : <HTMLView
                            renderNode={themedRenderNode}
                            stylesheet={themedHtmlStyles}
                            value={normalizedDescription}
                        />}
                </View>
                {hasDescription && hasVideo
                    ? <TouchableOpacity onPress={toggleText}>
                        <Text style={[styles.helpLink, styles.swipePanelButton, { color: theme.colors.info }]}>
                            {toggle ? 'Back' : 'More'}
                        </Text>
                    </TouchableOpacity>
                    : <TouchableOpacity onPress={closePanel}>
                        <Text style={[styles.helpLink, styles.swipePanelButton, { color: theme.colors.info }]}>Close</Text>
                    </TouchableOpacity>}
            </View>
        </SwipeablePanel>
    );
});

const screenWidth = Dimensions.get('window').width;

const htmlStyles = StyleSheet.create({
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
        paddingRight: 16 * 2,
        width: screenWidth - 16 * 2,
    },
    ul: {
        marginLeft: 15,
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: OFFSET.VERTICAL,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerBanner: {
        paddingHorizontal: OFFSET.HORIZONTAL * 2,
        // marginBottom: OFFSET.VERTICAL * 2,
        justifyContent: 'space-between',
        paddingVertical: 15,
        backgroundColor: '#E0EBF7',
        flexDirection: 'row'
    },
    name: {
        paddingRight: OFFSET.HORIZONTAL,
        marginLeft: OFFSET.HORIZONTAL,
        fontWeight: '500',
        marginBottom: 0,
        fontSize: 20,
    },
    tabContent: {
        padding: 20,
        justifyContent: 'space-between',
    },
    tabsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: OFFSET.HORIZONTAL,
        marginBottom: OFFSET.VERTICAL,
        borderWidth: 2,
        borderColor: '#156F93',
        borderRadius: 8,
        overflow: 'hidden',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 12,
        backgroundColor: COLORS.LIGHT_GREY,
        alignItems: 'center',
        borderRightColor: '#156F93'
    },
    activeTabButton: {
        backgroundColor: '#2978A0',
    },
    tabText: {
        color: '#156F93',
        fontWeight: '400',
        fontSize: 18,
    },
    activeTabText: {
        fontSize: 18,
        color: COLORS.WHITE,
        fontWeight: '700',
    },
    videoText: {
        textDecorationLine: 'underline',
        color: '#2978A0',
    },
    imageContainer: {
        height: 150,
        width: '100%',
        borderRadius: 10,
        marginVertical: 10,
    },
    image: {
        width: '100%',
        height: 150,
        resizeMode: 'contain',
    },
    repsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    editedByMeText: {
        color: '#77B15B',
        fontSize: 13,
        fontWeight: '500',
    },
    goodWorkContainer: {
        zIndex: 10,
        alignItems: 'center',
    },
    goodWorkText: {
        padding: 16,
        fontSize: 32,
        borderRadius: 12,
        fontWeight: '500',
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        marginBottom: 16,
        alignSelf: 'center',
        borderColor: 'transparent',
    },
    swipePanel: {
        backgroundColor: COLORS.WHITE,
        height: '75%'
    },
    swipePanelButton: {
        marginLeft: 'auto',
        marginBottom: 30,
        marginRight: 15,
        marginTop: 10,
    },
    helpLink: {
        color: '#2978A0',
        textDecorationLine: 'underline',
        fontSize: 16,
        fontWeight: '700'
    },
    htmlViewTextContainer: {
        width: '90%',
        flexDirection: 'row',
        paddingRight: 4,
        margin: 2,
    },
});

const createRenderNode = (textColor: string) => ({ node, index }: any) => {
    if (node?.data === '\n') { return <View key={`ws-${index}`} />; }
    if (node?.name === 'li') {
        const flattenText = (children: any[] = []): string => children.map(child => {
            if (!child) { return ''; }
            if (child.type === 'text' || child.name === 'text') { return child.data || ''; }
            if (child.type === 'tag' && child.name === 'br') { return '\n'; }
            if (child.name === 'br') { return '\n'; }
            return flattenText(child.children || []);
        }).join('');
        const renderedChildren = flattenText(node.children);
        return (
            <View key={`li-${index}`} style={styles.htmlViewTextContainer}>
                <Text style={{ marginRight: 5, marginTop: 5, color: textColor }}>•</Text>
                <Text style={[htmlStyles.li, { color: textColor }]}>{renderedChildren}</Text>
            </View>
        );
    }
    return undefined;
};

const normalizeDescription = (value: unknown): string => {
    if (typeof value === 'string') { return value; }
    if (Array.isArray(value)) {
        return value
            .map(item => {
                if (typeof item === 'string') { return item; }
                if (item && typeof item === 'object') {
                    const textValue = (item as any).text
                        || (item as any).description
                        || (item as any).value
                        || (item as any).html
                        || '';
                    return typeof textValue === 'string' ? textValue : '';
                }
                return '';
            })
            .filter(Boolean)
            .join('\n');
    }
    if (value && typeof value === 'object') {
        const maybeText = (value as any).text
            || (value as any).description
            || (value as any).value
            || (value as any).html
            || '';
        return typeof maybeText === 'string' ? maybeText : '';
    }
    return '';
};
