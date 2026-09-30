import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, HelperText, Switch } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { TextField } from '@/components/forms';
import { isTamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { DistrictPickerModal } from '@/features/district/components';
import { detectDistrictFromDevice } from '@/features/district/services';
import { neutral, primary, secondary } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

import { profileSchema, type ProfileFormValues } from '../schemas';

interface ProfileFormProps {
  defaultValues?: Partial<ProfileFormValues>;
  /** Initials shown in the avatar at the top of the form. */
  initials: string;
  email?: string;
  onSubmit: (values: ProfileFormValues) => Promise<void> | void;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitError?: string | null;
}

const DEFAULT_VALUES: ProfileFormValues = {
  fullName: '',
  phone: '',
  district: '',
  locality: '',
  pincode: '',
  showPhonePublicly: false,
};

/** Full-screen edit form: avatar, sectioned cards, and a sticky Save bar (enabled once something changed). */
export function ProfileForm({
  defaultValues,
  initials,
  email,
  onSubmit,
  onCancel,
  isSubmitting,
  submitError,
}: ProfileFormProps) {
  const insets = useSafeAreaInsets();
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
  });

  const submit = handleSubmit(async (values) => {
    await onSubmit(values);
  });

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          {email ? <Text style={styles.email}>{email}</Text> : null}
        </View>

        <Text style={styles.sectionLabel}>Personal details</Text>
        <View style={styles.card}>
          <Controller
            control={control}
            name="fullName"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Full name"
                placeholder="Enter your full name"
                leftIcon="person-outline"
                autoComplete="name"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="phone"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Phone (optional)"
                placeholder="10-digit mobile number"
                leftIcon="call-outline"
                keyboardType="phone-pad"
                autoComplete="tel"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.phone?.message}
                containerStyle={styles.lastField}
              />
            )}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchIcon}>
              <Ionicons name="logo-whatsapp" size={18} color={primary[500]} />
            </View>
            <View style={styles.switchLabelWrap}>
              <Text style={styles.switchTitle}>Show my phone to buyers</Text>
              <Text style={styles.switchHint}>Buyers can WhatsApp or call you from your listings.</Text>
            </View>
            <Controller
              control={control}
              name="showPhonePublicly"
              render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} />}
            />
          </View>
        </View>

        <Text style={styles.sectionLabel}>Location</Text>
        <View style={styles.card}>
          <Controller
            control={control}
            name="district"
            render={({ field: { value } }) => (
              <>
                <Pressable onPress={() => setDistrictPickerVisible(true)} accessibilityRole="button">
                  <View pointerEvents="none">
                    <TextField
                      label="District"
                      placeholder="Select your district"
                      leftIcon="location-outline"
                      editable={false}
                      value={value ?? ''}
                      error={errors.district?.message}
                      right={<Ionicons name="chevron-down" size={20} color={neutral[400]} />}
                    />
                  </View>
                </Pressable>
                <DistrictPickerModal
                  visible={districtPickerVisible}
                  onDismiss={() => setDistrictPickerVisible(false)}
                  selected={isTamilNaduDistrict(value) ? value : null}
                  title="Your district"
                  allowAll={false}
                  onSelect={(next) => setValue('district', next ?? '', { shouldDirty: true, shouldValidate: true })}
                  onDetectLocation={async () => {
                    const result = await detectDistrictFromDevice();
                    if (result.ok) setValue('district', result.district, { shouldDirty: true, shouldValidate: true });
                    return result;
                  }}
                />
              </>
            )}
          />

          <Controller
            control={control}
            name="locality"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Locality / area (optional)"
                placeholder="e.g. Anna Nagar"
                leftIcon="navigate-outline"
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.locality?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="pincode"
            render={({ field: { onChange, onBlur, value } }) => (
              <TextField
                label="Pincode (optional)"
                placeholder="6-digit pincode"
                leftIcon="mail-open-outline"
                keyboardType="numeric"
                maxLength={6}
                value={value ?? ''}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.pincode?.message}
                containerStyle={styles.lastField}
              />
            )}
          />
        </View>

        {submitError ? (
          <HelperText type="error" visible style={styles.formError}>
            {submitError}
          </HelperText>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
        <Button
          mode="outlined"
          onPress={onCancel}
          disabled={isSubmitting}
          contentStyle={styles.buttonContent}
          style={styles.cancelButton}>
          Cancel
        </Button>
        <Button
          mode="contained"
          onPress={submit}
          loading={isSubmitting}
          disabled={isSubmitting || !isDirty}
          contentStyle={styles.buttonContent}
          style={styles.saveButton}>
          Save Changes
        </Button>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  avatarBlock: {
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: primary[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: primary[100],
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  email: {
    marginTop: spacing.sm,
    fontSize: 13,
    color: neutral[400],
  },
  sectionLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    marginLeft: spacing.xs,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: neutral[400],
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: secondary[400],
    padding: spacing.md,
  },
  lastField: {
    marginBottom: 0,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 14,
    backgroundColor: secondary[200],
  },
  switchIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  switchLabelWrap: {
    flex: 1,
  },
  switchTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: neutral[700],
  },
  switchHint: {
    marginTop: 2,
    fontSize: 12,
    color: neutral[400],
  },
  formError: {
    marginTop: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: secondary[400],
  },
  cancelButton: {
    borderRadius: 14,
  },
  saveButton: {
    flex: 1,
    borderRadius: 14,
  },
  buttonContent: {
    height: 48,
  },
});
