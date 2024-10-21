import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";
import stylistic from "@stylistic/eslint-plugin";

export default tseslint.config(
  ...[
    { ignores: ["node_modules", "dist", "schema.ts", "*.d.ts", "eslint.config.mjs"] },
    { files: ["**/*.{js,mjs,cjs,ts}"] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    stylistic.configs["recommended-flat"],
    {
      plugins: {
        "@stylistic": stylistic,
      },
    },
  ]
);
