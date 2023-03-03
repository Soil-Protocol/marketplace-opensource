const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const MomentTimezoneDataPlugin = require('moment-timezone-data-webpack-plugin')

module.exports = withBundleAnalyzer({
  images: {
    domains: ['i.redd.it', 'cloudflare-ipfs.com', 'picsum.photos'],
  },
  webpack: (config, { webpack }) => {
    config.plugins = config.plugins || []

    config.plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/))

    config.plugins.push(
      new MomentTimezoneDataPlugin({
        matchZones: /^Asia\/Bangkok/,
      }),
    )

    config.module.rules.push({
      test: /\.svg$/,
      use: [
        {
          loader: '@svgr/webpack',
          options: { svgoConfig: { plugins: [{ removeViewBox: false }] } },
        },
      ],
    })

    /* For transforming images to base64 embeded in the bundle */
    // config.module.rules.push({
    //   test: /\.(eot|woff|woff2|ttf|svg|png|jpg|gif)$/,
    //   use: {
    //     loader: 'url-loader',
    //     options: {
    //       limit: 100000,
    //       name: '[name].[ext]',
    //     },
    //   },
    // })

    return config
  },
})
