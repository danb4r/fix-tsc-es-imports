# fix-tsc-es-imports

**fix-tsc-es-imports** uses shelljs sed to fix default extensionless typescript ECMAScript compiled code relative imports and exports, properly adding .js extensions.

## How it works

**fix-tsc-es-imports** looks for every `.js` file at the `compileOptions.outDir` folder found on the default `tsconfig.json` or another provided `.json` config file, and fixes all extensionless typescript **relative only** imports and exports, adding `.js` extensions to them.

## Usage

Usage:

```script
fix_tsc_imports [-h|--help] [-y] [alternative_tsconfig.json]

  -h --help     usage info
  -y --yes      ignore confirmation and proceed straight away
  -v --verbose  verbose, outputs sed changed strings
  -d --dry      dry run, do not change anything and output sed changed strings (implied -v and -y)
```

An alternative `tsconfig.json` can be provided. It must have a `.json` extension. For example:

`fix_tsc_imports -y ./dev/dev_tsconfig.json`

See `test/tsconfig_sample.json` file.

## Safe measures

**fix-tsc-es-imports** does a few safe checks to avoid touching the wrong code. It will check if `outDir` is a subfolder of the current folder and will not accept this folder names: `src`, `node_modules`, `app`.

## Why?

Because when compiling ES6 modules with the current Typescript Compiler it generates `.js` files from `.ts` and `.tsx` files without properly fixing the imports expected from a ECMAScript module.

In face of that situation, our options are:

1. Forget about TSC and use Babel, losing type checking. **Undesirable.**
2. Keep TSC type checking and types generation and use Babel alongside to build our modules. **Slower and mostly unnecessary.**
3. Use Webpack, Babel and TSC altogether to produce a compiled packed module. We do not need to do that because modules will mostly certainly be included in another package that will be transpiled and packed down the development chain. **So, also unnecessary.**
4. Config Prettier to not complain about imports with extensions and manually review all our imports to have a fake `.js` extension while the source code has a `.ts` or `.tsx` extension. **That does not seams to be the smartest option.**
5. Use the `.mjs` and `.cjs` files extensions. **Very overwhelming**.
6. Use TSC to compile our Typescript code to ES6 or another module code, and generate maps and types, and got that module code properly imported in our other projects. **That is mostly certain the best way to go.**

So, this small script was built to add a `.js` extension to every extensionless Typescript generated `import` found in the compiled code.

## References

- Typescript documentation [ECMAScript Modules in Node.js](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- Node documentation [Modules: ECMAScript modules](https://nodejs.org/api/esm.html#modules-ecmascript-modules)

## License

MIT. See `LICENSE.md` file.

## Credits

I borrowed the RegEx proposed by wesbos [here](https://stackoverflow.com/questions/62619058/appending-js-extension-on-relative-import-statements-during-typescript-compilat/73075563#73075563). And borrowed the subfolder verification code from Ilya Kozhevnikov [here](https://stackoverflow.com/questions/37521893/determine-if-a-path-is-subdirectory-of-another-in-node-js).
