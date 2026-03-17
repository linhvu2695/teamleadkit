import {
    Dialog,
    Portal,
    Button,
    Input,
    VStack,
    Text,
    CloseButton,
} from "@chakra-ui/react";
import { useState } from "react";
import { toaster } from "@/components/ui/toaster";
import { setStoredLinkAuthToken } from "@/lib/work-api";

interface LinkAuthTokenDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export const LinkAuthTokenDialog = ({ isOpen, onClose }: LinkAuthTokenDialogProps) => {
    const [token, setToken] = useState("");

    const handleSubmit = () => {
        if (!token.trim()) {
            toaster.create({ description: "Token is required", type: "error" });
            return;
        }
        setStoredLinkAuthToken(token.trim());
        toaster.create({ description: "Link auth token saved", type: "success" });
        setToken("");
        onClose();
    };

    return (
        <Dialog.Root open={isOpen} onOpenChange={(e) => !e.open && onClose()} placement="center">
            <Portal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content maxW="md">
                        <Dialog.Header>
                            <Dialog.Title>Set Link Auth Token</Dialog.Title>
                        </Dialog.Header>
                        <Dialog.Body>
                            <VStack align="stretch" gap={3}>
                                <Text fontSize="sm" color="fg.muted">
                                    Enter the Orange Logic Link API token to use for work-related requests.
                                </Text>
                                <Input
                                    type="password"
                                    placeholder="Token"
                                    value={token}
                                    onChange={(e) => setToken(e.target.value)}
                                    autoComplete="off"
                                />
                            </VStack>
                        </Dialog.Body>
                        <Dialog.Footer>
                            <Button variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button onClick={handleSubmit}>
                                Save
                            </Button>
                        </Dialog.Footer>
                        <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                        </Dialog.CloseTrigger>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
};
