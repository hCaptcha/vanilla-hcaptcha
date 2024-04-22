import { terser } from "rollup-plugin-terser";
import filesize from "rollup-plugin-filesize";
import typescript from '@rollup/plugin-typescript';

export default {
    input: './src/index.ts',
    output: [{
        file: './dist/index.min.js',
        format: 'iife',
        name: 'bundle',
        sourcemap: true
    }, {
        file: './dist/index.min.mjs',
        format: 'es',
        name: 'bundle',
        sourcemap: true
    }],
    plugins: [
        typescript({ tsconfig: './tsconfig.json' }),
        terser(),
        filesize()
    ]
};
