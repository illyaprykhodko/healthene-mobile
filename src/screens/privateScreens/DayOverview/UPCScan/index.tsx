// outsource dependencies
import React, { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import { View, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
// local dependencies
import Text from '../../../../components/Text';
import Screen from '../../../../components/Screen';
import { useTheme } from '../../../../hooks/useTheme';
import { COLORS } from '../../../../constants/colors';
import { Button } from '../../../../components/Button';

interface UPCScanProps {
    entityType?: string;
    onApply?: (item: any) => void;
}

export const UPCScan: React.FC<UPCScanProps> = () => {
    const theme = useTheme();
    const navigation = useNavigation();
    const route = useRoute<any>();
    const [upcCode, setUpcCode] = useState('');
    const [isScanning, setIsScanning] = useState(false);

    const entityType = route.params?.entityType || 'FOOD';
    const onApply = route.params?.onApply;

    const handleScan = () => {
        setIsScanning(true);
        // TODO: Implement actual barcode scanning
        // For now, we'll simulate scanning
        setTimeout(() => {
            setIsScanning(false);
            // Simulate finding an item
            const mockItem = {
                id: '12345',
                name: 'Scanned Item',
                type: entityType,
                upc: upcCode,
            };
            if (onApply) {
                onApply(mockItem);
            }
            navigation.goBack();
        }, 2000);
    };

    const handleManualEntry = () => {
        if (upcCode.trim()) {
            const mockItem = {
                id: '12345',
                name: 'Manual Entry Item',
                type: entityType,
                upc: upcCode,
            };
            if (onApply) {
                onApply(mockItem);
            }
            navigation.goBack();
        }
    };

    return (
        <Screen initialized={true} style={styles.container}>
            <View style={styles.content}>
                <Text variant="h3" style={styles.title}>
                    Scan UPC Code
                </Text>
                
                <View style={styles.scanArea}>
                    <View style={styles.scanFrame}>
                        <Text style={styles.scanText}>
                            {isScanning ? 'Scanning...' : 'Position barcode in frame'}
                        </Text>
                    </View>
                </View>

                <View style={styles.manualEntry}>
                    <Text style={styles.manualLabel}>Or enter code manually:</Text>
                    <TextInput
                        value={upcCode}
                        onChangeText={setUpcCode}
                        placeholder="Enter UPC code"
                        style={[styles.input, { color: theme.colors.text }]}
                        placeholderTextColor={COLORS.GREY}
                        keyboardType="numeric"
                    />
                </View>

                <View style={styles.buttons}>
                    <Button
                        title={isScanning ? 'Scanning...' : 'Scan Barcode'}
                        variant="primary"
                        onPress={handleScan}
                        disabled={isScanning}
                        style={styles.scanButton}
                    />
                    
                    <Button
                        title="Enter Manually"
                        variant="secondary"
                        onPress={handleManualEntry}
                        disabled={!upcCode.trim()}
                        style={styles.manualButton}
                    />
                </View>
            </View>
        </Screen>
    );
};

export default UPCScan;

const styles = StyleSheet.create({
    container: {
        paddingLeft: 0,
        paddingRight: 0,
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
    },
    title: {
        textAlign: 'center',
        marginBottom: 40,
    },
    scanArea: {
        alignItems: 'center',
        marginBottom: 40,
    },
    scanFrame: {
        width: 250,
        height: 150,
        borderWidth: 2,
        borderColor: COLORS.BLUE,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    scanText: {
        textAlign: 'center',
        color: COLORS.GREY,
        fontSize: 16,
    },
    manualEntry: {
        marginBottom: 40,
    },
    manualLabel: {
        fontSize: 16,
        marginBottom: 10,
        textAlign: 'center',
    },
    input: {
        borderWidth: 1,
        borderColor: COLORS.GREY,
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 8,
        fontSize: 16,
        backgroundColor: COLORS.WHITE,
        textAlign: 'center',
    },
    buttons: {
        gap: 16,
    },
    scanButton: {
        marginBottom: 8,
    },
    manualButton: {
        marginBottom: 8,
    },
});
