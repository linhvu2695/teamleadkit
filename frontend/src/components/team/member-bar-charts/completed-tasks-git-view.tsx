import { useMemo, useState } from "react";
import { Box, HStack, VStack, Text } from "@chakra-ui/react";
import { useChart } from "@chakra-ui/charts";
import { Tooltip } from "@/components/ui/tooltip";
import { useColorModeValue } from "@/components/ui/color-mode";
import { DonutChart } from "@/components/ui/donut-chart";
import { dateRangeStrings, toDateKey, MONTH_LABELS, DOW_LABELS } from "@/utils/date-utils";
import { TaskAssigneeFilter } from "@/components/work/task-filters/task-assignee-filter";
import { TeamMemberTaskList } from "../team-member-task-list";
import type { MemberWorkload } from "../team-types";
import { getModulePieData } from "../team-utils";

/** GitHub-style green contribution levels - dark theme */
const CONTRIBUTION_COLORS_DARK = [
    "#161b22", "#0e4429", "#006d32", "#26a641", "#39d353", "#7ee787",
];

/** GitHub-style green contribution levels - light theme */
const CONTRIBUTION_COLORS_LIGHT = [
    "#ebedf0", "#9be9a8", "#40c463", "#30a14e", "#216e39", "#196127",
];

export interface CompletedTasksGitViewProps {
    workload: MemberWorkload[];
    startDate: string;
    endDate: string;
}

/**
 * maxTaskThreshold = selectedAssignees.length * 5. If 1 user selected, 5. If x users, x*5.
 * Buckets: 0 | 1..b1 | b1+1..b2 | ... | maxTaskThreshold+
 * where bucket boundaries split 1..maxTaskThreshold into 5 equal bands.
 */
function getContributionLevel(taskCount: number, maxTaskThreshold: number): number {
    if (taskCount <= 0) return 0;
    if (maxTaskThreshold <= 0) return taskCount > 0 ? 5 : 0;
    if (taskCount >= maxTaskThreshold) return 5;
    const bucketSize = Math.max(1, Math.floor(maxTaskThreshold / 5));
    if (taskCount <= bucketSize) return 1;
    if (taskCount <= 2 * bucketSize) return 2;
    if (taskCount <= 3 * bucketSize) return 3;
    if (taskCount <= 4 * bucketSize) return 4;
    return 5;
}

/**
 * Get label for a contribution level (for tooltip).
 */
function getLevelLabel(level: number, maxTaskThreshold: number): string {
    if (level === 0) return "0 tasks completed";
    if (maxTaskThreshold <= 0) return "1+ tasks completed";
    const bucketSize = Math.max(1, Math.floor(maxTaskThreshold / 5));
    if (level === 1) return `1–${bucketSize} task${bucketSize !== 1 ? "s" : ""} completed`;
    if (level === 2)
        return `${bucketSize + 1}–${2 * bucketSize} tasks completed`;
    if (level === 3)
        return `${2 * bucketSize + 1}–${3 * bucketSize} tasks completed`;
    if (level === 4)
        return `${3 * bucketSize + 1}–${4 * bucketSize} tasks completed`;
    return `${maxTaskThreshold}+ tasks completed`;
}

export const CompletedTasksGitView = ({
    workload,
    startDate,
    endDate,
}: CompletedTasksGitViewProps) => {
    const [activeAssigneeFilters, setActiveAssigneeFilters] = useState<Set<string> | null>(null);
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const contributionColors = useColorModeValue(CONTRIBUTION_COLORS_LIGHT, CONTRIBUTION_COLORS_DARK);
    const taskListHeaderBg = useColorModeValue("gray.100", "gray.800");

    const selectedAssignees = useMemo(() => {
        const all = workload.map((m) => m.name);
        if (activeAssigneeFilters === null) return all;
        return all.filter((a) => activeAssigneeFilters.has(a));
    }, [workload, activeAssigneeFilters]);

    const maxTaskThreshold = useMemo(() => {
        // Max task threhold formula
        return Math.max(1, Math.min(5, selectedAssignees.length)) * 5;
    }, [selectedAssignees.length]);

    const { gridRows, weekColumns, monthLabels } = useMemo(() => {
        const countsByDate: Record<string, number> = {};
        const membersToInclude = new Set(selectedAssignees);
        const isFiltering = activeAssigneeFilters !== null;
        for (const m of workload) {
            if (isFiltering && !membersToInclude.has(m.name)) continue;
            for (const task of m.tasks) {
                const key = toDateKey(task.completion_date);
                if (key) countsByDate[key] = (countsByDate[key] ?? 0) + 1;
            }
        }

        const allDates = dateRangeStrings(startDate, endDate);
        if (allDates.length === 0) {
            return { gridRows: [], weekColumns: [], monthLabels: [] };
        }

        const firstDate = new Date(allDates[0]);
        const lastDate = new Date(allDates[allDates.length - 1]);
        const firstSunday = new Date(firstDate);
        firstSunday.setDate(firstDate.getDate() - firstDate.getDay());
        const lastSunday = new Date(lastDate);
        lastSunday.setDate(lastDate.getDate() - lastDate.getDay());

        const weekStarts: string[] = [];
        const d = new Date(firstSunday);
        while (d <= lastSunday || weekStarts.length === 0) {
            weekStarts.push(d.toISOString().slice(0, 10));
            d.setDate(d.getDate() + 7);
        }

        const dateSet = new Set(allDates);
        const gridRows: { dateKey: string; count: number }[][] = [];
        for (let dow = 0; dow < 7; dow++) {
            const row: { dateKey: string; count: number }[] = [];
            for (const weekStart of weekStarts) {
                const weekDate = new Date(weekStart);
                weekDate.setDate(weekDate.getDate() + dow);
                const dateKey = weekDate.toISOString().slice(0, 10);
                if (dateSet.has(dateKey)) {
                    row.push({ dateKey, count: countsByDate[dateKey] ?? 0 });
                } else {
                    row.push({ dateKey: "", count: -1 });
                }
            }
            gridRows.push(row);
        }

        const monthLabels: { weekIndex: number; label: string }[] = [];
        let lastMonth = -1;
        weekStarts.forEach((ws, i) => {
            const m = new Date(ws).getMonth();
            if (m !== lastMonth) {
                lastMonth = m;
                monthLabels.push({ weekIndex: i, label: MONTH_LABELS[m] });
            }
        });

        return {
            gridRows,
            weekColumns: weekStarts,
            monthLabels,
        };
    }, [workload, selectedAssignees, activeAssigneeFilters, startDate, endDate]);

    const dowLabelIndices = useMemo(() => [1, 3, 5], []);

    const selectedDateTaskData = useMemo((): MemberWorkload | null => {
        if (!selectedDate) return null;
        const membersToInclude = new Set(selectedAssignees);
        const isFiltering = activeAssigneeFilters !== null;
        const tasks: MemberWorkload["tasks"] = [];
        for (const m of workload) {
            if (isFiltering && !membersToInclude.has(m.name)) continue;
            for (const task of m.tasks) {
                if (toDateKey(task.completion_date) === selectedDate) {
                    tasks.push(task);
                }
            }
        }
        if (tasks.length === 0) return null;
        const formattedDate = new Date(selectedDate).toLocaleDateString(undefined, {
            weekday: "long",
            month: "short",
            day: "numeric",
            year: "numeric",
        });
        return { name: formattedDate, tasks };
    }, [selectedDate, workload, selectedAssignees, activeAssigneeFilters]);

    const modulePieData = useMemo(
        () => getModulePieData(selectedDateTaskData?.tasks ?? []),
        [selectedDateTaskData]
    );

    const moduleChart = useChart({
        data: modulePieData,
        series: modulePieData.map((d) => ({ name: "value" as const, color: d.color })),
    });

    if (weekColumns.length === 0) {
        return (
            <Box
                py={8}
                display="flex"
                alignItems="center"
                justifyContent="center"
                borderRadius="lg"
                borderWidth="1px"
                borderColor="border.default"
                bg="bg.subtle"
            >
                <Text fontSize="sm" color="fg.muted">
                    No completed tasks with completion dates in this range
                </Text>
            </Box>
        );
    }

    const cellSize = 10;
    const cellGap = 10;

    const assignees = useMemo(() => workload.map((m) => m.name), [workload]);

    return (
        <>
        <HStack align="start" gap={4} width="100%">
            {/* Assignee Filter */}
            <TaskAssigneeFilter
                assignees={assignees}
                activeAssigneeFilters={activeAssigneeFilters}
                onAssigneeFilterChange={setActiveAssigneeFilters}
            />

            {/* Git View */}
            <VStack align="stretch" gap={2} flex={1} minW={0}>
                <Text fontSize="sm" fontWeight="semibold">
                    Tasks Completed per Day
                </Text>

                <Box overflowX="auto">
                    <VStack align="stretch" gap={12}>
                        {/* Single grid: month labels, day-of-week labels, and squares */}
                        <Box
                            display="grid"
                            gridTemplateColumns={`22px repeat(${weekColumns.length}, ${cellSize}px)`}
                            gridTemplateRows={`14px repeat(7, ${cellSize}px)`}
                            gap={cellGap}
                            w="100%"
                        >
                            {/* Month labels - row 1, columns 2+ */}
                            {weekColumns.map((_weekStart, colIdx) => {
                                const monthEntry = monthLabels.find((m) => m.weekIndex === colIdx);
                                return (
                                    <Box
                                        key={`month-${colIdx}`}
                                        gridColumn={colIdx + 2}
                                        gridRow={1}
                                        h={cellSize}
                                        display="flex"
                                        alignItems="flex-end"
                                        justifyContent="flex-start"
                                    >
                                        {monthEntry && (
                                            <Text fontSize="xs" color="fg.muted">
                                                {monthEntry.label}
                                            </Text>
                                        )}
                                    </Box>
                                );
                            })}
                            
                            {/* Day of week labels - column 1, rows 2-8 */}
                            {DOW_LABELS.map((label, rowIdx) => (
                                <Box
                                    key={label}
                                    gridColumn={1}
                                    gridRow={rowIdx + 2}
                                    display="flex"
                                    alignItems="center"
                                    pr={1}
                                >
                                    {dowLabelIndices.includes(rowIdx) ? (
                                        <Text fontSize="xs" color="fg.muted" lineHeight={1}>
                                            {label}
                                        </Text>
                                    ) : null}
                                </Box>
                            ))}
                            
                            {/* Squares - columns 2+, rows 2-8 */}
                            {gridRows.flatMap((row, rowIdx) =>
                                row.map((cell, colIdx) => {
                                    if (cell.dateKey === "") {
                                        return (
                                            <Box
                                                key={`empty-${rowIdx}-${colIdx}`}
                                                gridColumn={colIdx + 2}
                                                gridRow={rowIdx + 2}
                                                w={cellSize}
                                                h={cellSize}
                                                borderRadius="sm"
                                                bg="bg.subtle"
                                            />
                                        );
                                    }
                                    const level = getContributionLevel(cell.count, maxTaskThreshold);
                                    const color = contributionColors[level];
                                    const isSelected = selectedDate === cell.dateKey;
                                    return (
                                        <Tooltip
                                            key={`${cell.dateKey}-${rowIdx}-${colIdx}`}
                                            content={
                                                <VStack align="stretch" gap={0} py={1}>
                                                    <Text fontWeight="semibold">
                                                        {new Date(cell.dateKey).toLocaleDateString(undefined, {
                                                            weekday: "long",
                                                            month: "short",
                                                            day: "numeric",
                                                            year: "numeric",
                                                        })}
                                                    </Text>
                                                    <Text fontSize="xs" color="fg.muted">
                                                        {cell.count} task{cell.count !== 1 ? "s" : ""} completed
                                                    </Text>
                                                </VStack>
                                            }
                                        >
                                            <Box
                                                gridColumn={colIdx + 2}
                                                gridRow={rowIdx + 2}
                                                w={cellSize}
                                                h={cellSize}
                                                borderRadius="sm"
                                                bg={color}
                                                cursor="pointer"
                                                _hover={{ outline: "1px solid", outlineColor: "border.emphasized" }}
                                                outline={isSelected ? "2px solid" : undefined}
                                                outlineColor={isSelected ? "blue.500" : undefined}
                                                onClick={() => setSelectedDate((prev) => (prev === cell.dateKey ? null : cell.dateKey))}
                                            />
                                        </Tooltip>
                                    );
                                })
                            )}
                        </Box>

                        {/* Legend */}
                        <HStack gap={2} mt={1} align="center">
                            <Text fontSize="xs" color="fg.muted">
                                Less
                            </Text>
                            {contributionColors.map((color, level) => (
                                <Tooltip key={level} content={getLevelLabel(Number(level), maxTaskThreshold)}>
                                    <Box
                                        w={cellSize*0.5}
                                        h={cellSize*0.5}
                                        borderRadius="sm"
                                        bg={color}
                                    />
                                </Tooltip>
                            ))}
                            <Text fontSize="xs" color="fg.muted">
                                More
                            </Text>
                        </HStack>
                    </VStack>
                </Box>
            </VStack>
        </HStack>

        {/* Task List */}
        {selectedDateTaskData && (
            <HStack align="start" gap={6} wrap="wrap" mt={4} width="100%">
                {modulePieData.length > 0 && (
                    <VStack gap={2} align="center">
                        <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                            Module distribution
                        </Text>
                        <DonutChart
                            data={modulePieData}
                            chartHook={moduleChart}
                            total={selectedDateTaskData.tasks.length}
                            centerLabel={String(selectedDateTaskData.tasks.length)}
                            centerSublabel="tasks"
                            size={200}
                            innerRadius={50}
                            outerRadius={80}
                        />
                    </VStack>
                )}
                <Box flex={1} minW="280px">
                    <TeamMemberTaskList
                        memberData={selectedDateTaskData}
                        headerBg={taskListHeaderBg}
                        onClose={() => setSelectedDate(null)}
                        variant="completed"
                    />
                </Box>
            </HStack>
        )}
        </>
    );
};
