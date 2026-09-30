import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { useAuth } from '@/features/auth/services/auth-context';
import { supabase } from '@/lib/supabase/client';
import { FavoriteAuthRequiredError, useToggleFavorite } from '@/features/favorites/hooks';
import { createQueryBuilderMock, mockAuthenticatedUser, type SupabaseMock } from '../../../utils/supabase-mock';

jest.mock('@/lib/supabase/client');
jest.mock('@/features/auth/services/auth-context', () => ({
  useAuth: jest.fn(),
}));

const supabaseMock = supabase as unknown as SupabaseMock;
const mockUseAuth = useAuth as jest.Mock;

function wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('useToggleFavorite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls addFavorite (insert) when favoriting an unfavorited listing', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockAuthenticatedUser(supabaseMock, 'user-1');
    const builder = createQueryBuilderMock({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    const { result } = await renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ listingId: 'listing-42', isFavorited: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(builder.insert).toHaveBeenCalledWith({ user_id: 'user-1', listing_id: 'listing-42' });
    expect(builder.delete).not.toHaveBeenCalled();
  });

  it('calls removeFavorite (delete) when unfavoriting a favorited listing', async () => {
    mockUseAuth.mockReturnValue({ user: { id: 'user-1' } });
    mockAuthenticatedUser(supabaseMock, 'user-1');
    const builder = createQueryBuilderMock({ data: null, error: null });
    supabaseMock.from.mockReturnValue(builder);

    const { result } = await renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ listingId: 'listing-42', isFavorited: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(builder.delete).toHaveBeenCalled();
    expect(builder.insert).not.toHaveBeenCalled();
  });

  it('throws FavoriteAuthRequiredError without calling supabase when signed out', async () => {
    mockUseAuth.mockReturnValue({ user: null });

    const { result } = await renderHook(() => useToggleFavorite(), { wrapper });

    result.current.mutate({ listingId: 'listing-42', isFavorited: false });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(FavoriteAuthRequiredError);
    expect(supabaseMock.from).not.toHaveBeenCalled();
  });
});
