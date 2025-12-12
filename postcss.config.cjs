module.exports = {
    plugins: [
      require('@tailwindcss/postcss'),
      require('autoprefixer'),
      require('postcss-color-converter')({ outputColorFormat: 'rgb' }),
    ],
  };
  