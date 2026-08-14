import type { Meta, StoryObj } from '@storybook/react-vite'

import { babyAvatarAppearance, babyInitials } from '@/shared/utils/babyAvatarColor'

import { Avatar, AvatarBadge, AvatarFallback, AvatarGroup, AvatarGroupCount, AvatarImage } from './avatar'

const meta = {
  title: 'UI/Avatar',
  component: Avatar,
  parameters: {
    docs: {
      description: {
        component:
          'How a child is identified everywhere in the app. Since the redesign, every screen shows ' +
          'the whole household at once — each vaccine, appointment and milestone row is tagged ' +
          'with its child\'s avatar instead of the screen being scoped to one selected child.',
      },
    },
  },
  argTypes: {
    size: { control: 'inline-radio', options: ['sm', 'default', 'lg'] },
  },
} satisfies Meta<typeof Avatar>

export default meta
type Story = StoryObj<typeof meta>

const BABIES = [
  { id: 'b1e7a2c0', name: 'Helena', avatarColor: null },
  { id: '4f9d31ab', name: 'Bento', avatarColor: null },
  { id: 'c8207e55', name: 'Alice', avatarColor: '#6c63ff' },
] as const

export const Sizes: Story = {
  render: (args) => (
    <div className="flex items-center gap-4">
      {(['sm', 'default', 'lg'] as const).map((size) => (
        <Avatar key={size} {...args} size={size}>
          <AvatarFallback>H</AvatarFallback>
        </Avatar>
      ))}
    </div>
  ),
}

// Inlined as a data URI on purpose: a story must not depend on a third-party
// placeholder host still being up (or reachable) when the static Storybook is
// opened months later from a CV link.
const SAMPLE_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80">
      <rect width="80" height="80" fill="#c7e9e4"/>
      <circle cx="40" cy="31" r="15" fill="#2a9d8f"/>
      <path d="M12 80c0-17 13-28 28-28s28 11 28 28z" fill="#2a9d8f"/>
    </svg>`,
  )

export const WithImage: Story = {
  render: (args) => (
    <Avatar {...args} size="lg">
      <AvatarImage src={SAMPLE_PHOTO} alt="Foto de Helena" />
      <AvatarFallback>H</AvatarFallback>
    </Avatar>
  ),
}

export const DeterministicColors: Story = {
  name: 'Deterministic fallback colors',
  parameters: {
    docs: {
      description: {
        story:
          'A child without a user-chosen color still gets a stable one: `babyAvatarPalette` hashes ' +
          'the id into a fixed four-color palette, so the same child is the same color across ' +
          'renders, sessions and devices. Alice below has an explicit `avatarColor` and overrides it.',
      },
    },
  },
  render: (args) => (
    <div className="flex items-center gap-4">
      {BABIES.map((baby) => {
        const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)
        return (
          <div key={baby.id} className="flex flex-col items-center gap-2">
            <Avatar {...args} size="lg">
              <AvatarFallback className={appearance.className} style={appearance.style}>
                {babyInitials(baby.name)}
              </AvatarFallback>
            </Avatar>
            <span className="text-ink-muted text-xs">{baby.name}</span>
          </div>
        )
      })}
    </div>
  ),
}

export const WithBadge: Story = {
  render: (args) => (
    <Avatar {...args} size="lg">
      <AvatarFallback>B</AvatarFallback>
      {/* AvatarBadge renders a plain <span>; aria-label is prohibited on a
          generic element, so the badge needs an explicit img role to carry its
          accessible name. */}
      <AvatarBadge className="bg-rose-500" role="img" aria-label="Vacina atrasada" />
    </Avatar>
  ),
}

export const Group: Story = {
  name: 'Group (household)',
  render: () => (
    <AvatarGroup>
      {BABIES.map((baby) => {
        const appearance = babyAvatarAppearance(baby.id, baby.avatarColor)
        return (
          <Avatar key={baby.id}>
            <AvatarFallback className={appearance.className} style={appearance.style}>
              {babyInitials(baby.name)}
            </AvatarFallback>
          </Avatar>
        )
      })}
      <AvatarGroupCount>+2</AvatarGroupCount>
    </AvatarGroup>
  ),
}
