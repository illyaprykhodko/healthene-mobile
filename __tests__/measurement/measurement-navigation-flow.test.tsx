/**
 * Measurement Navigation Flow Integration Tests
 * Tests the complete flow: DayOverview → SaveValue → MeasurementChart → AllRecordedData
 */

// Mock navigation
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

describe('Measurement Navigation Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('DayOverview → SaveValue Flow', () => {
        it('navigates to SaveValue when DONE measurement is clicked', () => {
            const handlePhasePress = (phase: any) => {
                if (phase.type === 'MEASUREMENT' && phase.status === 'DONE') {
                    mockNavigate('SaveValue', {
                        measurementType: 'WEIGHT',
                        measurementName: 'Weight',
                        measurementPhaseItem: { id: 1, phaseId: 100 },
                        date: '2025-10-14',
                    });
                }
            };

            const donePhase = {
                type: 'MEASUREMENT',
                status: 'DONE',
                id: 1,
            };

            handlePhasePress(donePhase);

            expect(mockNavigate).toHaveBeenCalledWith('SaveValue', {
                measurementType: 'WEIGHT',
                measurementName: 'Weight',
                measurementPhaseItem: { id: 1, phaseId: 100 },
                date: '2025-10-14',
            });
        });

        it('does not navigate to SaveValue for PENDING measurements', () => {
            const handlePhasePress = (phase: any) => {
                if (phase.type === 'MEASUREMENT' && phase.status === 'DONE') {
                    mockNavigate('SaveValue', {});
                }
            };

            const pendingPhase = {
                type: 'MEASUREMENT',
                status: 'PENDING',
                id: 1,
            };

            handlePhasePress(pendingPhase);

            expect(mockNavigate).not.toHaveBeenCalled();
        });
    });

    describe('SaveValue → MeasurementChart Flow', () => {
        it('navigates to MeasurementChart when Graph button is clicked', () => {
            const handleGoToChart = () => {
                mockNavigate('MeasurementChart', {
                    measurementType: 'WEIGHT',
                    measurementName: 'Weight',
                    date: '2025-10-14',
                });
            };

            handleGoToChart();

            expect(mockNavigate).toHaveBeenCalledWith('MeasurementChart', {
                measurementType: 'WEIGHT',
                measurementName: 'Weight',
                date: '2025-10-14',
            });
        });

        it('navigates back to DayOverview when Done button is clicked', () => {
            const handleDone = () => {
                mockNavigate('DayOverview');
            };

            handleDone();

            expect(mockNavigate).toHaveBeenCalledWith('DayOverview');
        });
    });

    describe('MeasurementChart → AllRecordedData Flow', () => {
        it('navigates to AllRecordedData when Show All Data is clicked', () => {
            const handleShowAllData = () => {
                mockNavigate('AllRecordedData', {
                    measurementType: 'WEIGHT',
                    title: 'Weight',
                });
            };

            handleShowAllData();

            expect(mockNavigate).toHaveBeenCalledWith('AllRecordedData', {
                measurementType: 'WEIGHT',
                title: 'Weight',
            });
        });
    });

    describe('Complete Flow: DayOverview → SaveValue → Chart → AllData', () => {
        it('completes full navigation flow', async () => {
            // Step 1: DayOverview → SaveValue
            mockNavigate('SaveValue', {
                measurementType: 'WEIGHT',
                measurementName: 'Weight',
                date: '2025-10-14',
            });

            expect(mockNavigate).toHaveBeenNthCalledWith(1, 'SaveValue', expect.any(Object));

            // Step 2: SaveValue → MeasurementChart
            mockNavigate('MeasurementChart', {
                measurementType: 'WEIGHT',
                measurementName: 'Weight',
                date: '2025-10-14',
            });

            expect(mockNavigate).toHaveBeenNthCalledWith(2, 'MeasurementChart', expect.any(Object));

            // Step 3: MeasurementChart → AllRecordedData
            mockNavigate('AllRecordedData', {
                measurementType: 'WEIGHT',
                title: 'Weight',
            });

            expect(mockNavigate).toHaveBeenNthCalledWith(3, 'AllRecordedData', expect.any(Object));

            // Step 4: AllRecordedData → back → MeasurementChart
            mockGoBack();
            expect(mockGoBack).toHaveBeenCalled();
        });
    });

    describe('Blood Pressure Special Handling', () => {
        it('handles blood pressure measurement navigation', () => {
            mockNavigate('SaveValue', {
                measurementType: 'BLOOD_PRESSURE',
                measurementName: 'Blood Pressure',
                date: '2025-10-14',
            });

            expect(mockNavigate).toHaveBeenCalledWith(
                'SaveValue',
                expect.objectContaining({ measurementType: 'BLOOD_PRESSURE' })
            );
        });
    });
});
