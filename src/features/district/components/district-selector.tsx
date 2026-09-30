import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, type StyleProp, type TextStyle, type ViewStyle } from 'react-native';

import { useDistrict } from '../hooks';
import { DistrictPickerModal } from './district-picker-modal';

interface DistrictSelectorProps {
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  iconColor?: string;
}

/**
 * The app-wide district selector: shows the resolved district (or "All Tamil Nadu") and opens a
 * picker to change it. The value is shared app state, so every screen showing this stays in sync.
 */
export function DistrictSelector({ style, textStyle, iconColor = '#FFFFFF' }: DistrictSelectorProps) {
  const { district, isResolving, selectDistrict, detectFromLocation } = useDistrict();
  const [modalVisible, setModalVisible] = useState(false);

  const label = isResolving ? 'Locating…' : (district ?? 'All Tamil Nadu');

  return (
    <>
      <Pressable
        onPress={() => setModalVisible(true)}
        accessibilityRole="button"
        accessibilityLabel={`District: ${label}. Tap to change`}
        style={[styles.pill, style]}>
        <Ionicons name="location" size={14} color={iconColor} />
        <Text style={[styles.label, { color: iconColor }, textStyle]} numberOfLines={1}>
          {label}
        </Text>
        <Ionicons name="chevron-down" size={14} color={iconColor} />
      </Pressable>

      <DistrictPickerModal
        visible={modalVisible}
        onDismiss={() => setModalVisible(false)}
        selected={district}
        onSelect={selectDistrict}
        onDetectLocation={detectFromLocation}
      />
    </>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    maxWidth: 180,
  },
});
