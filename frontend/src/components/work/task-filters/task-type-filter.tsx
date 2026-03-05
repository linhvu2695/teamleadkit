import { useRef } from "react";
import { Box, HStack, VStack, Text, Checkbox } from "@chakra-ui/react";
import { docSubTypeIcon, DOC_SUB_TYPES } from "../work-utils";

export interface TaskTypeFilterProps {
    selectedTypes: Set<string>;
    onSelectedTypesChange: (types: Set<string>) => void;
}

export const TaskTypeFilter = ({
    selectedTypes,
    onSelectedTypesChange,
}: TaskTypeFilterProps) => {
    const lastClickedTypeIndexRef = useRef<number | null>(null);
    const allTypesSelected = DOC_SUB_TYPES.every((t) => selectedTypes.has(t));

    const toggleType = (type: string) => {
        const next = new Set(selectedTypes);
        if (next.has(type)) {
            next.delete(type);
        } else {
            next.add(type);
        }
        onSelectedTypesChange(next);
    };

    const toggleAllTypes = () => {
        if (allTypesSelected) {
            onSelectedTypesChange(new Set());
        } else {
            onSelectedTypesChange(new Set(DOC_SUB_TYPES));
        }
    };

    const selectExclusiveType = (type: string) => {
        onSelectedTypesChange(new Set([type]));
    };

    const handleTypeClick = (index: number, type: string, event: React.MouseEvent) => {
        if (event.shiftKey && lastClickedTypeIndexRef.current !== null) {
            const start = Math.min(lastClickedTypeIndexRef.current, index);
            const end = Math.max(lastClickedTypeIndexRef.current, index);
            const rangeTypes = DOC_SUB_TYPES.slice(start, end + 1);
            onSelectedTypesChange(new Set(rangeTypes));
        } else {
            selectExclusiveType(type);
            lastClickedTypeIndexRef.current = index;
        }
    };

    return (
        <VStack align="stretch" gap={1} minW="200px">
            <Text fontSize="xs" fontWeight="semibold" color="fg.muted" mb={1}>
                Task type
            </Text>

            <Checkbox.Root checked={allTypesSelected} onCheckedChange={toggleAllTypes} size="sm">
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                    <Text fontSize="xs" fontWeight="medium">
                        All
                    </Text>
                </Checkbox.Label>
            </Checkbox.Root>

            <Box borderBottomWidth="1px" borderColor="border.default" my={1} />

            {DOC_SUB_TYPES.map((type, index) => {
                const { icon, color } = docSubTypeIcon(type);
                return (
                    <HStack
                        key={type}
                        gap={0}
                        cursor="pointer"
                        borderRadius="sm"
                        _hover={{ bg: { base: "gray.100", _dark: "gray.700" } }}
                        onClick={(e) => handleTypeClick(index, type, e)}
                    >
                        <Checkbox.Root
                            checked={selectedTypes.has(type)}
                            onCheckedChange={() => toggleType(type)}
                            size="sm"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control />
                        </Checkbox.Root>
                        <HStack gap={1} flex={1} px={1}>
                            {icon && <Box color={color}>{icon}</Box>}
                            <Text fontSize="xs">{type}</Text>
                        </HStack>
                    </HStack>
                );
            })}
        </VStack>
    );
};
