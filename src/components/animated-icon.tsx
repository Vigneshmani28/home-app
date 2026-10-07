import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeInDown, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { primary } from '@/theme/colors';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

// Splash: must match the native splash (see the expo-splash-screen plugin in app.json) exactly —
// same background colour, same centred artwork at the same width — so handing over is seamless.
const SPLASH_BACKGROUND = primary[500];
const SPLASH_ART_WIDTH = 220;
const SPLASH_ART_HEIGHT = Math.round((SPLASH_ART_WIDTH * 451) / 900);
const SPLASH_EXIT_MS = 1500;

// Hold on the artwork while the tagline appears, then fade the whole screen out.
const splashExit = new Keyframe({
  0: { opacity: 1, transform: [{ scale: 1 }] },
  60: { opacity: 1, transform: [{ scale: 1 }] },
  100: { opacity: 0, transform: [{ scale: 1.06 }], easing: Easing.out(Easing.cubic) },
});

export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const content = (
    <>
      <Image
        style={styles.splashArt}
        source={require('@/assets/images/splash-slogan.png')}
        contentFit="contain"
        accessibilityLabel="Build. Recycle. Save more."
      />
      {animate ? (
        <Animated.Text entering={FadeInDown.delay(250).duration(500)} style={styles.splashName}>
          Rebix
        </Animated.Text>
      ) : null}
    </>
  );

  return animate ? (
    <Animated.View
      entering={splashExit.duration(SPLASH_EXIT_MS).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {content}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {content}
    </View>
  );
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: INITIAL_SCALE_FACTOR }],
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
  },
  40: {
    transform: [{ scale: 1.3 }],
    opacity: 0,
    easing: Easing.elastic(0.7),
  },
  100: {
    opacity: 1,
    transform: [{ scale: 1 }],
    easing: Easing.elastic(0.7),
  },
});

const glowKeyframe = new Keyframe({
  0: {
    transform: [{ rotateZ: '0deg' }],
  },
  100: {
    transform: [{ rotateZ: '7200deg' }],
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View entering={glowKeyframe.duration(60 * 1000 * 4)} style={styles.glow}>
        <Image style={styles.glow} source={require('@/assets/images/logo-glow.png')} />
      </Animated.View>

      <Animated.View entering={keyframe.duration(DURATION)} style={styles.background} />
      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/expo-logo.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    width: 201,
    height: 201,
    position: 'absolute',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
    zIndex: 100,
  },
  image: {
    width: 76,
    height: 71,
  },
  background: {
    borderRadius: 40,
    experimental_backgroundImage: `linear-gradient(180deg, #3C9FFE, #0274DF)`,
    width: 128,
    height: 128,
    position: 'absolute',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: SPLASH_BACKGROUND,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  splashArt: {
    width: SPLASH_ART_WIDTH,
    height: SPLASH_ART_HEIGHT,
  },
  splashName: {
    position: 'absolute',
    bottom: 72,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    color: primary[100],
  },
});
