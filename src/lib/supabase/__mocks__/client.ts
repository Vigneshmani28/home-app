// Manual Jest mock for `@/lib/supabase/client`. Activate per-test-file with
// `jest.mock('@/lib/supabase/client')`, then cast the imported `supabase`
// to `SupabaseMock` (see tests/utils/supabase-mock.ts) to configure
// `.from`, `.rpc`, `.auth.getUser`, and `.storage.from` return values.
import { createSupabaseMock } from '../../../../tests/utils/supabase-mock';

export const supabase = createSupabaseMock();
