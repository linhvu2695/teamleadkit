import {
    HStack,
    IconButton,
    Popover,
    Portal,
    Box,
} from "@chakra-ui/react";
import { FaFilter } from "react-icons/fa";
import { useWorkContext } from "@/context/work-ctx";
import { TaskTypeFilter } from "./task-filters/task-type-filter";
import { TaskAssigneeFilter } from "./task-filters/task-assignee-filter";

export const WorkFilter = () => {
    const {
        activeTypeFilters,
        setActiveTypeFilters,
        activeAssigneeFilters,
        setActiveAssigneeFilters,
        assignees,
    } = useWorkContext();

    const hasAssigneeFilter = assignees.length > 0;

    return (
        <Popover.Root positioning={{ placement: "bottom-start" }}>
            <Popover.Trigger asChild>
                <IconButton
                    aria-label="Filter tasks"
                    variant="ghost"
                    size="xs"
                    flexShrink={0}
                >
                    <FaFilter />
                </IconButton>
            </Popover.Trigger>
            <Portal>
                <Popover.Positioner>
                    <Popover.Content w={hasAssigneeFilter ? "auto" : "240px"} p={3}>
                        <Popover.Arrow>
                            <Popover.ArrowTip />
                        </Popover.Arrow>
                        <HStack align="start" gap={4}>
                            <TaskTypeFilter
                                selectedTypes={activeTypeFilters}
                                onSelectedTypesChange={setActiveTypeFilters}
                            />
                            {hasAssigneeFilter && (
                                <>
                                    <Box
                                        alignSelf="stretch"
                                        borderLeftWidth="1px"
                                        borderColor="border.default"
                                    />
                                    <TaskAssigneeFilter
                                        assignees={assignees}
                                        activeAssigneeFilters={activeAssigneeFilters}
                                        onAssigneeFilterChange={setActiveAssigneeFilters}
                                    />
                                </>
                            )}
                        </HStack>
                    </Popover.Content>
                </Popover.Positioner>
            </Portal>
        </Popover.Root>
    );
};
