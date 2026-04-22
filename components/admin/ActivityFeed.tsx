import type { ActivityLog } from "@prisma/client";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedProps {
  entries: ActivityLog[];
}

const ACTION_COLORS: Record<string, string> = {
  SITE_SETTINGS_UPDATED: "bg-blue-100 text-blue-700",
  COURSE_CREATED: "bg-green-100 text-green-700",
  COURSE_UPDATED: "bg-green-100 text-green-700",
  COURSE_DELETED: "bg-red-100 text-red-700",
  USER_ROLE_CHANGED: "bg-purple-100 text-purple-700",
};

export function ActivityFeed({ entries }: ActivityFeedProps) {
  if (entries.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-line p-8 text-center">
        <p className="text-[13px] text-muted">No activity yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-line divide-y divide-line">
      {entries.map((entry) => {
        const colorClass = ACTION_COLORS[entry.action] ?? "bg-gray-100 text-gray-600";
        return (
          <div key={entry.id} className="flex items-start gap-3 px-5 py-3.5">
            <span className={`mt-0.5 px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wide shrink-0 ${colorClass}`}>
              {entry.action.replace(/_/g, " ")}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-ink font-medium truncate">
                {entry.entity}
                {entry.entityId ? ` · ${entry.entityId.slice(0, 8)}` : ""}
              </p>
            </div>
            <time className="text-[11.5px] text-muted shrink-0 tabular-nums">
              {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
            </time>
          </div>
        );
      })}
    </div>
  );
}
