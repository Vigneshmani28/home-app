import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { neutral, primary } from '@/theme/colors';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: primary[500],
        tabBarInactiveTintColor: neutral[400],
        // Kill Android's ripple / press bubble
        tabBarButton: ({ ref: _ref, ...props }) => (
          <Pressable {...props} android_ripple={undefined} />
        ),
        tabBarStyle: {
          height: 60 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          backgroundColor: '#FFFFFF',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} color={color} size={24} />
          ),
        }}
      />

      {/* Sell: a filled rounded-square action inside the bar, no overflow */}
      <Tabs.Screen
        name="sell"
        options={{
          title: 'Sell',
          tabBarIcon: ({ focused }) => (
            <View style={[styles.sellButton, focused && styles.sellButtonFocused]}>
              <Ionicons name="add" color="#FFFFFF" size={24} />
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.sellLabel, !focused && styles.sellLabelIdle]}>Sell</Text>
          ),
        }}
      />

      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={24} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={24} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  sellButton: {
    width: 44,
    height: 32,
    borderRadius: 12,
    backgroundColor: primary[400],
    alignItems: 'center',
    justifyContent: 'center',
  },
  sellButtonFocused: {
    backgroundColor: primary[500],
  },
  sellLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    color: primary[500],
  },
  sellLabelIdle: {
    color: primary[400],
  },
});
