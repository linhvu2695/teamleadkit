import type { TaskDetail } from "@/components/work/work-types";
import { MODULE_COLORS } from "./team-types";

export interface ModulePieDataItem {
    name: string;
    value: number;
    label: string;
    color: `${string}.${string}`;
}

/**
 * Extract module distribution from tasks for use in DonutChart.
 * Groups tasks by module and returns sorted pie chart data.
 */
export function getModulePieData(tasks: TaskDetail[] | readonly TaskDetail[]): ModulePieDataItem[] {
    if (!tasks?.length) return [];
    const counts: Record<string, number> = {};
    for (const t of tasks) {
        const mod = (t.module || "").trim() || "Uncategorized";
        counts[mod] = (counts[mod] ?? 0) + 1;
    }
    return Object.entries(counts)
        .sort(([, a], [, b]) => b - a)
        .map(([name, value], i) => ({
            name,
            value,
            label: `${value} task${value !== 1 ? "s" : ""}`,
            color: MODULE_COLORS[i % MODULE_COLORS.length] as `${string}.${string}`,
        }));
}
