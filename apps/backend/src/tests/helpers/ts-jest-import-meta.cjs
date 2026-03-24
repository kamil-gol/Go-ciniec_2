/**
 * Custom Jest transformer that wraps ts-jest and patches import.meta.url
 * in the compiled output.
 *
 * Problem: Prisma 7 generated client uses import.meta.url (ESM-only).
 * ts-jest compiles TypeScript but preserves import.meta.url since the
 * tsconfig uses module: "ESNext". Node.js CJS parser then throws:
 *   SyntaxError: Cannot use 'import.meta' outside a module
 *
 * Solution: After ts-jest compilation, replace import.meta.url with
 * its CJS equivalent: require("url").pathToFileURL(__filename).href
 *
 * Used ONLY in the integration project (unit tests use a mock that
 * never imports the generated client).
 */
const tsJest = require('ts-jest');

module.exports = {
  createTransformer(tsJestOptions) {
    const inner = tsJest.createTransformer(tsJestOptions);

    return {
      process(sourceText, sourcePath, transformOptions) {
        const result = inner.process(sourceText, sourcePath, transformOptions);
        const code = typeof result === 'string' ? result : result.code;

        if (code && code.includes('import.meta')) {
          const fixed = code.replace(
            /import\.meta\.url/g,
            'require("url").pathToFileURL(__filename).href',
          );
          if (typeof result === 'string') return fixed;
          return { ...result, code: fixed };
        }

        return result;
      },

      getCacheKey(sourceText, sourcePath, transformOptions) {
        // Append suffix to bust cache when this transformer changes
        return inner.getCacheKey(sourceText, sourcePath, transformOptions) + '-import-meta-v1';
      },
    };
  },
};
