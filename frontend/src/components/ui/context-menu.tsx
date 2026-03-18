import { Box, Menu } from "@chakra-ui/react";
import type { ReactNode } from "react";

interface ContextMenuProps {
    children: ReactNode;
    content: ReactNode;
}

/**
 * Reusable context menu that opens on right-click.
 * Wrap any element as children; provide `content` for the menu items.
 */
export const ContextMenu = ({ children, content }: ContextMenuProps) => {
    return (
        <Menu.Root>
            <Box
                w="100%"
                onContextMenuCapture={(e) => e.preventDefault()}
            >
                <Menu.ContextTrigger asChild>
                    <Box as="span" display="block" w="100%">
                        {children}
                    </Box>
                </Menu.ContextTrigger>
            </Box>
            <Menu.Positioner>
                <Menu.Content
                    bg={{ base: "white/95", _dark: "gray.800/95" }}
                    backdropBlur="sm"
                    borderRadius="md"
                    borderWidth="1px"
                    borderColor={{ base: "gray.200/60", _dark: "gray.600/60" }}
                    boxShadow="lg"
                    py={1}
                    minW="160px"
                    zIndex={1000}
                >
                    {content}
                </Menu.Content>
            </Menu.Positioner>
        </Menu.Root>
    );
};
