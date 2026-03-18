import { Menu } from "@chakra-ui/react";
import type { ComponentType } from "react";

export interface ContextMenuItemProps {
    icon: ComponentType<{ style?: React.CSSProperties }>;
    text: string;
    onSelect: () => void;
}

/**
 * Abstract context menu item. Receives icon, text, and callback.
 */
export const ContextMenuItem = ({
    icon: Icon,
    text,
    onSelect,
}: ContextMenuItemProps) => {
    return (
        <Menu.Item
            value={text.toLowerCase().replace(/\s+/g, "-")}
            onSelect={onSelect}
            py={2}
            cursor="pointer"
            _hover={{ bg: { base: "teal.100", _dark: "teal.800" } }}
        >
            <Icon style={{ marginRight: "0.5rem", flexShrink: 0 }} />
            {text}
        </Menu.Item>
    );
};
