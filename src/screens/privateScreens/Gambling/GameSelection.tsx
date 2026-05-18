// outsource dependencies
import React, { useMemo, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image, ImageSourcePropType, Platform, StyleSheet, TouchableOpacity, View } from 'react-native';
// local dependencies
import Text from 'components/Text';
import Screen from 'components/Screen';
import { ROUTES } from 'constants/routes';
import { OFFSET } from 'constants/offset';
import { RootStackParamList } from 'services/navigation';
import { NestBird } from 'animation/NestBird.tsx';

type GameType = 'SLOTS' | 'BLACKJACK';
type Navigation = NativeStackNavigationProp<RootStackParamList>;

const games: Array<{ id: GameType; title: string; image: ImageSourcePropType }> = [
    { id: 'SLOTS', title: 'Slots', image: require('../../../../assets/gambling-slots.png') },
    { id: 'BLACKJACK', title: 'Black Jack', image: require('../../../../assets/gambling-blackjack.png') },
];

const GameSelection: React.FC = () => {
    const navigation = useNavigation<Navigation>();
    const [selectedGame, setSelectedGame] = useState<GameType>('SLOTS');

    const selectedGameTitle = useMemo(
        () => games.find(game => game.id === selectedGame)?.title ?? 'Slots',
        [selectedGame]
    );

    return (
        <Screen initialized style={styles.container}>
            <Text variant="common" style={styles.title}>Games</Text>
            <View style={styles.divider} />

            <View style={styles.cardRow}>
                {games.map(game => {
                    const isSelected = selectedGame === game.id;
                    return (
                        <TouchableOpacity
                            key={game.id}
                            activeOpacity={0.85}
                            style={styles.gameButton}
                            onPress={() => setSelectedGame(game.id)}
                        >
                            <View style={[styles.imageCard, isSelected && styles.imageCardSelected]}>
                                <Image
                                    source={game.image}
                                    resizeMode="contain"
                                    style={[
                                        styles.gameImage,
                                        game.id === 'SLOTS' ? styles.slotImage : styles.blackjackImage,
                                    ]}
                                />
                            </View>
                            <Text variant="h3" style={styles.cardTitle}>{game.title}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View style={styles.footer}>
                <View style={styles.footerLeft}>
                    <NestBird />
                    <TouchableOpacity
                        activeOpacity={0.85}
                        onPress={() => navigation.goBack()}
                        style={[styles.backButton, styles.shadowBtn]}
                    >
                        <Text variant="h4" style={styles.backButtonText}>Back</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity
                    activeOpacity={0.85}
                    style={[styles.playButton, styles.shadowBtn]}
                    onPress={() => navigation.navigate(ROUTES.GAMBLING_SLOT_MACHINE, { gameType: selectedGame })}
                >
                    <Text variant="h4" style={styles.playButtonText}>Play</Text>
                </TouchableOpacity>
            </View>

            <Text variant="h6" style={styles.hintText}>
                Selected: {selectedGameTitle}
            </Text>
        </Screen>
    );
};

export default GameSelection;

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 18,
    },
    title: {
        // marginTop: OFFSET.VERTICAL,
        fontFamily: 'Outfit',
        fontWeight: 400,
        fontSize: 40,
        color: '#000',
        // marginBottom: 8,
    },
    divider: {
        height: 1,
        backgroundColor: '#8080808C',
        // marginVertical: OFFSET.VERTICAL * 1.5,
        marginTop: 10,
        marginBottom: OFFSET.VERTICAL,
    },
    cardRow: {
        flexDirection: 'row',
        gap: 12,
        justifyContent: 'center',
    },
    gameButton: {
        // width: 122,
        alignItems: 'center',
    },
    imageCard: {
        width: 148,
        height: 114,
        borderRadius: 8,
        borderWidth: 4,
        borderColor: '#000',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
    },
    imageCardSelected: {
        borderColor: '#007CD6',
        shadowColor: '#007CD6',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 4,
        elevation: 3,
    },
    gameImage: {
        width: 82,
        height: 82,
    },
    slotImage: {
        width: 68,
        height: 86,
    },
    blackjackImage: {
        width: 86,
        height: 86,
    },
    cardTitle: {
        marginTop: 8,
        color: '#000',
        fontFamily: 'Outfit-Regular',
        fontWeight: 400,
        fontSize: 24,
    },
    footer: {
        marginTop: 'auto',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-end',
    },
    footerLeft: {
        alignItems: 'flex-start',
    },
    backButton: {
        backgroundColor: '#FFA5A5',
        borderRadius: 8,
        minWidth: 78,
        paddingVertical: 12,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    backButtonText: {
        fontWeight: 700,
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 30,
        color: '#000',
    },
    playButton: {
        backgroundColor: '#9CFD83',
        borderRadius: 8,
        minWidth: 78,
        paddingVertical: 12,
        paddingHorizontal: 25,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#A9A9A9',
    },
    shadowBtn: {
        shadowColor: '#000000',
        ...Platform.select({
            ios: {
                shadowOffset: { width: 3, height: 3 },
                shadowOpacity: 0.8,
                shadowRadius: 3,
            },
            android: {
                elevation: 5,
            },
        }),
    },
    playButtonText: {
        fontWeight: 700,
        fontFamily: 'Open Sans',
        fontSize: 24,
        lineHeight: 30,
        color: '#000',
    },
    hintText: {
        color: '#6F6F6F',
        marginTop: 8,
        textAlign: 'right',
    },
});
