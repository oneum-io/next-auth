// @ts-check

/**
 * @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').MarkdownTheme}
 */
module.exports = {
  entryPoints: ["src/index.ts"],
  entryPointStrategy: "expand",
  tsconfig: "./tsconfig.json",
  entryModule: "@oneum-io/upstash-redis-adapter",
  entryFileName: "../upstash-redis-adapter.mdx",
  includeVersion: true,
  readme: 'none',
}
