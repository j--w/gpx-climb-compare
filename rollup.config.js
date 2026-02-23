import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import copy from 'rollup-plugin-copy';

export default {
  input: 'components/app-shell.js',
  output: {
    file: 'dist/app-shell.js',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    resolve(),
    terser({
      ecma: 2020,
      module: true,
      warnings: true,
    }),
    copy({
      targets: [
        { 
          src: 'index.html', 
          dest: 'dist',
          transform: (contents) => {
            return contents.toString()
              .replace('./components/app-shell.js', './app-shell.js');
          }
        },
      ],
    }),
  ],
  preserveEntrySignatures: 'strict',
};
