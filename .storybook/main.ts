import type { StorybookConfig } from '@storybook/react-vite'
import remarkGfm from 'remark-gfm'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(ts|tsx)'],

  addons: [
    {
      name: '@storybook/addon-docs',
      options: {
        // Storybook's MDX pipeline ships without GFM, so a pipe table renders
        // as a line of literal pipes. The docs pages carry real tables (the
        // token deviations, the per-feature colour map), so this is required
        // rather than cosmetic.
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm],
          },
        },
      },
    },
    '@storybook/addon-a11y',
    '@storybook/addon-themes',
    '@storybook/addon-vitest',
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  core: {
    disableTelemetry: true,
  },

  // react-docgen reads the components' TypeScript prop types, which is what
  // populates the auto-generated docs page and the Controls panel. Without it,
  // every story would need its argTypes written out by hand.
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      shouldRemoveUndefinedFromOptional: true,
      // `cva`-based components spread React.ComponentProps<'button'>, which
      // would otherwise dump ~250 inherited DOM props into every prop table.
      propFilter: (prop) => !prop.parent?.fileName.includes('node_modules'),
    },
  },

  viteFinal: (viteConfig) => {
    // vite.config.ts pins the app's dev server to port 4205 with strictPort;
    // Storybook runs its own server and must not inherit that.
    delete viteConfig.server

    // GitHub Pages serves this from /<repo>/, not from the domain root, so the
    // deploy workflow sets STORYBOOK_BASE_PATH=/cygnus/. Unset everywhere else.
    if (process.env.STORYBOOK_BASE_PATH) {
      viteConfig.base = process.env.STORYBOOK_BASE_PATH
    }

    return viteConfig
  },
}

export default config
