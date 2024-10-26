import globals from "globals";
import pluginJs from "@eslint/js";


export default [
  {
    ignores: ["node_modules/*", "dist/*"],
  },
  {languageOptions: { globals: {...globals.browser, ...globals.node} }},
  pluginJs.configs.recommended,
];