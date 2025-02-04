// @ts-check

/**
 * @type {import('typedoc').TypeDocOptions & import('typedoc-plugin-markdown').MarkdownTheme}
 */
module.exports = {
  entryPoints: ["src/index.ts", "src/models.ts"],
  entryPointStrategy: "expand",
  tsconfig: "./tsconfig.json",
  entryModule: "@oneum-io/sequelize-adapter",
  entryFileName: "../sequelize-adapter.mdx",
  includeVersion: true,
  readme: 'none',
}
