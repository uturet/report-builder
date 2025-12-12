import tailwindPostcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import colorConverter from 'postcss-color-converter';

export default {
  plugins: [
    tailwindPostcss(),
    autoprefixer(),
    colorConverter({ outputColorFormat: 'rgb' }),
  ],
};
