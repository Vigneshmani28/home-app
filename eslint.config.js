// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // supabase/functions/** runs on Deno (uses Deno.serve/Deno.env globals
    // and remote https:// imports) and isn't part of the RN app's lint
    // surface — excluded here rather than fought with Deno-specific globals.
    // admin/ is a separate Next.js app with its own package.json, tsconfig and ESLint setup.
    ignores: ['dist/*', 'supabase/functions/**', 'admin/**'],
  },
  {
    // The `import/resolver` "typescript" shorthand shipped by eslint-config-expo
    // currently crashes in this environment (eslint-import-resolver-typescript /
    // eslint-plugin-import interface mismatch), which makes `import/no-unresolved`
    // and `import/namespace` report false positives on every `@/*` path-aliased
    // import. TypeScript itself (`tsc --noEmit`) already validates module
    // resolution, including the `@/*` alias, so we disable the redundant/broken
    // resolver-dependent rules here rather than fight the resolver bug.
    rules: {
      'import/no-unresolved': 'off',
      'import/namespace': 'off',
      'import/no-duplicates': 'off',
    },
  },
]);
