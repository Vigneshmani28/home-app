import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router, useNavigation } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  HelperText,
  ProgressBar,
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { SelectField, TextField } from '@/components/forms';
import { ConfirmDialog } from '@/components/feedback';
import { ScreenHeader } from '@/components/layout';
import { ActionButton } from '@/components/ui';
import { ThemedText } from '@/components/themed-text';
import { isTamilNaduDistrict } from '@/constants/tamil-nadu-districts';
import { DistrictPickerModal } from '@/features/district/components';
import { detectDistrictFromDevice } from '@/features/district/services';
import { useCategories } from '@/features/categories/hooks';
import { accent, neutral, primary } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatPrice, formatQuantity } from '@/utils/format';

import { listingSchema, MIN_PRICE, type ListingFormValues } from '../schemas';
import { getPublicImageUrl } from '../services';
import { CategoryPickerSheet } from './category-picker-sheet';

const MAX_IMAGES = 5;

export interface ListingFormImage {
  /** listing_images.id when this is an already-uploaded image, undefined for a newly picked local image. */
  id?: string;
  /** Local file uri (newly picked) or storage_path (existing, resolved to a public URL for display). */
  uri: string;
  isExisting: boolean;
}

interface ListingFormProps {
  defaultValues?: Partial<ListingFormValues>;
  initialImages?: ListingFormImage[];
  onSubmit: (values: ListingFormValues, images: ListingFormImage[]) => Promise<void> | void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submitError?: string | null;
  /** Header title shown above the stepper. Defaults to "Post a Listing". */
  title?: string;
  /** The seller's saved profile phone; decides which hint the contact number field shows. */
  profilePhone?: string | null;
}

const CONDITION_OPTIONS = [
  { value: 'unused', label: 'Unused' },
  { value: 'like_new', label: 'Like New' },
  { value: 'good', label: 'Good' },
  { value: 'used', label: 'Used' },
];

const CONDITION_LABELS: Record<string, string> = {
  unused: 'Unused',
  like_new: 'Like New',
  good: 'Good',
  used: 'Used',
};

const PHOTO_TIPS = ['Show the actual material', 'Use good lighting', 'No blurry images'];

const DEFAULT_VALUES: ListingFormValues = {
  categoryId: '',
  materialName: '',
  title: '',
  description: '',
  quantity: 0,
  unit: '',
  price: 0,
  originalPrice: null,
  condition: 'good',
  brand: '',
  manufactureDate: '',
  expiryDate: '',
  district: '',
  locality: '',
  pincode: '',
  contactPhone: '',
  pickupAvailable: true,
  deliveryAvailable: false,
};

type StepKey = 'photos' | 'details' | 'pricing' | 'location' | 'review';

interface StepConfig {
  key: StepKey;
  label: string;
  title: string;
  subtitle: string;
  fields: (keyof ListingFormValues)[];
}

const STEPS: StepConfig[] = [
  {
    key: 'photos',
    label: 'Photos',
    title: 'Add photos',
    subtitle: `Add up to ${MAX_IMAGES} photos. The first one becomes your cover image.`,
    fields: [],
  },
  {
    key: 'details',
    label: 'Details',
    title: 'Item details',
    subtitle: 'Tell buyers what you are selling.',
    fields: ['categoryId', 'materialName', 'title', 'description'],
  },
  {
    key: 'pricing',
    label: 'Pricing',
    title: 'Quantity & price',
    subtitle: 'How much do you have, and what is the total price for all of it?',
    fields: ['quantity', 'unit', 'price', 'originalPrice'],
  },
  {
    key: 'location',
    label: 'Location',
    title: 'Location & contact',
    subtitle: 'Where is it, and how should buyers reach you?',
    fields: ['district', 'locality', 'pincode', 'contactPhone'],
  },
  {
    key: 'review',
    label: 'Review',
    title: 'Review & post',
    subtitle: 'Double-check everything looks right before posting.',
    fields: [],
  },
];

export function ListingForm({
  defaultValues,
  initialImages = [],
  onSubmit,
  isSubmitting,
  submitLabel = 'Post Listing',
  submitError,
  title = 'Post a Listing',
  profilePhone,
}: ListingFormProps) {
  const { data: categories } = useCategories();
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [categoryPickerVisible, setCategoryPickerVisible] = useState(false);
  const [images, setImages] = useState<ListingFormImage[]>(initialImages);
  // Tracks which image tiles are still decoding/loading, keyed by uri, so we can
  // show a loading overlay — large photos picked from the library can take a
  // noticeable moment to decode and render as a thumbnail.
  const [loadedImageUris, setLoadedImageUris] = useState<Record<string, boolean>>({});
  // True while the native picker is processing the selection (permission prompt,
  // picker UI, and — for large photos — the compression that happens before
  // launchImageLibraryAsync resolves). Without this, tapping "Add Photo" and
  // picking a few high-resolution shots can leave the screen looking frozen
  // for a couple of seconds before any tile appears.
  const [isPickingImages, setIsPickingImages] = useState(false);
  const [districtPickerVisible, setDistrictPickerVisible] = useState(false);
  const [step, setStep] = useState(0);

  const {
    control,
    handleSubmit,
    trigger,
    setValue,
    getValues,
    formState: { errors, isDirty },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    mode: 'onTouched',
  });

  // The sell screen stays mounted, and the district / profile phone can resolve after the form first
  // renders. Fill them in once they arrive — but only into fields the user hasn't touched or filled.
  const defaultDistrict = defaultValues?.district;
  const defaultContactPhone = defaultValues?.contactPhone;
  useEffect(() => {
    if (defaultDistrict && !getValues('district')) setValue('district', defaultDistrict);
  }, [defaultDistrict, getValues, setValue]);
  useEffect(() => {
    if (defaultContactPhone && !getValues('contactPhone')) setValue('contactPhone', defaultContactPhone);
  }, [defaultContactPhone, getValues, setValue]);

  // Read (not watch) the values: watch() re-rendered this whole form on every keystroke.
  // They're only needed for the review step, which renders after a step change anyway.
  const values = getValues();
  const selectedCategory = categories?.find((c) => c.id === values.categoryId);

  const tileGap = spacing.sm;
  const tileSize = (width - spacing.lg * 2 - tileGap * 2) / 3;

  const pickImages = async () => {
    if (images.length >= MAX_IMAGES || isPickingImages) return;
    setIsPickingImages(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
        selectionLimit: MAX_IMAGES - images.length,
      });

      if (result.canceled) return;
      const picked = result.assets.slice(0, MAX_IMAGES - images.length).map((asset) => ({
        uri: asset.uri,
        isExisting: false,
      }));
      // Explicitly mark newly picked images as not-yet-loaded so their tile shows
      // a loading overlay immediately, before the <Image> even mounts.
      setLoadedImageUris((prev) => {
        const next = { ...prev };
        for (const image of picked) next[image.uri] = false;
        return next;
      });
      setImages((prev) => [...prev, ...picked]);
    } finally {
      setIsPickingImages(false);
    }
  };

  const markImageLoaded = (uri: string) => {
    setLoadedImageUris((prev) => (prev[uri] ? prev : { ...prev, [uri]: true }));
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = handleSubmit(async (formValues) => {
    await onSubmit(formValues, images);
  });

  const scrollToTop = () => scrollRef.current?.scrollTo({ y: 0, animated: false });

  const goToStep = (index: number) => {
    setStep(index);
    scrollToTop();
  };

  const goNext = async () => {
    const current = STEPS[step];
    if (current.fields.length > 0) {
      const valid = await trigger(current.fields);
      if (!valid) return;
    }
    if (step < STEPS.length - 1) {
      goToStep(step + 1);
    }
  };

  const goBack = () => {
    if (step > 0) {
      goToStep(step - 1);
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  // --- Leaving with unsaved work ---------------------------------------------------------------
  // Anything that would close this screen from JS (header back, Android back, links) is held while the user has entered something, and they are asked before it is thrown away.
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isEditing = !!defaultValues?.title;
  const imagesChanged = images.length !== initialImages.length || images.some((image) => !image.isExisting);
  const hasUnsavedChanges = isDirty || imagesChanged;
  const guardRef = useRef({ hasUnsavedChanges: false, isSubmitting: false, allowLeave: false });
  useEffect(() => {
    guardRef.current.hasUnsavedChanges = hasUnsavedChanges;
    guardRef.current.isSubmitting = !!isSubmitting;
  }, [hasUnsavedChanges, isSubmitting]);

  // iOS's edge-swipe back is handled natively and can't be intercepted (the screen would close natively
  // while staying in JS state). So while there is unsaved work the swipe is switched off; the back
  // button, which does ask first, still works.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !hasUnsavedChanges });
  }, [navigation, hasUnsavedChanges]);
  const pendingAction = useRef<Parameters<typeof navigation.dispatch>[0] | null>(null);
  const [discardVisible, setDiscardVisible] = useState(false);

  useEffect(() => {
    return navigation.addListener('beforeRemove', (event) => {
      const guard = guardRef.current;
      // A successful post/save navigates away while isSubmitting is still true — that must go through.
      if (guard.allowLeave || guard.isSubmitting || !guard.hasUnsavedChanges) return;
      event.preventDefault();
      pendingAction.current = event.data.action;
      setDiscardVisible(true);
    });
  }, [navigation]);

  const confirmDiscard = () => {
    guardRef.current.allowLeave = true;
    setDiscardVisible(false);
    if (pendingAction.current) navigation.dispatch(pendingAction.current);
  };

  // Android's back button steps back through the form first, and only leaves from the first step.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (step > 0) {
        goToStep(step - 1);
        return true;
      }
      return false;
    });
    return () => subscription.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const isLastStep = step === STEPS.length - 1;
  const canGoBackFromFirstStep = step === 0 && router.canGoBack();

  return (
    <SafeAreaView style={styles.safeArea} edges={[]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}>
        <ScreenHeader
          title={title}
          subtitle={`Step ${step + 1} of ${STEPS.length} · ${STEPS[step].label}`}
          showBack={step > 0 || canGoBackFromFirstStep}
          onBack={goBack}
        />

        <ProgressBar progress={(step + 1) / STEPS.length} color={primary[500]} style={styles.progressBar} />

        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.stepTitle}>{STEPS[step].title}</ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.stepSubtitle}>
            {STEPS[step].subtitle}
          </ThemedText>

          {step === 0 ? (
            <>
            <View style={styles.imageGrid}>
              {images.map((image, index) => {
                const isLoaded = loadedImageUris[image.uri] === true;
                return (
                  <View
                    key={image.id ?? image.uri}
                    style={[styles.imageTile, { width: tileSize, height: tileSize }]}>
                    <Image
                      source={{ uri: image.isExisting ? getPublicImageUrl(image.uri) : image.uri }}
                      style={styles.imageTileImg}
                      contentFit="cover"
                      transition={150}
                      onLoadStart={() => setLoadedImageUris((prev) => ({ ...prev, [image.uri]: false }))}
                      onLoad={() => markImageLoaded(image.uri)}
                      onError={() => markImageLoaded(image.uri)}
                    />
                    {!isLoaded ? (
                      <View style={styles.imageLoadingOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      </View>
                    ) : null}
                    {index === 0 ? (
                      <View style={styles.coverBadge}>
                        <ThemedText style={styles.coverBadgeText}>Cover</ThemedText>
                      </View>
                    ) : null}
                    <TouchableOpacity style={styles.imageRemove} onPress={() => removeImage(index)}>
                      <Ionicons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                );
              })}
              {images.length < MAX_IMAGES ? (
                <TouchableOpacity
                  style={[styles.imageAdd, { width: tileSize, height: tileSize }]}
                  onPress={pickImages}
                  disabled={isPickingImages}
                  activeOpacity={0.7}>
                  {isPickingImages ? (
                    <>
                      <ActivityIndicator size="small" color={primary[500]} />
                      <ThemedText type="small" style={styles.imageAddText}>
                        Adding…
                      </ThemedText>
                    </>
                  ) : (
                    <>
                      <Ionicons name="camera-outline" size={26} color={primary[500]} />
                      <ThemedText type="small" style={styles.imageAddText}>
                        Add Photo
                      </ThemedText>
                    </>
                  )}
                </TouchableOpacity>
              ) : null}
            </View>

            <View style={styles.photoTips}>
              <View style={styles.photoTipsHeader}>
                <View style={styles.photoTipsIcon}>
                  <Ionicons name="bulb-outline" size={18} color={primary[600]} />
                </View>
                <Text style={styles.photoTipsTitle}>Use clear photos to get more responses</Text>
              </View>
              {PHOTO_TIPS.map((tip) => (
                <View key={tip} style={styles.photoTip}>
                  <Ionicons name="checkmark-circle" size={16} color={primary[400]} />
                  <Text style={styles.photoTipText}>{tip}</Text>
                </View>
              ))}
            </View>
            </>
          ) : null}

          {step === 1 ? (
            <>
              {/* Compact on purpose: every field fits on one screen without scrolling. */}
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { value } }) => (
                  <SelectField
                    label="Category"
                    placeholder="Select a category"
                    value={categories?.find((category) => category.id === value)?.name}
                    error={errors.categoryId?.message}
                    onPress={() => setCategoryPickerVisible(true)}
                    containerStyle={styles.compactField}
                  />
                )}
              />

              <View style={styles.row}>
                <Field style={styles.flex1}>
                  <Controller
                    control={control}
                    name="materialName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Material name"
                        placeholder="e.g. Cement"
                        containerStyle={styles.noMargin}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.materialName?.message}
                      />
                    )}
                  />
                </Field>
                <Field style={styles.flex1}>
                  <Controller
                    control={control}
                    name="brand"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Brand (optional)"
                        placeholder="e.g. UltraTech"
                        containerStyle={styles.noMargin}
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.brand?.message}
                      />
                    )}
                  />
                </Field>
              </View>

              <Field>
                <Controller
                  control={control}
                  name="title"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Listing title"
                      placeholder="e.g. 50 bags of UltraTech cement"
                      containerStyle={styles.noMargin}
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.title?.message}
                    />
                  )}
                />
              </Field>

              <View style={styles.compactField}>
                <Text style={styles.compactLabel}>Condition</Text>
                <Controller
                  control={control}
                  name="condition"
                  render={({ field: { onChange, value } }) => (
                    <SegmentedButtons value={value} onValueChange={onChange} buttons={CONDITION_OPTIONS}
                      density="small"
                      theme={{ colors: { secondaryContainer: primary[50], onSecondaryContainer: primary[700] } }}
                    />
                  )}
                />
              </View>

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Description (optional)"
                    placeholder="Add details buyers should know"
                    containerStyle={styles.noMargin}
                    multiline
                    multilineMinHeight={84}
                    value={value ?? ''}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    error={errors.description?.message}
                  />
                )}
              />

              <CategoryPickerSheet
                visible={categoryPickerVisible}
                selectedId={getValues('categoryId') || null}
                onSelect={(category) => setValue('categoryId', category.id, { shouldValidate: true, shouldDirty: true })}
                onClose={() => setCategoryPickerVisible(false)}
              />
            </>
          ) : null}

          {step === 2 ? (
            <>
              <Card>
                <View style={styles.row}>
                  <Field style={styles.flex1}>
                    <Controller
                      control={control}
                      name="quantity"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Quantity"
                          placeholder="0"
                          containerStyle={styles.noMargin}
                          keyboardType="numeric"
                          value={value ? value.toString() : ''}
                          onChangeText={(text) => onChange(text === '' ? 0 : Number(text))}
                          onBlur={onBlur}
                          error={errors.quantity?.message}
                        />
                      )}
                    />
                  </Field>
                  <Field style={styles.flex1} last>
                    <Controller
                      control={control}
                      name="unit"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Unit (bags, tons)"
                          placeholder="bags, tons, pcs"
                          containerStyle={styles.noMargin}
                          value={value}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.unit?.message}
                        />
                      )}
                    />
                  </Field>
                </View>
              </Card>

              <Card>
                <FieldLabel>Price</FieldLabel>
                <Field>
                  <Controller
                    control={control}
                    name="price"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Total price"
                        placeholder={`Minimum ${MIN_PRICE}`}
                        hint={
                          values.quantity > 0 && values.unit
                            ? `For all ${formatQuantity(values.quantity, values.unit)} together, not per ${values.unit}.`
                            : 'The price for your whole quantity together, not per unit.'
                        }
                        containerStyle={styles.noMargin}
                        keyboardType="numeric"
                        prefix="₹"
                        value={value ? value.toString() : ''}
                        onChangeText={(text) => onChange(text === '' ? 0 : Number(text))}
                        onBlur={onBlur}
                        error={errors.price?.message}
                      />
                    )}
                  />
                </Field>
                <Field last>
                  <Controller
                    control={control}
                    name="originalPrice"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Original total price (optional)"
                        placeholder="What it cost new, for the same quantity"
                        containerStyle={styles.noMargin}
                        keyboardType="numeric"
                        prefix="₹"
                        value={value ? value.toString() : ''}
                        onChangeText={(text) => onChange(text === '' ? null : Number(text))}
                        onBlur={onBlur}
                        error={errors.originalPrice?.message}
                      />
                    )}
                  />
                </Field>
              </Card>

              <Card>
                <FieldLabel>Dates (optional)</FieldLabel>
                <View style={styles.row}>
                  <Field style={styles.flex1}>
                    <Controller
                      control={control}
                      name="manufactureDate"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Manufactured"
                          placeholder="YYYY-MM-DD"
                          containerStyle={styles.noMargin}
                          value={value ?? ''}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.manufactureDate?.message}
                        />
                      )}
                    />
                  </Field>
                  <Field style={styles.flex1} last>
                    <Controller
                      control={control}
                      name="expiryDate"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Expires"
                          placeholder="YYYY-MM-DD"
                          containerStyle={styles.noMargin}
                          value={value ?? ''}
                          onChangeText={onChange}
                          onBlur={onBlur}
                          error={errors.expiryDate?.message}
                        />
                      )}
                    />
                  </Field>
                </View>
              </Card>
            </>
          ) : null}

          {step === 3 ? (
            <>
              <Card>
                <Field>
                  <Controller
                    control={control}
                    name="district"
                    render={({ field: { value } }) => (
                      <>
                        <SelectField
                          label="District"
                          placeholder="Select your district"
                          leftIcon="location-outline"
                          value={value}
                          error={errors.district?.message}
                          onPress={() => setDistrictPickerVisible(true)}
                          containerStyle={styles.noMargin}
                        />
                        <DistrictPickerModal
                          visible={districtPickerVisible}
                          onDismiss={() => setDistrictPickerVisible(false)}
                          selected={isTamilNaduDistrict(value) ? value : null}
                          title="Where is it located?"
                          allowAll={false}
                          onSelect={(next) =>
                            setValue('district', next ?? '', { shouldDirty: true, shouldValidate: true })
                          }
                          onDetectLocation={async () => {
                            const result = await detectDistrictFromDevice();
                            if (result.ok) {
                              setValue('district', result.district, { shouldDirty: true, shouldValidate: true });
                            }
                            return result;
                          }}
                        />
                      </>
                    )}
                  />
                </Field>

                <Field>
                  <Controller
                    control={control}
                    name="locality"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Locality / area"
                        placeholder="e.g. Anna Nagar"
                        containerStyle={styles.noMargin}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.locality?.message}
                      />
                    )}
                  />
                </Field>

                <Field last>
                  <Controller
                    control={control}
                    name="pincode"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Pincode (optional)"
                        placeholder="6-digit pincode"
                        containerStyle={styles.noMargin}
                        keyboardType="numeric"
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.pincode?.message}
                      />
                    )}
                  />
                </Field>
              </Card>

              <Card>
                <FieldLabel>Contact number</FieldLabel>
                <Controller
                  control={control}
                  name="contactPhone"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <TextField
                      label="Phone / WhatsApp number"
                      placeholder="10-digit mobile number"
                      leftIcon="call-outline"
                      keyboardType="phone-pad"
                      autoComplete="tel"
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      error={errors.contactPhone?.message}
                      hint={"Buyers call or WhatsApp you on this number"}
                      containerStyle={styles.noMargin}
                    />
                  )}
                />
              </Card>

              <Card>
                <FieldLabel>Delivery options</FieldLabel>
                <View style={styles.toggleCard}>
                  <View style={styles.toggleIconWrap}>
                    <Ionicons name="bicycle-outline" size={20} color={primary[500]} />
                  </View>
                  <View style={styles.toggleTextWrap}>
                    <ThemedText type="smallBold">Pickup available</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      Buyers can collect this from your location
                    </ThemedText>
                  </View>
                  <Controller
                    control={control}
                    name="pickupAvailable"
                    render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} />}
                  />
                </View>
                <View style={[styles.toggleCard, styles.toggleCardLast]}>
                  <View style={styles.toggleIconWrap}>
                    <Ionicons name="cube-outline" size={20} color={accent[500]} />
                  </View>
                  <View style={styles.toggleTextWrap}>
                    <ThemedText type="smallBold">Delivery available</ThemedText>
                    <ThemedText type="small" themeColor="textSecondary">
                      You can arrange delivery to the buyer
                    </ThemedText>
                  </View>
                  <Controller
                    control={control}
                    name="deliveryAvailable"
                    render={({ field: { onChange, value } }) => <Switch value={value} onValueChange={onChange} />}
                  />
                </View>
              </Card>
            </>
          ) : null}

          {step === 4 ? (
            <>
              <ReviewSection title="Photos" onEdit={() => goToStep(0)}>
                {images.length > 0 ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImageRow}>
                    {images.map((image) => (
                      <Image
                        key={image.id ?? image.uri}
                        source={{ uri: image.isExisting ? getPublicImageUrl(image.uri) : image.uri }}
                        style={styles.reviewImageThumb}
                      />
                    ))}
                  </ScrollView>
                ) : (
                  <ThemedText type="small" themeColor="textSecondary">
                    No photos added yet
                  </ThemedText>
                )}
              </ReviewSection>

              <ReviewSection title="Item details" onEdit={() => goToStep(1)}>
                <ReviewRow label="Category" value={selectedCategory?.name ?? '—'} />
                <ReviewRow label="Material" value={values.materialName} />
                <ReviewRow label="Title" value={values.title} />
                <ReviewRow label="Condition" value={CONDITION_LABELS[values.condition] ?? values.condition} />
                {values.brand ? <ReviewRow label="Brand" value={values.brand} /> : null}
                {values.description ? <ReviewRow label="Description" value={values.description} /> : null}
              </ReviewSection>

              <ReviewSection title="Quantity & price" onEdit={() => goToStep(2)}>
                <ReviewRow label="Quantity" value={formatQuantity(values.quantity, values.unit) || '—'} />
                <ReviewRow label="Total price" value={formatPrice(values.price)} />
                {values.originalPrice ? (
                  <ReviewRow label="Original total price" value={formatPrice(values.originalPrice)} />
                ) : null}
              </ReviewSection>

              <ReviewSection title="Location" onEdit={() => goToStep(3)}>
                <ReviewRow label="District" value={values.district} />
                <ReviewRow label="Locality" value={values.locality} />
                <ReviewRow label="Contact" value={values.contactPhone} />
                {values.pincode ? <ReviewRow label="Pincode" value={values.pincode} /> : null}
                <ReviewRow
                  label="Options"
                  value={
                    [values.pickupAvailable && 'Pickup', values.deliveryAvailable && 'Delivery']
                      .filter(Boolean)
                      .join(' · ') || 'None selected'
                  }
                />
              </ReviewSection>
            </>
          ) : null}

          {submitError && isLastStep ? (
            <HelperText type="error" visible style={styles.formError}>
              {submitError}
            </HelperText>
          ) : null}
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm }]}>
          <View style={styles.footerButtons}>
            {step > 0 ? (
              <View style={styles.footerBackButton}>
                <ActionButton label="Back" icon="arrow-back" variant="secondary" onPress={goBack} />
              </View>
            ) : null}
            <View style={styles.footerNextButton}>
              {!isLastStep ? (
                <ActionButton label="Continue" onPress={goNext} />
              ) : (
                <ActionButton label={submitLabel} onPress={submit} loading={isSubmitting} disabled={isSubmitting} />
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      <ConfirmDialog
        visible={discardVisible}
        onDismiss={() => setDiscardVisible(false)}
        tone="danger"
        icon="trash-outline"
        title={isEditing ? 'Discard your changes?' : 'Discard this listing?'}
        message={
          isEditing
            ? 'You have unsaved changes. If you leave now they will be lost.'
            : "You've started a listing that hasn't been posted. If you leave now, everything you entered, including your photos, will be lost."
        }
        confirmLabel="Discard"
        cancelLabel="Keep editing"
        onConfirm={confirmDiscard}
      />
    </SafeAreaView>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.section}>{children}</View>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <ThemedText type="smallBold" style={styles.fieldLabel}>
      {children}
    </ThemedText>
  );
}

function Field({
  children,
  style,
  last,
}: {
  children: React.ReactNode;
  style?: object;
  last?: boolean;
}) {
  return <View style={[styles.field, !last && styles.fieldSpacing, style]}>{children}</View>;
}

function ReviewSection({
  title,
  onEdit,
  children,
}: {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <TouchableOpacity style={styles.reviewEditButton} onPress={onEdit}>
          <MaterialCommunityIcons name="pencil" size={14} color={primary[500]} />
          <ThemedText type="small" style={styles.reviewEditText}>
            Edit
          </ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.reviewBody}>{children}</View>
    </View>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.reviewRow}>
      <ThemedText type="small" themeColor="textSecondary" style={styles.reviewLabel}>
        {label}
      </ThemedText>
      <ThemedText type="small" style={styles.reviewValue} numberOfLines={3}>
        {value || '—'}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.xs,
  },
  headerBack: {
    margin: 0,
  },
  headerBackSpacer: {
    width: 48,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerEyebrow: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: neutral[100],
    marginTop: spacing.md,
  },
  scrollContent: {
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    color: neutral[900],
    marginTop: spacing.sm,
  },
  stepSubtitle: {
    marginTop: 4,
    marginBottom: spacing.lg,
    fontSize: 14,
    lineHeight: 20,
  },
  // Open (card-less) group of fields, separated from the next by whitespace.
  section: {
    marginBottom: spacing.lg,
  },
  reviewCard: {
    backgroundColor: neutral[50],
    borderRadius: 18,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  fieldLabel: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '800',
    color: neutral[900],
    marginBottom: spacing.md,
  },
  field: {},
  fieldSpacing: {
    marginBottom: spacing.md,
  },
  brandField: {
    marginTop: spacing.md,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  flex1: {
    flex: 1,
  },
  noMargin: {
    marginBottom: 0,
  },
  compactField: {
    marginBottom: spacing.md,
  },
  compactLabel: {
    marginBottom: 8,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.1,
    color: neutral[700],
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  imageTile: {
    position: 'relative',
  },
  imageTileImg: {
    width: '100%',
    height: '100%',
    borderRadius: radius.lg,
    backgroundColor: neutral[200],
  },
  imageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  coverBadge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: radius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  coverBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  imageRemove: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: neutral[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTips: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: 18,
    backgroundColor: primary[50],
    borderWidth: 1,
    borderColor: primary[100],
    gap: 8,
  },
  photoTipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  photoTipsIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  photoTipsTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '800',
    color: primary[700],
  },
  photoTip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 4,
  },
  photoTipText: {
    flex: 1,
    fontSize: 13,
    color: neutral[600],
  },
  imageAdd: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: primary[200],
    backgroundColor: primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageAddText: {
    color: primary[500],
    fontWeight: '600',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: 16,
    backgroundColor: neutral[50],
  },
  toggleCardLast: {
    marginBottom: 0,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextWrap: {
    flex: 1,
    gap: 2,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  reviewEditButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewEditText: {
    color: primary[500],
    fontWeight: '600',
  },
  reviewBody: {
    gap: spacing.xs,
  },
  reviewImageRow: {
    flexDirection: 'row',
  },
  reviewImageThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    marginRight: spacing.sm,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: 3,
  },
  reviewLabel: {
    width: 100,
  },
  reviewValue: {
    flex: 1,
    textAlign: 'right',
    fontWeight: '600',
  },
  formError: {
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -4 },
    elevation: 8,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  footerBackButton: {
    flex: 1,
  },
  footerNextButton: {
    flex: 2,
  },
});
