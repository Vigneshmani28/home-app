import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  Dimensions,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { neutral, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { getPublicImageUrl } from '../services';
import { ListingImageViewer } from './listing-image-viewer';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ListingImageGalleryProps {
  storagePaths: string[];
}

/** Swipeable, paged image gallery for the listing detail screen, with a photo counter and dots. */
export function ListingImageGallery({ storagePaths }: ListingImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerVisible, setViewerVisible] = useState(false);

  if (storagePaths.length === 0) {
    return (
      <View style={[styles.image, styles.placeholder]}>
        <Ionicons name="image-outline" size={56} color={neutral[300]} />
        <Text style={styles.placeholderText}>No photos added</Text>
      </View>
    );
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  return (
    <View>
      <FlatList
        data={storagePaths}
        keyExtractor={(path) => path}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => setViewerVisible(true)}
            accessibilityRole="imagebutton"
            accessibilityLabel="View photo full screen">
            <Image source={{ uri: getPublicImageUrl(item) }} style={styles.image} contentFit="cover" transition={150} />
          </Pressable>
        )}
      />
      {/* Soft fades so the overlay buttons and the dots stay readable on any photo. */}
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.35)', 'transparent']}
        style={styles.topFade}
      />
      {storagePaths.length > 1 ? (
        <>
          <View style={styles.counter}>
            <Ionicons name="images-outline" size={13} color="#FFFFFF" />
            <Text style={styles.counterText}>
              {activeIndex + 1}/{storagePaths.length}
            </Text>
          </View>
          <View style={styles.dots}>
            {storagePaths.map((path, index) => (
              <View key={path} style={[styles.dot, index === activeIndex && styles.dotActive]} />
            ))}
          </View>
        </>
      ) : null}
      <View style={styles.zoomHint} pointerEvents="none">
        <Ionicons name="expand-outline" size={13} color="#FFFFFF" />
      </View>
      <ListingImageViewer
        visible={viewerVisible}
        storagePaths={storagePaths}
        initialIndex={activeIndex}
        onClose={() => setViewerVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: SCREEN_WIDTH,
    aspectRatio: 1,
  },
  placeholder: {
    backgroundColor: secondary[400],
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  placeholderText: {
    fontSize: 13,
    color: neutral[400],
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 110,
  },
  zoomHint: {
    position: 'absolute',
    left: spacing.md,
    bottom: 40,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counter: {
    position: 'absolute',
    right: spacing.md,
    bottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  counterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  dots: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 18,
    backgroundColor: '#FFFFFF',
  },
});
