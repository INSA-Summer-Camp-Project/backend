import eslint from "@eslint/js";
import boundaries from "eslint-plugin-boundaries";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tseslint from "typescript-eslint";

export default [
  {
    ignores: ["dist/**", "node_modules/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  // Import sorting
  {
    plugins: { "simple-import-sort": simpleImportSort },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
    },
  },

  // Architecture boundaries
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "config", pattern: "config/*" },
        { type: "lib", pattern: "lib/*" },
        { type: "middlewares", pattern: "middlewares/*" },
        { type: "controllers", pattern: "controllers/*" },
        { type: "services", pattern: "services/*" },
        { type: "routes", pattern: "routes/*" },
        { type: "dtos", pattern: "dtos/*" },
        { type: "types", pattern: "types/*" },
        { type: "utils", pattern: "utils/*" },
      ],
      "boundaries/files": [{ category: "test", pattern: "**/*.test.ts" }],
    },
    rules: {
      "boundaries/dependencies": [
        2,
        {
          default: "disallow",
          policies: [
            // Routes → middlewares, controllers only
            {
              from: { element: { type: "routes" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["middlewares", "controllers"] } },
                },
              },
            },
            // Controllers → services, dtos, middlewares (for types)
            {
              from: { element: { type: "controllers" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["services", "dtos", "middlewares"] },
                  },
                },
              },
            },
            // Services → lib, dtos, types
            {
              from: { element: { type: "services" } },
              allow: {
                to: { element: { types: { anyOf: ["lib", "dtos", "types"] } } },
              },
            },
            // Middlewares → lib, types
            {
              from: { element: { type: "middlewares" } },
              allow: {
                to: { element: { types: { anyOf: ["lib", "types"] } } },
              },
            },
            // Config importable by all non-test layers
            {
              from: {
                element: {
                  types: {
                    anyOf: [
                      "routes",
                      "controllers",
                      "services",
                      "middlewares",
                      "lib",
                    ],
                  },
                },
              },
              allow: {
                to: { element: { type: "config" } },
              },
            },
            // Lib can import other lib modules
            {
              from: { element: { type: "lib" } },
              allow: {
                to: {
                  element: { types: { anyOf: ["lib", "config", "types"] } },
                },
              },
            },
            // Tests can import anything
            {
              from: { file: { categories: "test" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: [
                        "routes",
                        "controllers",
                        "services",
                        "lib",
                        "dtos",
                        "types",
                        "utils",
                        "config",
                        "middlewares",
                      ],
                    },
                  },
                },
              },
            },
          ],
        },
      ],
    },
  },

  // Existing rules
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  },
];
