/**
 * Lightweight chainable mock for the subset of the supabase-js query
 * builder API this project actually uses (`.from().insert().select()...`).
 * Not a full postgrest-js reimplementation — just enough surface for unit
 * tests to configure a terminal result and assert which chain methods were
 * called with what arguments.
 *
 * Usage:
 *   const builder = createQueryBuilderMock({ data: row, error: null });
 *   supabaseMock.from.mockReturnValue(builder);
 *   ...
 *   expect(builder.insert).toHaveBeenCalledWith({ ... });
 */
export interface QueryResult<T = unknown> {
  data: T;
  error: { message: string } | null;
}

export interface QueryBuilderMock {
  insert: jest.Mock;
  update: jest.Mock;
  delete: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  or: jest.Mock;
  order: jest.Mock;
  range: jest.Mock;
  limit: jest.Mock;
  gte: jest.Mock;
  lte: jest.Mock;
  single: jest.Mock;
  maybeSingle: jest.Mock;
  then: (resolve: (value: QueryResult) => unknown) => unknown;
}

export function createQueryBuilderMock<T = unknown>(result: QueryResult<T>): QueryBuilderMock {
  const builder: QueryBuilderMock = {
    insert: jest.fn(() => builder),
    update: jest.fn(() => builder),
    delete: jest.fn(() => builder),
    select: jest.fn(() => builder),
    eq: jest.fn(() => builder),
    or: jest.fn(() => builder),
    order: jest.fn(() => builder),
    range: jest.fn(() => builder),
    limit: jest.fn(() => builder),
    gte: jest.fn(() => builder),
    lte: jest.fn(() => builder),
    single: jest.fn(() => Promise.resolve(result)),
    maybeSingle: jest.fn(() => Promise.resolve(result)),
    then: (resolve) => Promise.resolve(result).then(resolve),
  };
  return builder;
}

export interface SupabaseMock {
  from: jest.Mock;
  rpc: jest.Mock;
  auth: {
    getUser: jest.Mock;
    getSession: jest.Mock;
  };
  storage: {
    from: jest.Mock;
  };
}

export function createSupabaseMock(): SupabaseMock {
  return {
    from: jest.fn(),
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn(),
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    storage: {
      from: jest.fn(),
    },
  };
}

export function mockAuthenticatedUser(supabaseMock: SupabaseMock, userId: string) {
  supabaseMock.auth.getUser.mockResolvedValue({
    data: { user: { id: userId } },
    error: null,
  });
}
