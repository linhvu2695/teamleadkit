import { Box, HStack, Text, Spinner, VStack } from "@chakra-ui/react";
import { useMemo } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ReTooltip,
    ResponsiveContainer,
    ReferenceLine,
} from "recharts";
import { Chart, useChart } from "@chakra-ui/charts";
import type { TaskDetail } from "./work-types";
import { formatDate } from "./work-utils";
import { dateRange } from "@/utils/date-utils";
import { useWorkContext } from "@/context/work-ctx";
import { WorkFilter } from "./work-filter";

const parseDate = (value: string | null): Date | null => {
    if (!value) return null;
    const d = new Date(value);
    return isNaN(d.getTime()) ? null : d;
};

const toDateKey = (d: Date): string => d.toISOString().slice(0, 10);

export const WorkBurndownPanel = () => {
    const {
        selectedRootTask: rootTask,
        selectedDescendants: descendants,
        completeStatuses,
        isLoadingTree: isLoading,
        filteredTasks,
    } = useWorkContext();

    const isComplete = (task: TaskDetail) =>
        completeStatuses.has(task.status.toLowerCase());

    const { chartData, totalTasks, dateRangeLabel } = useMemo(() => {
        // Use filteredTasks; fall back to all tasks when filter excludes everything
        const candidateTasks = filteredTasks.length > 0
            ? filteredTasks
            : rootTask
                ? [rootTask, ...descendants]
                : [];
        const tasks = candidateTasks.filter(
            (t) => !t.status.toLowerCase().includes("obsolete")
        );
        if (tasks.length === 0) {
            return { chartData: [], totalTasks: 0, dateRangeLabel: "" };
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayKey = toDateKey(today);

        const allDates: Date[] = [today];
        for (const t of tasks) {
            const start = parseDate(t.estimated_start_date);
            const end = parseDate(t.estimated_end_date) ?? parseDate(t.estimated_completion_date);
            const completed = parseDate(t.completion_date);
            if (start) allDates.push(start);
            if (end) allDates.push(end);
            if (completed) allDates.push(completed);
        }

        const minDate = new Date(Math.min(...allDates.map((d) => d.getTime())));
        const maxDate = new Date(Math.max(...allDates.map((d) => d.getTime()), today.getTime()));

        const start = new Date(minDate);
        start.setDate(start.getDate() - 3);
        start.setHours(0, 0, 0, 0);
        const end = new Date(maxDate);
        end.setDate(end.getDate() + 7);
        end.setHours(23, 59, 59, 999);

        const dates = dateRange(start, end);
        const total = tasks.length;

        const data = dates.map((d) => {
            const key = toDateKey(d);
            const completedByDay = tasks.filter((t) => {
                if (!isComplete(t)) return false;
                const comp = parseDate(t.completion_date);
                return comp && toDateKey(comp) <= key;
            }).length;
            const remaining = total - completedByDay;
            const ideal = total - (total * (dates.indexOf(d) / Math.max(dates.length - 1, 1)));
            // Don't show actual remaining for future dates (not happened yet)
            const remainingDisplay = key <= todayKey ? Math.max(0, remaining) : null;
            return {
                date: key,
                displayDate: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
                remaining: remainingDisplay,
                ideal: Math.round(Math.max(0, ideal)),
            };
        });

        return {
            chartData: data,
            totalTasks: total,
            dateRangeLabel: `${formatDate(start.toISOString())} – ${formatDate(end.toISOString())}`,
        };
    }, [filteredTasks, rootTask, descendants, completeStatuses]);

    const chart = useChart({
        data: chartData,
        series: [
            { name: "remaining", color: "blue.500" },
            { name: "ideal", color: "gray.400" },
        ],
    });

    if (isLoading) {
        return (
            <VStack justify="center" align="center" h="200px">
                <Spinner size="lg" />
                <Text fontSize="sm" color="fg.muted">
                    Loading tasks...
                </Text>
            </VStack>
        );
    }

    if (!rootTask) {
        return (
            <Box
                p={8}
                textAlign="center"
                bg="bg.subtle"
                borderRadius="md"
                m={4}
                borderWidth="1px"
                borderColor="border.default"
            >
                <Text fontSize="sm" color="fg.muted">
                    Select a task from the list to view its burn down chart.
                </Text>
            </Box>
        );
    }

    if (chartData.length === 0) {
        return (
            <Box
                p={8}
                textAlign="center"
                bg="bg.subtle"
                borderRadius="md"
                m={4}
                borderWidth="1px"
                borderColor="border.default"
            >
                <Text fontSize="sm" color="fg.muted">
                    No tasks in scope to chart. Try clearing type/assignee filters or refresh data.
                </Text>
            </Box>
        );
    }

    const todayKey = toDateKey(new Date());

    return (
        <Box w="100%" h="100%" display="flex" flexDirection="column" overflow="hidden" bg="bg.panel">
            <HStack
                px={4}
                py={3}
                borderBottomWidth="1px"
                borderColor="border.default"
                flexShrink={0}
                gap={2}
            >
                <Text fontWeight="bold" fontSize="md" truncate flex={1}>
                    Burn Down — {rootTask.title || rootTask.identifier}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                    {totalTasks} tasks · {dateRangeLabel}
                </Text>
                <WorkFilter />
            </HStack>

            <Box flex={1} minH={0} p={4} overflowY="auto">
                <VStack align="stretch" gap={2} minH="min-content">
                    <Text fontSize="sm" color="fg.muted" flexShrink={0}>
                        Remaining tasks over time (task-count burn down). Ideal line assumes linear
                        progress.
                    </Text>
                    <Box h="350px" minH="300px" w="80%" position="relative" flexShrink={0}>
                        <Chart.Root chart={chart}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                                    <XAxis
                                        dataKey="displayDate"
                                        fontSize={11}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis fontSize={11} allowDecimals={false} domain={[0, "auto"]} />
                                    <ReTooltip
                                        cursor={{ strokeDasharray: "3 3" }}
                                        content={({ payload, label }) => {
                                            if (!payload?.length || !label) return null;
                                            const p = payload[0]?.payload as (typeof chartData)[0];
                                            return (
                                                <Box
                                                    bg="bg.panel"
                                                    borderWidth="1px"
                                                    borderColor="border.default"
                                                    borderRadius="md"
                                                    px={3}
                                                    py={2}
                                                    shadow="md"
                                                >
                                                    <Text fontSize="xs" fontWeight="bold" mb={1}>
                                                        {p.date}
                                                    </Text>
                                                    <VStack align="stretch" gap={0.5}>
                                                        <HStack justify="space-between" gap={4}>
                                                            <Text fontSize="xs" color="blue.500">
                                                                Remaining:
                                                            </Text>
                                                            <Text fontSize="xs" fontWeight="medium">
                                                                {p.remaining != null
                                                                    ? `${p.remaining} task${p.remaining !== 1 ? "s" : ""}`
                                                                    : "—"}
                                                            </Text>
                                                        </HStack>
                                                        <HStack justify="space-between" gap={4}>
                                                            <Text fontSize="xs" color="gray.400">
                                                                Ideal:
                                                            </Text>
                                                            <Text fontSize="xs" fontWeight="medium">
                                                                {p.ideal} task
                                                                {p.ideal !== 1 ? "s" : ""}
                                                            </Text>
                                                        </HStack>
                                                    </VStack>
                                                </Box>
                                            );
                                        }}
                                    />
                                    {chartData.some((d) => d.date === todayKey) && (
                                        <ReferenceLine
                                            x={chartData.find((d) => d.date === todayKey)!.displayDate}
                                            stroke="#e53e3e"
                                            strokeWidth={2}
                                            label={{ value: "Today", position: "top" }}
                                        />
                                    )}
                                    <Line
                                        type="monotone"
                                        dataKey="remaining"
                                        name="Remaining"
                                        stroke={chart.color("teal.500")}
                                        strokeWidth={2}
                                        dot={{ r: 3, fill: chart.color("teal.500"), stroke: "none" }}
                                        activeDot={{ r: 5, fill: chart.color("teal.500"), stroke: "none" }}
                                        connectNulls={false}
                                        isAnimationActive
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="ideal"
                                        name="Ideal"
                                        stroke={chart.color("gray.400")}
                                        strokeWidth={1.5}
                                        strokeDasharray="5 5"
                                        dot={false}
                                        isAnimationActive
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </Chart.Root>
                    </Box>
                </VStack>
            </Box>
        </Box>
    );
};
