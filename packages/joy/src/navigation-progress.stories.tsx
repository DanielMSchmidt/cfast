import type { Meta, StoryObj } from "@storybook/react";
import LinearProgress from "@mui/joy/LinearProgress";
import { MemoryRouter } from "react-router";
import { NavigationProgress } from "./navigation-progress.js";

const meta = {
  title: "Joy/NavigationProgress",
  component: NavigationProgress,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof NavigationProgress>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * When there is no active navigation, NavigationProgress renders nothing.
 */
export const Idle: Story = {
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

/**
 * Visual representation of the progress bar shown during active navigation.
 * The real component renders this automatically when react-router navigation
 * state is "loading".
 */
export const Loading: Story = {
  render: () => (
    <LinearProgress
      sx={{
        position: "relative",
        top: 0,
        left: 0,
        right: 0,
        "--LinearProgress-radius": "0px",
        "--LinearProgress-thickness": "3px",
      }}
    />
  ),
};
