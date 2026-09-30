import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { spacing } from '@/theme/spacing';

import { getPublicImageUrl } from '../services';

const DOUBLE_TAP_SCALE = 2.5;

interface ListingImageViewerProps {
  visible: boolean;
  storagePaths: string[];
  initialIndex: number;
  onClose: () => void;
}

/** Full-screen photo viewer: swipe between photos, double-tap to zoom, drag to move around when zoomed. */
export function ListingImageViewer({ visible, storagePaths, initialIndex, onClose }: ListingImageViewerProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [index, setIndex] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
      onShow={() => setIndex(initialIndex)}>
      <StatusBar style="light" />
      <GestureHandlerRootView style={styles.root}>
        <FlatList
          key={initialIndex}
          data={storagePaths}
          keyExtractor={(path) => path}
          horizontal
          pagingEnabled
          scrollEnabled={!zoomed}
          showsHorizontalScrollIndicator={false}
          initialScrollIndex={initialIndex}
          getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
          onMomentumScrollEnd={(event) => setIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <ZoomableImage uri={getPublicImageUrl(item)} width={width} height={height} onZoomChange={setZoomed} />
          )}
        />

        <View style={[styles.topBar, { paddingTop: insets.top + spacing.sm }]} pointerEvents="box-none">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
            style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </Pressable>
          {storagePaths.length > 1 ? (
            <View style={styles.counter}>
              <Text style={styles.counterText}>
                {index + 1} / {storagePaths.length}
              </Text>
            </View>
          ) : null}
        </View>

        {!zoomed ? (
          <Text style={[styles.hint, { bottom: insets.bottom + spacing.lg }]} pointerEvents="none">
            Double-tap to zoom
          </Text>
        ) : null}
      </GestureHandlerRootView>
    </Modal>
  );
}

function ZoomableImage({
  uri,
  width,
  height,
  onZoomChange,
}: {
  uri: string;
  width: number;
  height: number;
  onZoomChange: (zoomed: boolean) => void;
}) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const setZoom = (zoomed: boolean) => {
    setIsZoomed(zoomed);
    onZoomChange(zoomed);
  };

  // Keep the photo from being dragged past its edges (coordinates relative to the view centre).
  const clampX = (x: number, s: number) => {
    'worklet';
    const max = Math.max(0, (width * s - width) / 2);
    return Math.min(Math.max(x, -max), max);
  };
  const clampY = (y: number, s: number) => {
    'worklet';
    const max = Math.max(0, (height * s - height) / 2);
    return Math.min(Math.max(y, -max), max);
  };

  // Double-tap toggles zoom; when zooming in it centres on the tapped point.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd((event) => {
      if (scale.value > 1) {
        scale.value = withTiming(1);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        scheduleOnRN(setZoom, false);
      } else {
        const x = clampX((1 - DOUBLE_TAP_SCALE) * (event.x - width / 2), DOUBLE_TAP_SCALE);
        const y = clampY((1 - DOUBLE_TAP_SCALE) * (event.y - height / 2), DOUBLE_TAP_SCALE);
        scale.value = withTiming(DOUBLE_TAP_SCALE);
        translateX.value = withTiming(x);
        translateY.value = withTiming(y);
        scheduleOnRN(setZoom, true);
      }
    });

  // Drag only exists while zoomed in, so at 1x a swipe goes to the paging list instead.
  // Per-frame deltas keep the photo exactly where the finger leaves it.
  const pan = Gesture.Pan()
    .enabled(isZoomed)
    .minPointers(1)
    .maxPointers(1)
    .onChange((event) => {
      translateX.value = clampX(translateX.value + event.changeX, scale.value);
      translateY.value = clampY(translateY.value + event.changeY, scale.value);
    });

  const gesture = Gesture.Race(doubleTap, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { translateY: translateY.value }, { scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width, height }} collapsable={false}>
        <Animated.View style={[styles.imageWrap, animatedStyle]}>
          <Image source={{ uri }} style={styles.image} contentFit="contain" transition={150} />
        </Animated.View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  imageWrap: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  counter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  counterText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
  },
});
