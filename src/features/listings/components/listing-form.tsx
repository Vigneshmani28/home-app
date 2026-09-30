import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import {
  ActivityIndicator,
  Button,
  HelperText,
  Portal,
  ProgressBar,
  SegmentedButtons,
  Switch,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TextField } from '@/components/forms';
import { ScreenHeader } from '@/components/layout';
import { ThemedText } from '@/components/themed-text';
import { TAMIL_NADU_DISTRICTS } from '@/constants/tamil-nadu-districts';
import { useCategories } from '@/features/categories/hooks';
import type { Category } from '@/features/categories/types';
import { accent, neutral, primary, secondary } from '@/theme/colors';
import { radius, spacing } from '@/theme/spacing';
import { formatPrice, formatQuantity } from '@/utils/format';

import { listingSchema, type ListingFormValues } from '../schemas';
import { getPublicImageUrl } from '../services';

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

/** Local icon lookup for category chips — categories in the DB don't carry an icon today. */
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  'bricks-and-blocks': 'cube-outline',
  'cement-and-aggregates': 'layers-outline',
  'steel-and-metal': 'construct-outline',
  'tiles-and-flooring': 'grid-outline',
  plumbing: 'water-outline',
  electrical: 'flash-outline',
  'doors-and-windows': 'apps-outline',
  'paint-and-finishing': 'color-palette-outline',
  roofing: 'home-outline',
  'tools-and-equipment': 'build-outline',
  'other-materials': 'ellipsis-horizontal-outline',
};

function categoryIcon(slug: string | undefined): keyof typeof Ionicons.glyphMap {
  return (slug && CATEGORY_ICONS[slug]) || 'cube-outline';
}

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
    subtitle: 'Set how much you have and what it costs.',
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
  const [districtMenuOpen, setDistrictMenuOpen] = useState(false);
  const [districtDropdownLayout, setDistrictDropdownLayout] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const districtFieldRef = useRef<View>(null);
  const [step, setStep] = useState(0);

  const measureDistrictDropdown = () => {
    districtFieldRef.current?.measureInWindow((x, y, width, height) => {
      setDistrictDropdownLayout({ top: y + height + 4, left: x, width });
    });
  };

  const {
    control,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors },
  } = useForm<ListingFormValues>({
    resolver: zodResolver(listingSchema),
    defaultValues: { ...DEFAULT_VALUES, ...defaultValues },
    mode: 'onTouched',
  });

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

        <StepIndicator current={step} onPress={(i) => (i < step ? goToStep(i) : undefined)} />

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
          ) : null}

          {step === 1 ? (
            <>
              <Card>
                <FieldLabel>Category</FieldLabel>
                <View style={styles.chipGrid}>
                  <Controller
                    control={control}
                    name="categoryId"
                    render={({ field: { onChange, value } }) => (
                      <>
                        {(categories ?? []).map((category: Category) => {
                          const selected = value === category.id;
                          return (
                            <TouchableOpacity
                              key={category.id}
                              style={[styles.chip, selected && styles.chipSelected]}
                              onPress={() => onChange(category.id)}
                              activeOpacity={0.75}>
                              <Ionicons
                                name={categoryIcon(category.slug)}
                                size={16}
                                color={selected ? '#FFFFFF' : neutral[500]}
                              />
                              <ThemedText
                                type="small"
                                style={[styles.chipText, selected && styles.chipTextSelected]}
                                numberOfLines={1}>
                                {category.name}
                              </ThemedText>
                            </TouchableOpacity>
                          );
                        })}
                      </>
                    )}
                  />
                </View>
                <HelperText type="error" visible={!!errors.categoryId}>
                  {errors.categoryId?.message}
                </HelperText>
              </Card>

              <Card>
                <Field>
                  <Controller
                    control={control}
                    name="materialName"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Material name"
                        placeholder="e.g. Portland cement"
                        containerStyle={styles.noMargin}
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.materialName?.message}
                      />
                    )}
                  />
                </Field>

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

                <Field last>
                  <Controller
                    control={control}
                    name="description"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <TextField
                        label="Description (optional)"
                        placeholder="Add details buyers should know"
                        containerStyle={styles.noMargin}
                        multiline
                        value={value ?? ''}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.description?.message}
                      />
                    )}
                  />
                </Field>
              </Card>

              <Card>
                <FieldLabel>Condition</FieldLabel>
                <Controller
                  control={control}
                  name="condition"
                  render={({ field: { onChange, value } }) => (
                    <SegmentedButtons value={value} onValueChange={onChange} buttons={CONDITION_OPTIONS} />
                  )}
                />

                <Field last style={styles.brandField}>
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
              </Card>
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
                <View style={styles.row}>
                  <Field style={styles.flex1}>
                    <Controller
                      control={control}
                      name="price"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Price"
                          placeholder="0"
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
                  <Field style={styles.flex1} last>
                    <Controller
                      control={control}
                      name="originalPrice"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <TextField
                          label="Original price"
                          placeholder="0"
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
                </View>
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
                  <View ref={districtFieldRef} collapsable={false}>
                    <Controller
                      control={control}
                      name="district"
                      render={({ field: { onChange, onBlur, value } }) => {
                        const query = (value ?? '').trim().toLowerCase();
                        const filteredDistricts = query
                          ? TAMIL_NADU_DISTRICTS.filter((district) => district.toLowerCase().includes(query))
                          : TAMIL_NADU_DISTRICTS;
                        const exactMatch = TAMIL_NADU_DISTRICTS.some(
                          (district) => district.toLowerCase() === query,
                        );
                        const dropdownVisible = districtMenuOpen && !exactMatch;

                        return (
                          <>
                            <TextField
                              label="District"
                              placeholder="Search or select district"
                              containerStyle={styles.noMargin}
                              value={value}
                              onChangeText={(text) => {
                                onChange(text);
                                measureDistrictDropdown();
                                setDistrictMenuOpen(true);
                              }}
                              onFocus={() => {
                                measureDistrictDropdown();
                                setDistrictMenuOpen(true);
                              }}
                              onBlur={() => {
                                onBlur();
                                // Delay so a tap on a suggestion row registers before we close the list.
                                setTimeout(() => setDistrictMenuOpen(false), 150);
                              }}
                              error={errors.district?.message}
                              right={
                                <Pressable
                                  hitSlop={10}
                                  onPress={() => {
                                    measureDistrictDropdown();
                                    setDistrictMenuOpen((open) => !open);
                                  }}>
                                  <Ionicons
                                    name={districtMenuOpen ? 'chevron-up' : 'chevron-down'}
                                    size={20}
                                    color={neutral[400]}
                                  />
                                </Pressable>
                              }
                            />
                            {dropdownVisible && districtDropdownLayout ? (
                              <Portal>
                                <View
                                  style={[
                                    styles.districtSuggestions,
                                    {
                                      top: districtDropdownLayout.top,
                                      left: districtDropdownLayout.left,
                                      width: districtDropdownLayout.width,
                                    },
                                  ]}>
                                  {filteredDistricts.length > 0 ? (
                                    <ScrollView
                                      style={styles.districtMenuScroll}
                                      keyboardShouldPersistTaps="handled"
                                      showsVerticalScrollIndicator>
                                      {filteredDistricts.map((district) => (
                                        <TouchableOpacity
                                          key={district}
                                          style={styles.districtSuggestionRow}
                                          onPress={() => {
                                            onChange(district);
                                            setDistrictMenuOpen(false);
                                          }}>
                                          <ThemedText type="small">{district}</ThemedText>
                                        </TouchableOpacity>
                                      ))}
                                    </ScrollView>
                                  ) : (
                                    <View style={styles.districtSuggestionRow}>
                                      <ThemedText type="small" themeColor="textSecondary">
                                        No matching district
                                      </ThemedText>
                                    </View>
                                  )}
                                </View>
                              </Portal>
                            ) : null}
                          </>
                        );
                      }}
                    />
                  </View>
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
                      hint={
                        profilePhone
                          ? 'Filled in from your profile. Changing it here only affects this listing.'
                          : "Buyers call or WhatsApp you on this number. We'll also save it to your profile."
                      }
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
                <ReviewRow label="Price" value={formatPrice(values.price)} />
                {values.originalPrice ? (
                  <ReviewRow label="Original price" value={formatPrice(values.originalPrice)} />
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

        <View style={styles.footer}>
          <View style={styles.footerButtons}>
            {step > 0 ? (
              <Button mode="outlined" onPress={goBack} style={styles.footerBackButton}>
                Back
              </Button>
            ) : null}
            {!isLastStep ? (
              <Button mode="contained" onPress={goNext} style={styles.footerNextButton}>
                Continue
              </Button>
            ) : (
              <Button
                mode="contained"
                onPress={submit}
                loading={isSubmitting}
                disabled={isSubmitting}
                style={styles.footerNextButton}>
                {submitLabel}
              </Button>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function StepIndicator({
  current,
  onPress,
}: {
  current: number;
  onPress: (index: number) => void;
}) {
  return (
    <View style={styles.stepRow}>
      {STEPS.map((s, i) => {
        const isCompleted = i < current;
        const isCurrent = i === current;

        return (
          <View key={s.key} style={styles.stepItem}>
            {/* Connecting line */}
            {i < STEPS.length - 1 && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineDone,
                ]}
              />
            )}

            {/* Step circle */}
            <TouchableOpacity
              disabled={i >= current}
              onPress={() => onPress(i)}
              style={[
                styles.stepDot,
                isCurrent && styles.stepDotActive,
                isCompleted && styles.stepDotDone,
              ]}
            >
              {isCompleted ? (
                <Ionicons
                  name="checkmark"
                  size={14}
                  color="#FFFFFF"
                />
              ) : (
                <ThemedText
                  type="small"
                  style={[
                    styles.stepDotText,
                    isCurrent && styles.stepDotTextActive,
                  ]}
                >
                  {i + 1}
                </ThemedText>
              )}
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
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
    <View style={styles.card}>
      <View style={styles.reviewHeader}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <TouchableOpacity style={styles.reviewEditButton} onPress={onEdit}>
          <Ionicons name="create-outline" size={14} color={primary[500]} />
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
    backgroundColor: secondary[200],
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
    height: 3,
    backgroundColor: secondary[400],
    marginTop: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },

  stepItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },

  stepLine: {
    position: 'absolute',
    left: '50%',
    width: '100%',
    height: 2,
    top: 15,
    backgroundColor: neutral[200],
    zIndex: 0,
  },

  stepLineDone: {
    backgroundColor: primary[500],
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: secondary[100],
    borderWidth: 2,
    borderColor: neutral[200],
  },
  stepDotActive: {
    borderColor: primary[500],
    backgroundColor: secondary[50],
  },
  stepDotDone: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: neutral[400],
  },
  stepDotTextActive: {
    color: primary[500],
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  stepSubtitle: {
    marginTop: 2,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: secondary[100],
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(27,67,50,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  fieldLabel: {
    marginBottom: spacing.sm,
  },
  field: {},
  fieldSpacing: {
    marginBottom: spacing.sm,
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
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: neutral[200],
    backgroundColor: secondary[50],
  },
  chipSelected: {
    backgroundColor: primary[500],
    borderColor: primary[500],
  },
  chipText: {
    color: neutral[600],
  },
  chipTextSelected: {
    color: '#FFFFFF',
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
  imageAdd: {
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: primary[300],
    backgroundColor: secondary[50],
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imageAddText: {
    color: primary[500],
    fontWeight: '600',
  },
  districtSuggestions: {
    position: 'absolute',
    backgroundColor: secondary[50],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: neutral[200],
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
  },
  districtMenuScroll: {
    maxHeight: 260,
  },
  districtSuggestionRow: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  toggleCardLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  toggleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: secondary[50],
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    backgroundColor: secondary[200],
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
