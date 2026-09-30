import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ActivityIndicator, Modal, Portal } from 'react-native-paper';

import { TAMIL_NADU_DISTRICTS, type TamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { DETECTION_FAILURE_MESSAGES, type DistrictDetectionResult } from '../services';

interface DistrictPickerModalProps {
  visible: boolean;
  onDismiss: () => void;
  selected: TamilNaduDistrict | null;
  onSelect: (district: TamilNaduDistrict | null) => void;
  /** "Use my current location": detects the district from GPS. Closes the picker on success. */
  onDetectLocation: () => Promise<DistrictDetectionResult>;
  /** Show the "All Tamil Nadu" row (browsing filters). Hide it when a specific district is required, e.g. sign-up. */
  allowAll?: boolean;
  title?: string;
}

type Row = { key: string; label: string; district: TamilNaduDistrict | null };

/** Bottom-sheet modal for choosing "All Tamil Nadu" or a specific district, with type-to-filter. */
export function DistrictPickerModal({
  visible,
  onDismiss,
  selected,
  onSelect,
  onDetectLocation,
  allowAll = true,
  title = 'Choose your area',
}: DistrictPickerModalProps) {
  const [query, setQuery] = useState('');
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);

  const close = () => {
    setQuery('');
    setDetectError(null);
    onDismiss();
  };

  const handleDetect = async () => {
    setDetecting(true);
    setDetectError(null);
    const result = await onDetectLocation();
    setDetecting(false);
    if (result.ok) {
      close();
    } else {
      setDetectError(DETECTION_FAILURE_MESSAGES[result.reason]);
    }
  };

  const rows = useMemo<Row[]>(() => {
    const all: Row = { key: '__all__', label: 'All Tamil Nadu', district: null };
    const districts: Row[] = TAMIL_NADU_DISTRICTS.map((district) => ({
      key: district,
      label: district,
      district,
    }));
    const combined = allowAll ? [all, ...districts] : districts;
    if (!query.trim()) return combined;
    const normalizedQuery = query.trim().toLowerCase();
    return combined.filter((row) => row.label.toLowerCase().includes(normalizedQuery));
  }, [query, allowAll]);

  const handleSelect = (row: Row) => {
    onSelect(row.district);
    close();
  };

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={close}
        contentContainerStyle={styles.modal}
        style={styles.overlay}>
        <View style={styles.handle} />
        <View style={styles.titleRow}>
          <Text style={styles.title}>{title}</Text>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close" hitSlop={8}>
            <Ionicons name="close" size={24} color={neutral[600]} />
          </Pressable>
        </View>

        <Pressable
          onPress={handleDetect}
          disabled={detecting}
          accessibilityRole="button"
          style={({ pressed }) => [styles.detectRow, pressed && styles.rowPressed]}>
          <View style={styles.detectIcon}>
            {detecting ? (
              <ActivityIndicator size="small" color={primary[500]} />
            ) : (
              <Ionicons name="locate" size={20} color={primary[500]} />
            )}
          </View>
          <View style={styles.detectText}>
            <Text style={styles.detectTitle}>{detecting ? 'Detecting your district…' : 'Use my current location'}</Text>
            <Text style={styles.detectHint}>We find your district from your phone&apos;s location</Text>
          </View>
        </Pressable>
        {detectError ? <Text style={styles.detectError}>{detectError}</Text> : null}

        <View style={[styles.searchBox, searchFocused && styles.searchBoxFocused]}>
          <Ionicons name="search" size={20} color={searchFocused ? primary[500] : neutral[300]} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search district"
            placeholderTextColor={neutral[300]}
            selectionColor={primary[500]}
            autoCorrect={false}
            autoCapitalize="none"
            returnKeyType="search"
            clearButtonMode="never"
            accessibilityLabel="Search district"
            style={styles.searchInput}
          />
          {query ? (
            <Pressable
              onPress={() => setQuery('')}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={20} color={neutral[300]} />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => {
            const isSelected = item.district === selected;
            return (
              <Pressable
                onPress={() => handleSelect(item)}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
                <Text style={[styles.rowLabel, isSelected && styles.rowLabelSelected]}>{item.label}</Text>
                {isSelected ? <Ionicons name="checkmark" size={18} color={primary[500]} /> : null}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No districts match &quot;{query}&quot;.</Text>
          }
        />
      </Modal>
    </Portal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    height: '80%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: secondary[500],
    marginBottom: spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: neutral[800],
  },
  detectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 16,
    backgroundColor: primary[50],
  },
  detectIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detectText: {
    flex: 1,
  },
  detectTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: primary[600],
  },
  detectHint: {
    marginTop: 2,
    fontSize: 12,
    color: neutral[400],
  },
  detectError: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: '#B3261E',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    height: 50,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 14,
    backgroundColor: secondary[200],
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  searchBoxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: primary[500],
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 16,
    color: neutral[800],
  },
  list: {
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: secondary[200],
  },
  rowPressed: {
    opacity: 0.6,
  },
  rowLabel: {
    fontSize: 15,
    color: neutral[700],
  },
  rowLabelSelected: {
    fontWeight: '700',
    color: primary[500],
  },
  emptyText: {
    paddingVertical: spacing.lg,
    textAlign: 'center',
    color: neutral[400],
  },
});
