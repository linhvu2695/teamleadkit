import {
    Box,
    VStack,
    HStack,
    Text,
    IconButton,
    Badge,
} from "@chakra-ui/react";
import { FaTimes } from "react-icons/fa";
import type { TaskDetail } from "../work-types";
import { statusColor, docSubTypeIcon } from "../work-utils";
import { useWorkContext } from "@/context/work-ctx";
import { ContextMenu } from "@/components/ui/context-menu";
import { ContextMenuItem } from "@/components/ui/context-menu-actions";
import { HiArrowPath } from "react-icons/hi2";

interface WorkTaskListItemProps {
    task: TaskDetail;
    isSelected: boolean;
}

export const WorkTaskListItem = ({ task, isSelected }: WorkTaskListItemProps) => {
    const { selectTask, removeTask, refreshTaskTree } = useWorkContext();
    const { icon: docIcon, color: docIconColor } = docSubTypeIcon(task.doc_sub_type);

    return (
        <ContextMenu
            content={
                <>
                    <ContextMenuItem
                        icon={HiArrowPath}
                        text="Refresh"
                        onSelect={() => refreshTaskTree(task.identifier)}
                    />
                    <ContextMenuItem
                        icon={FaTimes}
                        text="Remove"
                        onSelect={() => removeTask(task.identifier)}
                    />
                </>
            }
        >
        <HStack
            px={3}
            py={2}
            gap={2}
            cursor="pointer"
            bg={isSelected ? { base: "gray.100", _dark: "gray.800" } : undefined}
            _hover={{ bg: { base: "gray.50", _dark: "gray.900" } }}
            borderBottomWidth="1px"
            borderColor="border.default"
            onClick={() => selectTask(task.identifier)}
        >
            {docIcon && (
                <Box color={docIconColor} flexShrink={0}>
                    {docIcon}
                </Box>
            )}
            <VStack gap={0} align="start" flex={1} overflow="hidden">
                <Text fontSize="sm" fontWeight="medium" truncate w="100%">
                    {task.title || task.identifier}
                </Text>
                <HStack gap={1} flexWrap="wrap">
                    <Badge size="sm" variant="outline" colorPalette="gray">
                        {task.identifier}
                    </Badge>
                    <Badge
                        size="sm"
                        colorPalette={statusColor(task.status)}
                        variant="subtle"
                    >
                        {task.status || "—"}
                    </Badge>
                    {task.importance_for_next_release && (
                        <Badge
                            size="sm"
                            variant="subtle"
                            colorPalette={
                                task.importance_for_next_release.includes("1") ? "red"
                                : task.importance_for_next_release.includes("2") ? "yellow"
                                : task.importance_for_next_release.includes("3") ? "green"
                                : "gray"
                            }
                        >
                            {task.importance_for_next_release}
                        </Badge>
                    )}
                </HStack>
            </VStack>

            {/* Complexity tag */}
            {task.complexity != null && task.complexity > 0 && (
                <Box
                    display="inline-flex"
                    alignItems="center"
                    px={2}
                    py={0.5}
                    clipPath="polygon(0 50%, 6px 0, 100% 0, 100% 100%, 6px 100%)"
                    bg={
                        task.complexity >= 100 ? "red.100"
                        : task.complexity >= 50 ? "orange.100"
                        : "green.100"
                    }
                    color={
                        task.complexity >= 100 ? "red.700"
                        : task.complexity >= 50 ? "orange.700"
                        : "green.700"
                    }
                    title="Complexity"
                >
                    <Text fontSize="xs" fontWeight="bold">
                        {task.complexity % 1 === 0 ? task.complexity : task.complexity.toFixed(1)}
                    </Text>
                </Box>
            )}
        </HStack>
        </ContextMenu>
    );
};
