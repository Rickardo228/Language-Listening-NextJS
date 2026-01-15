import type { CSSProperties } from "react";
import { toast } from "sonner";
import { MilestoneInfo } from "../../utils/userStats/types";
import { MilestoneCelebrationContent } from "./MilestoneCelebrationContent";

type MilestoneCelebrationSnackbarOptions = {
  milestoneInfo: MilestoneInfo;
  backgroundClass: string;
  textClass: string;
  showDetails?: boolean;
  durationMs?: number;
};

const STATS_SNACKBAR_ID = "stats-snackbar";
const MILESTONE_SNACKBAR_ID = "milestone-snackbar";
const DISPLAY_FONT_STYLE: CSSProperties = {
  fontFamily: "var(--font-playpen-sans), system-ui, sans-serif",
  minWidth: "350px",
  textAlign: "center"
};

export function showStatsSnackbar({ eventType, count }: { eventType: "listened" | "viewed"; count: number }) {
  const emoji = eventType === "viewed" ? "👀" : "🎧";
  const label = `${count} phrase${count !== 1 ? "s" : ""} ${eventType}!`;

  return toast.custom(
    () => (
      <div
        className="text-base font-bold !bg-blue-600 !text-white !border-blue-600 shadow-lg px-5 py-3 rounded-lg"
        style={DISPLAY_FONT_STYLE}
      >
        {emoji} {label}
      </div>
    ),
    {
      id: STATS_SNACKBAR_ID,
      duration: 2000,
      className: "pointer-events-auto bg-transparent"
    }
  );
}

export function showMilestoneCelebrationSnackbar({
  milestoneInfo,
  backgroundClass,
  textClass,
  showDetails = false,
  durationMs = 3000
}: MilestoneCelebrationSnackbarOptions) {
  return toast.custom(
    () => (
      <div
        className={`${backgroundClass} px-6 py-5 rounded-2xl shadow-2xl border-3`}
        style={DISPLAY_FONT_STYLE}
      >
        <MilestoneCelebrationContent
          milestoneInfo={milestoneInfo}
          className="font-display"
          textClass={textClass}
          showDetails={showDetails}
          showIcons={false}
          showButton={false}
          size="sm"
        />
      </div>
    ),
    {
      id: MILESTONE_SNACKBAR_ID,
      duration: durationMs,
      className: "pointer-events-auto bg-transparent"
    }
  );
}
