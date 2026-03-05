import { Box, VStack } from "@chakra-ui/react";
import { TaskTypeFilter } from "@/components/work/task-filters/task-type-filter";

interface TeamFilterPanelProps {
    selectedTypes: Set<string>;
    onSelectedTypesChange: (types: Set<string>) => void;
}

export const TeamFilterPanel = ({
    selectedTypes,
    onSelectedTypesChange,
}: TeamFilterPanelProps) => {
    return (
        <Box
            w="280px"
            flexShrink={0}
            borderLeftWidth="1px"
            borderColor="border.default"
            overflowY="auto"
            px={3}
            py={4}
        >
            <VStack align="stretch" gap={1}>
                <TaskTypeFilter
                    selectedTypes={selectedTypes}
                    onSelectedTypesChange={onSelectedTypesChange}
                />
            </VStack>
        </Box>
    );
};
