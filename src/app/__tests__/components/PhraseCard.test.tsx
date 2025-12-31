import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { PhraseCard } from "../../components/PhraseCard";
import { useMotionValue } from "framer-motion";

vi.mock("../../utils/audioUtils", () => ({
  generateAudio: vi.fn().mockResolvedValue({ audioUrl: "blob:audio" }),
}));

type PhraseCardProps = React.ComponentProps<typeof PhraseCard>;

function PhraseCardHarness(props: PhraseCardProps) {
  const dragX = useMotionValue(0);
  const dragY = useMotionValue(0);
  return <PhraseCard {...props} dragX={dragX} dragY={dragY} />;
}

const baseProps: Omit<PhraseCardProps, "dragX" | "dragY"> = {
  phrase: "Hello world",
  translated: "Hola mundo",
  romanized: undefined,
  phase: "input",
  inputLang: "en",
  targetLang: "es",
  inputVoice: "voice-en",
  targetVoice: "voice-es",
  fullScreen: false,
  isMobile: false,
  isMobileInline: false,
  isSafari: false,
  textColorClass: "text-slate-900",
  textBg: undefined,
  alignPhraseTop: false,
  showAllPhrases: false,
  enableOutputBeforeInput: false,
  isPlayingAudio: false,
  paused: false,
  onPlayPhrase: vi.fn(),
  animationDirection: null,
  offsetX: 0,
  offsetY: 0,
  title: undefined,
  titlePropClass: "font-display text-2xl",
  verticalScroll: false,
  disableAnimation: true,
};

describe("PhraseCard word tooltip", () => {
  const fetchMock = vi.fn();
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    fetchMock.mockReset();
    global.fetch = originalFetch;
  });

  it("shows tooltip content with translation and context", async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.includes("/translate-word")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ translated: "Hola" }),
        });
      }
      if (url.includes("/word-context")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "Greeting in context." }),
        });
      }
      return Promise.reject(new Error("Unexpected fetch"));
    });

    render(<PhraseCardHarness {...baseProps} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Hello" }));

    await waitFor(() => {
      expect(screen.getByText("Hola")).toBeInTheDocument();
    });

    await user.click(screen.getByRole("button", { name: "Ask" }));

    await waitFor(() => {
      expect(screen.getByText("Greeting in context.")).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/translate-word"),
      expect.any(Object)
    );
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/word-context"),
      expect.any(Object)
    );
  });

  it("plays word audio from tooltip button", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ translated: "Hola" }),
    });

    const { generateAudio } = await import("../../utils/audioUtils");

    render(<PhraseCardHarness {...baseProps} />);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Hello" }));

    await waitFor(() => {
      expect(screen.getByText("Hola")).toBeInTheDocument();
    });

    const playButton = screen.getByRole("button", { name: "Play translation audio" });
    await waitFor(() => {
      expect(playButton).toBeEnabled();
    });
    await user.click(playButton);

    expect(generateAudio).toHaveBeenCalledWith("Hello", "en", "voice-en");
  });

  it("renders phrase audio button and triggers output playback", async () => {
    const onPlayPhrase = vi.fn();

    render(
      <PhraseCardHarness
        {...baseProps}
        phase="output"
        onPlayPhrase={onPlayPhrase}
      />
    );

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Play output audio" }));

    expect(onPlayPhrase).toHaveBeenCalledWith("output");
  });
});
