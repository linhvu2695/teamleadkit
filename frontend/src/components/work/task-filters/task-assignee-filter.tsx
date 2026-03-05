import { useRef } from "react";
import { Box, HStack, VStack, Text, Checkbox } from "@chakra-ui/react";
import { FaUser } from "react-icons/fa";

export interface TaskAssigneeFilterProps {
    assignees: string[];
    activeAssigneeFilters: Set<string> | null;
    onAssigneeFilterChange: (filters: Set<string> | null) => void;
}

export const TaskAssigneeFilter = ({
    assignees,
    activeAssigneeFilters,
    onAssigneeFilterChange,
}: TaskAssigneeFilterProps) => {
    const lastClickedAssigneeIndexRef = useRef<number | null>(null);

    const allAssigneesSelected =
        activeAssigneeFilters === null || assignees.every((a) => activeAssigneeFilters.has(a));

    const isAssigneeSelected = (name: string) =>
        activeAssigneeFilters === null || activeAssigneeFilters.has(name);

    const toggleAssignee = (name: string) => {
        if (activeAssigneeFilters === null) {
            const next = new Set(assignees);
            next.delete(name);
            onAssigneeFilterChange(next);
        } else {
            const next = new Set(activeAssigneeFilters);
            if (next.has(name)) {
                next.delete(name);
            } else {
                next.add(name);
            }
            if (assignees.every((a) => next.has(a))) {
                onAssigneeFilterChange(null);
            } else {
                onAssigneeFilterChange(next);
            }
        }
    };

    const toggleAllAssignees = () => {
        if (allAssigneesSelected) {
            onAssigneeFilterChange(new Set());
        } else {
            onAssigneeFilterChange(null);
        }
    };

    const selectExclusiveAssignee = (name: string) => {
        onAssigneeFilterChange(new Set([name]));
    };

    const handleAssigneeClick = (index: number, name: string, event: React.MouseEvent) => {
        if (event.shiftKey && lastClickedAssigneeIndexRef.current !== null) {
            const start = Math.min(lastClickedAssigneeIndexRef.current, index);
            const end = Math.max(lastClickedAssigneeIndexRef.current, index);
            const rangeNames = assignees.slice(start, end + 1);
            onAssigneeFilterChange(new Set(rangeNames));
        } else {
            selectExclusiveAssignee(name);
            lastClickedAssigneeIndexRef.current = index;
        }
    };

    return (
        <VStack align="stretch" gap={1} minW="140px">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
                Assignee
            </Text>

            <Checkbox.Root
                checked={allAssigneesSelected}
                onCheckedChange={toggleAllAssignees}
                size="sm"
            >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                    <Text fontSize="xs" fontWeight="medium">
                        All
                    </Text>
                </Checkbox.Label>
            </Checkbox.Root>

            <Box borderBottomWidth="1px" borderColor="border.default" my={1} />

            {assignees.map((name, index) => (
                <HStack
                    key={name}
                    gap={0}
                    cursor="pointer"
                    borderRadius="sm"
                    _hover={{ bg: { base: "gray.100", _dark: "gray.700" } }}
                    onClick={(e) => handleAssigneeClick(index, name, e)}
                >
                    <Checkbox.Root
                        checked={isAssigneeSelected(name)}
                        onCheckedChange={() => toggleAssignee(name)}
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                    </Checkbox.Root>
                    <HStack gap={1} flex={1} px={1}>
                        <Box color="fg.muted">
                            <FaUser size={10} />
                        </Box>
                        <Text fontSize="xs">{name}</Text>
                    </HStack>
                </HStack>
            ))}
        </VStack>
    );
};
