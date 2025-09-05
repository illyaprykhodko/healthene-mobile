import React, { useCallback, useRef, useState, useEffect, useLayoutEffect, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Animated, Dimensions } from 'react-native';
import Text from 'components/Text';
import Screen from 'components/Screen';
import Checkbox from 'components/Checkbox';
import { COLORS } from 'constants/colors';
import { PHASE_ITEM_STATUS } from '../types';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from 'store';
import { initializeExercise, updateSteps, setLoading, clearExercise } from 'store/slices/exerciseSlice';
import { useGetPhysicalActivityItemQuery, useGetStretchingExerciseQuery, useGetAerobicExerciseQuery, useGetResistanceExerciseQuery, useUpdateStretchingStepsMutation, useUpdateAerobicStepsMutation, useUpdateResistanceStepsMutation } from 'store/api/dayOverviewApi';
import { ExerciseType } from 'types';
import { EXERCISE_CONFIGS } from './exerciseFactory';
import { YoutubeVideo } from 'components/YoutubeVideo';
import { PrivateVideo } from 'components/PrivateVideo';
import { SwipeablePanel } from 'components/SwipeablePanel';
import { HTMLView } from 'components/HTMLView';

// Helper function to get exercise step parameters
const getExerciseStepParams = (exercise: any, step: any, subtype: any) => ({
    exerciseType: exercise.type,
    goalType: step.type,
    subtype,
});

// Helper function to humanize text
const humanize = (text: string) => {
    return text
        .replace(/^EXERCISE_/, '')
        .toLowerCase()
        .split('_')
        .map(s => s.charAt(0).toUpperCase() + s.slice(1))
        .join(' ');
};

export default function ExerciseDetails () {
    const route = useRoute<any>();
    const navigation = useNavigation<any>();
    const dispatch = useAppDispatch();
    const { exercise, updatePhaseItem, refreshCurrentList, parentNavigation } = route.params || {};
    const [showGoodWork, setShowGoodWork] = useState(false);
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const title = exercise?.title || 'Exercise';

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
    
    const isLoading = useMemo(() => (exercise?.type === ExerciseType.STRETCHING
        ? stretchingLoading
        : exercise?.type === ExerciseType.AEROBIC
            ? aerobicLoading
            : exercise?.type === ExerciseType.RESISTANCE
                ? resistanceLoading
                : fallbackLoading),
    [exercise?.type, stretchingLoading, aerobicLoading, resistanceLoading, fallbackLoading]);
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
    
    // Memoize steps to prevent infinite loops - use a more stable approach
    const memoizedSteps = useMemo(() => {
        return steps;
    }, [steps]);
    // }, [steps.length, steps.map((s: any) => s?.id).join(',')]);

    // Clear exercise state when exercise ID changes
    useEffect(() => {
        if (exercise?.id && exerciseState.id && exerciseState.id !== exercise.id) {
            // console.log('Clearing exercise state for new exercise:', exercise.id);
            dispatch(clearExercise());
        }
    }, [exercise?.id, exerciseState.id, dispatch]);

    // Initialize exercise when data loads
    useEffect(() => {
        // console.log('ExerciseDetails useEffect - exerciseData:', exerciseData);
        // console.log('ExerciseDetails useEffect - exercise:', exercise);
        // console.log('ExerciseDetails useEffect - current exerciseState.id:', exerciseState.id);
        
        if (exerciseData && exercise?.id && exercise?.type) {
            // Only initialize if we don't have data for this exercise yet or if the data is different
            if (exerciseState.id !== exercise.id || !exerciseState.initialized) {
                const processedData = {
                    ...exerciseData,
                    exerciseType: exercise.type,
                    subtype: exerciseData?.type,
                    originalSteps: exerciseData?.steps,
                    steps: [...(exerciseData?.steps || [])]?.sort((a: any, b: any) => a?.order - b?.order) || [],
                    scientificDescription: exerciseData?.scientificDescription,
                    scientificVideo: exerciseData?.scientificVideo,
                };
                
                console.log('ExerciseDetails - processedData:', processedData);
                console.log('ExerciseDetails - steps:', processedData.steps);
                
                dispatch(initializeExercise({
                    id: exercise.id,
                    exerciseType: exercise.type,
                    data: processedData
                }));
            }
        }
    }, [exerciseData, exercise?.id, exercise?.type, dispatch, exerciseState.id, exerciseState.initialized]);

    useLayoutEffect(() => {
        parentNavigation?.setOptions({
            headerLeft: () => (
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ color: COLORS.WHITE }}>Back</Text>
                </TouchableOpacity>
            )
        });
    }, [parentNavigation, navigation]);

    // Define tabs
    const TABS = [
        { key: exercise?.type, label: humanize(exercise?.type?.replace(/^EXERCISE_/, '') || '') },
        { key: 'science', label: 'Science' },
    ];
    const [activeTab, setActiveTab] = useState(TABS[0].key);

    // Get mutation based on exercise type
    const [updateStretchingSteps] = useUpdateStretchingStepsMutation();
    const [updateAerobicSteps] = useUpdateAerobicStepsMutation();
    const [updateResistanceSteps] = useUpdateResistanceStepsMutation();

    const updateExerciseDataCallback = useCallback(async (status: string, steps: any[]) => {
        updatePhaseItem?.({ ...exercise, status });
        
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
                // await updateMutation({ steps }).unwrap();
                dispatch(setLoading(false));
            } catch (error) {
                console.error('Failed to update exercise steps:', error);
                dispatch(setLoading(false));
            }
        }
    }, [updatePhaseItem, exercise?.id, exercise?.type, updateStretchingSteps, updateAerobicSteps, updateResistanceSteps, dispatch]);

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
        
        if (nextStatus === PHASE_ITEM_STATUS.DONE) {
            setTimeout(() => {
                navigation.goBack();
            }, 700);
            refreshCurrentList?.(exercise.id, 'status', nextStatus);
            updateExerciseDataCallback(nextStatus, memoizedSteps);
        } else {
            refreshCurrentList?.(exercise.id, 'status', nextStatus);
            updateExerciseDataCallback(nextStatus, memoizedSteps);
        }
    }, [memoizedSteps, exercise?.id, refreshCurrentList, updateExerciseDataCallback, navigation, fadeAnim]);

    // Panel state for video/instruction
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [videoData, setVideoData] = useState([]);
    const [instructionData, setInstructionData] = useState([]);

    // Step management functions
    const updateStepCallback = useCallback((stepId: string | number, vals: any) => {
        const updatedSteps = (memoizedSteps || [])?.map((step: any) =>
            (step.id === stepId ? { ...step, ...vals, modified: true } : step)
        );
        dispatch(updateSteps({
            steps: updatedSteps,
            selectedSteps: updatedSteps.filter((step: any) => step.completed)
        }));
    }, [memoizedSteps, dispatch]);

    const completeStep = useCallback((stepId: string | number) => {
        const updatedSteps = (memoizedSteps || [])?.map((step: any) =>
            (step.id === stepId ? { ...step, completed: !step.completed } : step)
        );
        dispatch(updateSteps({
            steps: updatedSteps,
            selectedSteps: updatedSteps.filter((step: any) => step.completed)
        }));
    }, [memoizedSteps, dispatch]);

    // Render tabs
    const renderTabs = useCallback(() => (
        <View style={styles.tabsRow}>
            {TABS.map((tab, index) => {
                const isActive = activeTab === tab.key;
                return (
                    <TouchableOpacity
                        key={tab.key}
                        style={[
                            styles.tabButton,
                            isActive && styles.activeTabButton,
                            { borderRightWidth: TABS.length === index + 1 ? 0 : 2 },
                        ]}
                        onPress={() => setActiveTab(tab.key)}
                    >
                        <Text style={[styles.tabText, isActive ? styles.activeTabText : {}]}>
                            {tab.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </View>
    ), [activeTab]);

    // Render exercise content
    const renderExerciseContent = useCallback(() => {
        console.log('renderExerciseContent - steps:', memoizedSteps);
        console.log('renderExerciseContent - steps length:', memoizedSteps?.length);
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
                        { borderBottomWidth: 1, borderColor: '#E1E1E1' },
                    ]}
                >
                    {(video || instruction) ? (
                        <TouchableOpacity
                            style={[{ alignSelf: 'flex-end' }, exercise?.type !== ExerciseType.RESISTANCE && completed && { opacity: 0.5 }]}
                            onPress={() => {
                                setVideoData(video);
                                setIsPanelOpen(true);
                                setInstructionData(instruction);
                            }}
                        >
                            <Text style={styles.videoText}>Video</Text>
                        </TouchableOpacity>
                    ) : null}
                    
                    {image ? (
                        <View style={styles.imageContainer}>
                            <Text style={[styles.image, exercise?.type !== ExerciseType.RESISTANCE && completed && { opacity: 0.5 }]}>
                                Image: {image?.url || 'No URL'}
                            </Text>
                        </View>
                    ) : null}
                    
                    {/* Goal row */}
                    <View style={styles.repsContainer}>
                        <TouchableOpacity
                            style={completed && { opacity: 0.5 }}
                            onPress={() => {
                                navigation.navigate('EditExercise', {
                                    title,
                                    itemId,
                                    onApply: (vals: any) => updateStepCallback(itemId, vals),
                                    ...exerciseParams,
                                });
                            }}
                        >
                            <Text style={styles.videoText}>{goalDisplay}</Text>
                        </TouchableOpacity>
                        <Checkbox
                            size={15}
                            value={completed}
                            onChange={() => completeStep(itemId)}
                        />
                    </View>
                    
                    {/* Extra fields */}
                    {extraDisplay && extraDisplay.length > 0 && (
                        <View style={{ marginTop: 8 }}>
                            {extraDisplay.map((line: string) => (
                                <TouchableOpacity
                                    key={line}
                                    onPress={() => navigation.navigate('EditExercise', {
                                        viewOnlyExtra: true,
                                        itemId,
                                        onApply: (vals: any) => updateStepCallback(itemId, vals),
                                        ...exerciseParams,
                                    })}
                                >
                                    <Text style={[styles.videoText, { marginBottom: 5 }]}>{line}</Text>
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
                                : <Text>No video available</Text>
                            : scientificDescription?.length > 0 ? (
                                <HTMLView
                                    value={scientificDescription}
                                    stylesheet={htmlStyles}
                                />
                            ) : <Text>No scientific information available</Text>}
                    </View>
                    <TouchableOpacity onPress={toggleText}>
                        <Text style={[styles.helpLink, styles.swipePanelButton]}>
                            {toggle ? 'Back' : 'More'}
                        </Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <Text>No scientific information available</Text>
            )}
        </View>
    ), [scientificVideo, scientificDescription, toggle, toggleText]);

    const clearHandler = useCallback(() => {
        dispatch(updateSteps({ steps: memoizedSteps, selectedSteps: [] }));
    }, [dispatch, memoizedSteps]);
    
    return (
        <Screen initialized={!isLoading} clear={() => {}} style={styles.container}>
            {renderTabs()}
            <View style={styles.headerBanner}>
                <View style={styles.row} />
                <Text textAlign="center" color={COLORS.BLACK} style={styles.name}>
                    {title}
                </Text>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={{ fontSize: 24, color: COLORS.BLACK }}>×</Text>
                </TouchableOpacity>
            </View>
            <ScrollView>
                <View style={styles.tabContent}>
                    {activeTab === exercise?.type && renderExerciseContent()}
                    {activeTab === 'science' && renderScienceContent()}
                </View>
            </ScrollView>

            <Description
                video={videoData}
                isPanelOpen={isPanelOpen}
                description={instructionData}
                closePanel={() => setIsPanelOpen(false)}
            />
            {showGoodWork && (
                <Animated.View style={[styles.goodWorkContainer, { opacity: fadeAnim }]}>
                    <Text style={styles.goodWorkText}>Good Work!</Text>
                </Animated.View>
            )}
            {activeTab === exercise?.type && (
                <TouchableOpacity
                    disabled={!isDirty}
                    onPress={handleDone}
                    style={!isDirty ? { ...styles.submitBtn, backgroundColor: '#EEEEEE' } : styles.submitBtn}
                >
                    <Text style={{
                        fontSize: 20,
                        fontWeight: '500',
                        paddingVertical: 3,
                        color: !isDirty ? '#888888' : '#4E733C',
                        textAlign: 'center',
                    }}>
                        DONE
                    </Text>
                </TouchableOpacity>
            )}
        </Screen>
    );
}

// Description component for swipeable panel
const Description = React.memo(({ closePanel, isPanelOpen, description, video, style }: any) => {
    const [toggle, setToggle] = useState(false);
    const toggleText = useCallback(() => setToggle(prevState => !prevState), []);
    
    return (
        <SwipeablePanel
            // fullWidth
            // openLarge
            // onlyLarge
            showCloseButton
            closeOnTouchOutside
            onClose={closePanel}
            isActive={isPanelOpen}
            onPressCloseButton={closePanel}
            style={[styles.swipePanel, style]}
            closeIconStyle={{
                backgroundColor: '#A5A5A5',
                borderWidth: 1.5,
                borderColor: '#A5A5A5',
            }}
            closeRootStyle={{ backgroundColor: 'transparent' }}
        >
            <View style={{ paddingHorizontal: 16 * 1.5 }}>
                <View style={{ marginTop: 16 * 5 }}>
                    {!toggle
                        ? video
                            ? video?.embedUrl
                                ? <YoutubeVideo url={video?.embedUrl} />
                                : <PrivateVideo video={video} />
                            : <Text textAlign="center">No video available</Text>
                        : <HTMLView
                            value={description}
                            stylesheet={htmlStyles}
                        />}
                </View>
                {description?.length
                    ? <TouchableOpacity onPress={toggleText}>
                        <Text style={[styles.helpLink, styles.swipePanelButton]}>
                            {toggle ? 'Back' : 'More'}
                        </Text>
                    </TouchableOpacity>
                    : <TouchableOpacity onPress={closePanel}>
                        <Text style={[styles.helpLink, styles.swipePanelButton]}>Close</Text>
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
        backgroundColor: COLORS.WHITE,
        paddingTop: 16,
        paddingLeft: -20,
        paddingRight: -20,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    headerBanner: {
        paddingHorizontal: 16 * 2,
        marginBottom: 16 * 2,
        justifyContent: 'space-between',
        paddingVertical: 16,
        backgroundColor: '#E0EBF7',
        flexDirection: 'row'
    },
    name: {
        paddingRight: 16,
        marginLeft: 16,
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
        marginHorizontal: 16,
        marginBottom: 16,
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
        backgroundColor: COLORS.BLUE,
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
        resizeMode: 'contain',
        width: '100%',
        height: 150,
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
        alignItems: 'center',
        zIndex: 10,
    },
    goodWorkText: {
        fontSize: 32,
        fontWeight: '500',
        color: COLORS.BLACK,
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
    },
    submitBtn: {
        width: '90%',
        borderRadius: 30,
        alignSelf: 'center',
        backgroundColor: '#96E072',
        borderColor: 'transparent',
        marginBottom: 16,
    },
    swipePanel: {
        backgroundColor: COLORS.WHITE,
        height: '55%'
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
});

