module.exports = {
    parser: '@typescript-eslint/parser', // Specifies the ESLint parser
    extends: [
        'plugin:@typescript-eslint/recommended', // Uses the recommended rules from the @typescript-eslint/eslint-plugin
        'plugin:prettier/recommended', 'prettier'
    ],
    "env": {
        "browser": true,
        "node": true,
        "es6": true
    },
    parserOptions: {
        ecmaVersion: 2018, // Allows for the parsing of modern ECMAScript features
        sourceType: 'module', // Allows for the use of imports
    },
    rules: {
        "camelcase": "off",
        "@typescript-eslint/camelcase": ["error", { "ignoreDestructuring": true, "properties": "never" }],
        "@typescript-eslint/no-var-requires": "off",
        "prettier/prettier": ["error", {
            "printWidth": 200,
            "preserve": "never",
            "semi": true,
            "tabWidth": 2,
            "useTabs": false,
            "singleQuote": true,
            "trailingComma": "none",
            "bracketSpacing": true,
            "parser": "flow"
        }]
        // Place to specify ESLint rules. Can be used to overwrite rules specified from the extended configs
        // e.g. "@typescript-eslint/explicit-function-return-type": "off",
    },
};
