import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/features/auth/services/auth-context';
import { ListingForm, type ListingFormImage } from '@/features/listings/components';
import { useCreateListing, useUploadListingImage } from '@/features/listings/hooks';
import type { ListingFormValues } from '@/features/listings/schemas';
import { useDistrict } from '@/features/district/hooks';
import { useSavePhoneIfMissing } from '@/features/profile/hooks';
import { getErrorMessage } from '@/utils/errors';

export default function SellScreen() {
  const { isLoading, session, user, profile } = useAuth();
  const savePhoneIfMissing = useSavePhoneIfMissing();
  const { district: currentDistrict } = useDistrict();
  const createListing = useCreateListing();
  const uploadImage = useUploadListingImage();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createdListingId = useRef<string | null>(null);

  if (isLoading) {
    return null;
  }

  // Guests can browse (tabs), but creating a listing requires an account.
  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  const onSubmit = async (values: ListingFormValues, images: ListingFormImage[]): Promise<boolean> => {
    if (!user) return false;
    setSubmitError(null);
    setIsSubmitting(true);
    try {
      const listing = await createListing.mutateAsync({
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

      // First-time sellers with no profile number: keep the number they just gave. Never overwrites an existing one.
      await savePhoneIfMissing(values.contactPhone);

      for (let i = 0; i < images.length; i += 1) {
        await uploadImage.mutateAsync({
          userId: user.id,
          listingId: listing.id,
          localUri: images[i].uri,
          displayOrder: i,
        });
      }

      createdListingId.current = listing.id;
      return true;
    } catch (error) {
      if (__DEV__) console.warn('[sell] create listing failed', error);
      setSubmitError(getErrorMessage(error, 'Could not create the listing. Please try again.'));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ListingForm
        defaultValues={{
          contactPhone: profile?.phone ?? '',
          // Start from the district the user is browsing in (or their profile's), so most sellers don't have to pick.
          district: currentDistrict ?? profile?.district ?? '',
        }}
        profilePhone={profile?.phone}
        onSubmit={onSubmit}
        onSaved={() => {
          if (createdListingId.current) router.replace(`/listing/${createdListingId.current}`);
        }}
        isSubmitting={isSubmitting}
        submitError={submitError}
        submitLabel="Post Listing"
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
