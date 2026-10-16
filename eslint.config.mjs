import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/features/*/*",
                "!@/features/*/server",
                "!@/features/*/queries",
              ],
              message:
                "Importe apenas pela API pública: @/features/<feature>, @/features/<feature>/server ou @/features/<feature>/queries",
            },
            {
              group: [
                "@/features/*/**",
                "!@/features/*/server",
                "!@/features/*/queries",
              ],
              message:
                "Importe apenas pela API pública: @/features/<feature>, @/features/<feature>/server ou @/features/<feature>/queries",
            },
          ],
        },
      ],
    },
  },
  {
    // shared/ must not import features or app
    files: ["src/shared/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features", "@/features/*", "@/features/*/*", "@/app", "@/app/*"],
              message: "shared/ nunca importa de features/ nem de app/",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
