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
      <div style={{
        ...DISPLAY_FONT_STYLE, display: 'flex', alignItems: 'center'
      }}>
        <div
          style={{ margin: '0 auto' }}
          className="flex text-base font-bold !bg-primary !text-white !border-blue-600 shadow-lg px-5 py-3 rounded-lg"
        >
          <div className="mr-2">{emoji}</div> {label}
        </div>
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

export function showListCompletionSnackbar({ eventType, durationMs = 3000 }: { eventType: "listened" | "viewed"; durationMs?: number }) {
  const emoji = "🎉";
  const label = eventType === "viewed" ? "List completed! Looping..." : "List completed! Looping...";

  return toast.custom(
    () => (
      <div style={{
        ...DISPLAY_FONT_STYLE, display: 'flex', alignItems: 'center'
      }}>
        <div
          style={{ margin: '0 auto' }}
          className="flex text-base font-bold !bg-green-600 !text-white !border-green-700 shadow-lg px-5 py-3 rounded-lg"
        >
          <div className="mr-2">{emoji}</div> {label}
        </div>
      </div>
    ),
    {
      id: "list-completion-snackbar",
      duration: durationMs,
      className: "pointer-events-auto bg-transparent"
    }
  );
}
