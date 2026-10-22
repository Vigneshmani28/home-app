import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, { Easing, FadeIn, FadeInDown, FadeInUp, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { neutral, primary } from '@/theme/colors';

const INITIAL_SCALE_FACTOR = Dimensions.get('screen').height / 90;
const DURATION = 600;

// Splash: must match the native splash (see the expo-splash-screen plugin in app.json) exactly —
// same background colour, same centred logo at the same width — so handing over is seamless.
const SPLASH_BACKGROUND = '#FFFFFF';
const SPLASH_LOGO_WIDTH = 200;
const SPLASH_LOGO_HEIGHT = Math.round((SPLASH_LOGO_WIDTH * 667) / 2028);
const SPLASH_EXIT_MS = 2200;
const SCREEN_WIDTH = Dimensions.get('screen').width;
const ILLUSTRATION_WIDTH = Math.min(SCREEN_WIDTH * 0.9, 420);

// Hold while the scene plays in, then fade the whole screen out.
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
        style={styles.splashLogo}
        source={require('@/assets/images/splash-logo.png')}
        contentFit="contain"
        accessibilityLabel="Rebix"
      />
      {/* Everything below only appears once the native splash is gone, so the first frame matches it exactly. */}
      {animate ? (
        <>
          <Animated.View entering={FadeIn.duration(900)} style={styles.sceneGlow} pointerEvents="none">
            <LinearGradient colors={['rgba(234,246,240,0)', primary[50], primary[100]]} style={StyleSheet.absoluteFill} />
          </Animated.View>
          <Animated.Text entering={FadeInDown.delay(350).duration(600)} style={styles.tagline}>
            Construction Materials Marketplace
          </Animated.Text>
          <Animated.View entering={FadeInUp.delay(250).duration(800)} style={styles.illustrationWrap} pointerEvents="none">
            <Image
              source={require('@/assets/home/explore_more.webp')}
              style={styles.illustration}
              contentFit="contain"
              accessibilityIgnoresInvertColors
            />
          </Animated.View>
        </>
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
  sceneGlow: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
  },
  // Sits just under the (exactly centred) logo, so the logo never moves between native and JS splash.
  tagline: {
    position: 'absolute',
    top: '50%',
    marginTop: SPLASH_LOGO_HEIGHT / 2 + 14,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.6,
    color: neutral[500],
  },
  illustrationWrap: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  illustration: {
    width: ILLUSTRATION_WIDTH,
    height: ILLUSTRATION_WIDTH / 1.5,
  },
  splashLogo: {
    width: SPLASH_LOGO_WIDTH,
    height: SPLASH_LOGO_HEIGHT,
  },
});
