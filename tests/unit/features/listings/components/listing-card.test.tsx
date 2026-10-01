import { render } from '@testing-library/react-native';
import React from 'react';

import { ListingCard, type ListingCardData } from '@/features/listings/components/listing-card';

const baseListing: ListingCardData = {
  id: 'listing-1',
  title: 'UltraTech Cement 50kg bags',
  price: 350,
  quantity: 100,
  unit: 'bags',
  condition: 'unused',
  district: 'Chennai',
  locality: 'Adyar',
  status: 'active',
  distanceKm: null,
  imagePath: null,
};

describe('ListingCard', () => {
  it('renders the title, price, condition, and locality', async () => {
    const { getByText } = await render(<ListingCard listing={baseListing} />);

    expect(getByText('UltraTech Cement 50kg bags')).toBeTruthy();
    expect(getByText('₹350')).toBeTruthy();
    expect(getByText('Unused')).toBeTruthy();
    expect(getByText('Adyar, Chennai')).toBeTruthy();
  });

  it('renders an outline heart when not favorited', async () => {
    const { getByTestId, queryByTestId } = await render(
      <ListingCard listing={baseListing} isFavorited={false} />,
    );

    expect(getByTestId('favorite-icon-outline')).toBeTruthy();
    expect(queryByTestId('favorite-icon-filled')).toBeNull();
  });

  it('renders a filled heart when favorited', async () => {
    const { getByTestId, queryByTestId } = await render(<ListingCard listing={baseListing} isFavorited />);

    expect(getByTestId('favorite-icon-filled')).toBeTruthy();
    expect(queryByTestId('favorite-icon-outline')).toBeNull();
  });

  it('does not render a status badge for an active listing', async () => {
    const { queryByText } = await render(<ListingCard listing={baseListing} />);

    expect(queryByText('Sold')).toBeNull();
    expect(queryByText('Reserved')).toBeNull();
  });

  it('renders a status badge when the listing is not active', async () => {
    const { getByText } = await render(<ListingCard listing={{ ...baseListing, status: 'sold' }} />);

    expect(getByText('Sold')).toBeTruthy();
  });

  it('renders a "Reserved" badge for a reserved listing', async () => {
    const { getByText } = await render(<ListingCard listing={{ ...baseListing, status: 'reserved' }} />);

    expect(getByText('Reserved')).toBeTruthy();
  });

  it('shows the total price, the quantity and the actual posting date', async () => {
    const { getByText, queryByText } = await render(
      <ListingCard listing={{ ...baseListing, createdAt: '2026-09-30T10:00:00+00:00' }} />,
    );

    expect(getByText('₹350')).toBeTruthy();
    expect(getByText('100 bags')).toBeTruthy();
    expect(getByText('Posted 30 Sep 2026')).toBeTruthy();
    // The price is for the whole quantity, so it must not be shown as "per unit".
    expect(queryByText('/ bags')).toBeNull();
  });
});
