import { terser } from 'rollup-plugin-terser';
import filesize from 'rollup-plugin-filesize';
import typescript from '@rollup/plugin-typescript';
import del from 'rollup-plugin-delete';

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
        del({ targets: 'dist/*' }),
        typescript({ tsconfig: './tsconfig.json' }),
        terser(),
        filesize()
    ]
};
