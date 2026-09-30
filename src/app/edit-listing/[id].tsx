import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/services/auth-context';
import { ListingForm, type ListingFormImage } from '@/features/listings/components';
import { useListing, useUpdateListing, useUploadListingImage, useDeleteListingImage } from '@/features/listings/hooks';
import type { ListingFormValues } from '@/features/listings/schemas';
import { useSavePhoneIfMissing } from '@/features/profile/hooks';
import { getErrorMessage } from '@/utils/errors';
import { spacing } from '@/theme/spacing';

export default function EditListingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, profile } = useAuth();
  const savePhoneIfMissing = useSavePhoneIfMissing();
  const { data: listing, isLoading } = useListing(id);
  const updateListing = useUpdateListing(id ?? '');
  const uploadImage = useUploadListingImage();
  const deleteImage = useDeleteListingImage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialImages = useMemo<ListingFormImage[]>(
    () =>
      (listing?.listing_images ?? [])
        .slice()
        .sort((a, b) => a.display_order - b.display_order)
        .map((image) => ({ id: image.id, uri: image.storage_path, isExisting: true })),
    [listing],
  );

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <ActivityIndicator style={styles.loader} />
      </ThemedView>
    );
  }

  if (!listing) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>Listing not found.</ThemedText>
      </ThemedView>
    );
  }

  // Guard: only the owner may edit.
  if (!user || user.id !== listing.seller_id) {
    return <Redirect href={`/listing/${id}`} />;
  }

  const defaultValues: Partial<ListingFormValues> = {
    categoryId: listing.category_id,
    materialName: listing.material_name ?? '',
    title: listing.title,
    description: listing.description ?? '',
    quantity: listing.quantity,
    unit: listing.unit,
    price: listing.price,
    originalPrice: listing.original_price,
    condition: listing.condition,
    brand: listing.brand ?? '',
    manufactureDate: listing.manufacture_date ?? '',
    expiryDate: listing.expiry_date ?? '',
    district: listing.district,
    locality: listing.locality,
    pincode: listing.pincode ?? '',
    // Older listings (before contact numbers existed) fall back to the profile number.
    contactPhone: listing.contact_phone ?? profile?.phone ?? '',
    pickupAvailable: listing.pickup_available,
    deliveryAvailable: listing.delivery_available,
  };

  const onSubmit = async (values: ListingFormValues, images: ListingFormImage[]) => {
    if (!user) return;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      await updateListing.mutateAsync({
        categoryId: values.categoryId,
        materialName: values.materialName,
        title: values.title,
        description: values.description,
        quantity: values.quantity,
        unit: values.unit,
        price: values.price,
        originalPrice: values.originalPrice ?? null,
        condition: values.condition,
        brand: values.brand,
        manufactureDate: values.manufactureDate,
        expiryDate: values.expiryDate,
        district: values.district,
        locality: values.locality,
        pincode: values.pincode,
        contactPhone: values.contactPhone,
        pickupAvailable: values.pickupAvailable,
        deliveryAvailable: values.deliveryAvailable,
      });

      // Only fills the profile number when it's empty; never overwrites an existing one.
      await savePhoneIfMissing(values.contactPhone);

      // Remove images that were dropped from the form.
      const keptExistingIds = new Set(images.filter((img) => img.isExisting).map((img) => img.id));
      const removed = (listing.listing_images ?? []).filter((img) => !keptExistingIds.has(img.id));
      for (const image of removed) {
        await deleteImage.mutateAsync({ imageId: image.id, storagePath: image.storage_path, listingId: listing.id });
      }

      // Upload newly picked images.
      const newImages = images.filter((img) => !img.isExisting);
      const startOrder = images.length - newImages.length;
      for (let i = 0; i < newImages.length; i += 1) {
        await uploadImage.mutateAsync({
          userId: user.id,
          listingId: listing.id,
          localUri: newImages[i].uri,
          displayOrder: startOrder + i,
        });
      }

      router.replace(`/listing/${listing.id}`);
    } catch (error) {
      if (__DEV__) console.warn('[edit-listing] update failed', error);
      setSubmitError(getErrorMessage(error, 'Could not update the listing. Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ListingForm
        title="Edit Listing"
        defaultValues={defaultValues}
        initialImages={initialImages}
        profilePhone={profile?.phone}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitLabel="Save Changes"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loader: {
    marginTop: spacing.xl,
  },
});
