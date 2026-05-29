
// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, FlatList, View, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

// local dependencies
import Text from 'components/Text';
import { COLORS } from 'constants/colors';
import { useTheme } from 'hooks/useTheme';
import { PressableScale } from 'components/PressableScale';

interface MenuItem {
  id?: number | null;
  name: string;
}

interface HorizontalMenuProps {
  data: MenuItem[];
  disabled?: boolean;
  viewPosition?: number; // default 0.5
  activeItem?: MenuItem | null;
  handleItem: (payload: { activeItem: MenuItem }) => void;
}

const SCROLL_NUMBER = 150;

const HorizontalMenu: React.FC<HorizontalMenuProps> = memo(
    ({ data, handleItem, viewPosition = 0.5, activeItem = null, disabled = false }) => {
        const theme = useTheme();
        const ref = useRef<FlatList<MenuItem> | null>(null);
        const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

        const [index, setIndex] = useState(0);
        const handleScrollToIndexFailed = useCallback(() => {
            if (safeData.length > 0) {
                setIndex(0);
            }
        }, [safeData.length]);

        const handleIndex = useCallback(
            (item: MenuItem) => {
                const foundIndex = safeData.findIndex(x => x?.name === item?.name);
                setIndex(foundIndex >= 0 ? foundIndex : 0);
            },
            [safeData],
        );

        useEffect(() => {
            if (!safeData.length) { return; }
            // Ensure index is within valid bounds before scrolling
            const safeIndex = Math.min(Math.max(0, index), safeData.length - 1);
            if (safeIndex !== index) {
                setIndex(safeIndex);
                return;
            }
            ref.current?.scrollToIndex?.({ index: safeIndex, viewPosition, animated: true });
        }, [index, viewPosition, safeData.length]);

        useEffect(() => {
            if (!activeItem?.name) { return; }
            handleIndex(activeItem);
        }, [activeItem?.name, handleIndex]);

        const [currentOffset, setCurrentOffset] = useState(0);
        const [scrolled, setScrolled] = useState(false);

        const handleEndReached = useCallback(() => setScrolled(true), []);

        const handleScroll = useCallback(
            (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const nextOffset = event.nativeEvent.contentOffset.x;

                if (currentOffset > nextOffset) { setScrolled(false); }

                setCurrentOffset(nextOffset);
            },
            [currentOffset],
        );

        const scrollTo = useCallback((offset: number) => {
            ref.current?.scrollToOffset?.({ offset, animated: true });
        }, []);

        const handleLeftArrow = useCallback(() => {
            scrollTo(currentOffset - SCROLL_NUMBER);
        }, [scrollTo, currentOffset]);

        const handleRightArrow = useCallback(() => {
            scrollTo(currentOffset + SCROLL_NUMBER);
        }, [scrollTo, currentOffset]);

        // "Hidden" arrows blend into the screen background; visible ones use secondary text.
        const leftArrowColor = useMemo(
            () => (currentOffset > 10 ? theme.colors.textSecondary : theme.colors.background),
            [currentOffset, theme.colors],
        );

        const rightArrowColor = useMemo(
            () => (!scrolled ? theme.colors.textSecondary : theme.colors.background),
            [scrolled, theme.colors],
        );

        return (
            <View style={styles.container}>
                <Icon
                    size={24}
                    iconStyle="solid"
                    name="chevron-left"
                    color={leftArrowColor}
                    style={styles.arrowBtn}
                    onPress={handleLeftArrow}
                />

                <FlatList
                    ref={ref}
                    horizontal
                    data={safeData}
                    style={{ flexGrow: 0 }}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onEndReachedThreshold={0.1}
                    onEndReached={handleEndReached}
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.contentContainer}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    keyExtractor={(item, i) => String(item?.id ?? item?.name ?? i)}
                    initialScrollIndex={safeData.length ? Math.min(index, safeData.length - 1) : undefined}
                    renderItem={({ item }) => (
                        <Item
                            item={item}
                            disabled={disabled}
                            handleItem={handleItem}
                            handleIndex={handleIndex}
                            isActive={item?.name === activeItem?.name}
                        />
                    )}
                />

                <Icon
                    size={24}
                    iconStyle="solid"
                    name="chevron-right"
                    color={rightArrowColor}
                    onPress={handleRightArrow}
                    style={[styles.arrowBtn, { marginLeft: 'auto' }]}
                />
            </View>
        );
    },
);

export default HorizontalMenu;

interface ItemProps {
  item: MenuItem;
  isActive: boolean;
  disabled: boolean;
  handleIndex: (item: MenuItem) => void;
  handleItem: (payload: { activeItem: MenuItem }) => void;
}

const Item: React.FC<ItemProps> = memo(({ item, isActive, handleItem, handleIndex, disabled }) => {
    const theme = useTheme();
    const handlePress = useCallback(() => {
        handleItem({ activeItem: item });
        handleIndex(item);
    }, [handleItem, item, handleIndex]);

    return (
        <PressableScale
            haptic="selection"
            disabled={disabled}
            onPress={handlePress}
            style={[styles.item, isActive && styles.activeItem]}
        >
            <Text
                style={styles.text}
                color={isActive ? COLORS.GREEN : theme.colors.text}
            >
                {item?.name}
            </Text>
        </PressableScale>
    );
});

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    arrowBtn: {
        paddingHorizontal: 10,
        paddingVertical: 15,
    },
    contentContainer: {
        padding: 10,
    },
    item: {
        paddingVertical: 5,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    activeItem: {
        borderWidth: 1,
        borderRadius: 25,
        borderColor: COLORS.GREEN,
    },
    text: {
        fontSize: 14,
        fontWeight: '500',
    },
    textActive: {
        color: COLORS.GREEN,
    },
});
