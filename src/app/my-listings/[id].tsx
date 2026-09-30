import { Redirect, useLocalSearchParams } from 'expo-router';

/** Owner view of a single listing — reuse the standard detail screen, which already shows owner-only actions. */
export default function MyListingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Redirect href={`/listing/${id}`} />;
}
