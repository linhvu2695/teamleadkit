import { Box, Container, Flex, Text, IconButton } from "@chakra-ui/react";
import { ColorModeButton } from "@/components/ui/color-mode";
import { FaClipboardList, FaUsers } from "react-icons/fa";
import { Tooltip } from "@/components/ui/tooltip";
import { useNavigate, useLocation } from "react-router-dom";
import { SettingsPopover } from "@/components/settings/settings-popover";

function Navbar() {
    const navigate = useNavigate();
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <Container as="nav" maxW={"1800px"} paddingTop={1}>
            <Box
                px={4}
                my={4}
                borderRadius={5}
                bg="bg.subtle"
                borderWidth="1px"
                borderColor="border.default"
            >
                <Flex
                    h="16"
                    alignItems={"center"}
                    justifyContent={"space-between"}
                >
                    <Flex
                        alignItems={"center"}
                        justifyContent={"center"}
                        gap={3}
                        display={{ base: "none", sm: "flex" }}
                    >
                        <SettingsPopover />
                        <ColorModeButton />
                        <Text fontSize={"18px"} fontWeight={"bold"}>
                            TeamLeadKit
                        </Text>
                    </Flex>

                    <Flex gap={3} alignItems={"center"}>
                        <Tooltip content="Work" showArrow>
                            <IconButton
                                aria-label="Work management"
                                variant={isActive("/work") ? "solid" : "ghost"}
                                colorPalette={isActive("/work") ? "primary" : undefined}
                                size="xl"
                                onClick={() => navigate("/work")}
                            >
                                <FaClipboardList />
                            </IconButton>
                        </Tooltip>

                        <Tooltip content="Team" showArrow>
                            <IconButton
                                aria-label="Team"
                                variant={isActive("/team") ? "solid" : "ghost"}
                                colorPalette={isActive("/team") ? "primary" : undefined}
                                size="xl"
                                onClick={() => navigate("/team")}
                            >
                                <FaUsers />
                            </IconButton>
                        </Tooltip>
                    </Flex>
                </Flex>
            </Box>
        </Container>
    );
}

export default Navbar;
