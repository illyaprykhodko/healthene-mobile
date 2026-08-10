
// outsource dependencies
import Icon from '@react-native-vector-icons/fontawesome5';
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, FlatList, View, LayoutChangeEvent, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

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

const EDGE_EPSILON = 10;
const SCROLL_NUMBER = 150;
// Used only when a chip has not been measured yet, so `onScrollToIndexFailed` can still land near
// the target instead of jumping back to the start.
const NOMINAL_CHIP_WIDTH = 100;

const HorizontalMenu: React.FC<HorizontalMenuProps> = memo(
    ({ data, handleItem, viewPosition = 0.5, activeItem = null, disabled = false }) => {
        const theme = useTheme();
        const ref = useRef<FlatList<MenuItem> | null>(null);
        const safeData = useMemo(() => (Array.isArray(data) ? data : []), [data]);

        const [index, setIndex] = useState(0);
        // Measured chip widths by list index — the fallback path needs real geometry, and FlatList
        // gives us none for cells it has not rendered yet.
        const chipWidthsRef = useRef(new Map<number, number>());
        // Guards the auto-scroll effect: without it, every pagination page that adds a chip re-fires
        // scrollToIndex and yanks the bar out from under the user.
        const lastScrolledIndexRef = useRef<number | null>(null);

        const handleChipLayout = useCallback((itemIndex: number, width: number) => {
            chipWidthsRef.current.set(itemIndex, width);
        }, []);

        const scrollTo = useCallback((offset: number) => {
            ref.current?.scrollToOffset?.({ offset, animated: true });
        }, []);

        const handleScrollToIndexFailed = useCallback((info: { index: number }) => {
            // Was `setIndex(0)`, which scrolled the bar back to the START whenever a far chip was
            // selected before its cell had rendered. Approximate the offset from measured widths.
            let offset = 0;
            for (let i = 0; i < info.index; i++) {
                offset += chipWidthsRef.current.get(i) ?? NOMINAL_CHIP_WIDTH;
            }
            scrollTo(Math.max(0, offset));
        }, [scrollTo]);

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
            if (lastScrolledIndexRef.current === safeIndex) { return; }
            lastScrolledIndexRef.current = safeIndex;
            ref.current?.scrollToIndex?.({ index: safeIndex, viewPosition, animated: true });
        }, [index, viewPosition, safeData.length]);

        useEffect(() => {
            if (!activeItem?.name) { return; }
            handleIndex(activeItem);
        }, [activeItem?.name, handleIndex]);

        // The live offset lives in a ref: it used to be state written on every scroll frame at
        // scrollEventThrottle 16, which re-rendered the container and, through the arrow colors,
        // every chip — 60 times a second while the bar auto-scrolled.
        const offsetRef = useRef(0);
        const contentWidthRef = useRef(0);
        const viewportWidthRef = useRef(0);
        const [canScrollLeft, setCanScrollLeft] = useState(false);
        const [canScrollRight, setCanScrollRight] = useState(false);

        // Both arrows are derived from measured geometry rather than the old `scrolled` /
        // onEndReached heuristic, which left the right arrow lit at the end of the list.
        const syncArrows = useCallback(() => {
            setCanScrollLeft(offsetRef.current > EDGE_EPSILON);
            setCanScrollRight(
                contentWidthRef.current - viewportWidthRef.current - offsetRef.current > EDGE_EPSILON,
            );
        }, []);

        const handleScroll = useCallback(
            (event: NativeSyntheticEvent<NativeScrollEvent>) => {
                const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                offsetRef.current = contentOffset.x;
                contentWidthRef.current = contentSize.width;
                viewportWidthRef.current = layoutMeasurement.width;
                syncArrows();
            },
            [syncArrows],
        );

        // Chips arriving from pagination change the content width without a scroll event.
        const handleContentSizeChange = useCallback((contentWidth: number) => {
            contentWidthRef.current = contentWidth;
            syncArrows();
        }, [syncArrows]);

        const handleListLayout = useCallback((event: LayoutChangeEvent) => {
            viewportWidthRef.current = event.nativeEvent.layout.width;
            syncArrows();
        }, [syncArrows]);

        const handleLeftArrow = useCallback(() => {
            scrollTo(offsetRef.current - SCROLL_NUMBER);
        }, [scrollTo]);

        const handleRightArrow = useCallback(() => {
            scrollTo(offsetRef.current + SCROLL_NUMBER);
        }, [scrollTo]);

        // "Hidden" arrows blend into the screen background; visible ones use secondary text.
        const leftArrowColor = canScrollLeft ? theme.colors.textSecondary : theme.colors.background;
        const rightArrowColor = canScrollRight ? theme.colors.textSecondary : theme.colors.background;

        const renderItem = useCallback(({ item, index: itemIndex }: { item: MenuItem; index: number }) => (
            <Item
                item={item}
                index={itemIndex}
                disabled={disabled}
                handleItem={handleItem}
                handleIndex={handleIndex}
                onMeasure={handleChipLayout}
                isActive={item?.name === activeItem?.name}
            />
        ), [disabled, handleItem, handleIndex, handleChipLayout, activeItem?.name]);

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
                    style={styles.list}
                    renderItem={renderItem}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onLayout={handleListLayout}
                    showsHorizontalScrollIndicator={false}
                    onContentSizeChange={handleContentSizeChange}
                    contentContainerStyle={styles.contentContainer}
                    onScrollToIndexFailed={handleScrollToIndexFailed}
                    keyExtractor={(item, i) => String(item?.id ?? item?.name ?? i)}
                    initialScrollIndex={safeData.length ? Math.min(index, safeData.length - 1) : undefined}
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
  index: number;
  item: MenuItem;
  isActive: boolean;
  disabled: boolean;
  handleIndex: (item: MenuItem) => void;
  onMeasure: (index: number, width: number) => void;
  handleItem: (payload: { activeItem: MenuItem }) => void;
}

const Item: React.FC<ItemProps> = memo(({
    item,
    index,
    isActive,
    disabled,
    onMeasure,
    handleItem,
    handleIndex,
}) => {
    const theme = useTheme();
    const handlePress = useCallback(() => {
        handleItem({ activeItem: item });
        handleIndex(item);
    }, [handleItem, item, handleIndex]);

    const handleLayout = useCallback((event: LayoutChangeEvent) => {
        onMeasure(index, event.nativeEvent.layout.width);
    }, [onMeasure, index]);

    return (
        <PressableScale
            haptic="selection"
            disabled={disabled}
            onPress={handlePress}
            onLayout={handleLayout}
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
    list: {
        flexGrow: 0,
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
