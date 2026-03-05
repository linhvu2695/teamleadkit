import { Container } from "@chakra-ui/react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Navbar from "./components/navbar";
import { Toaster } from "./components/ui/toaster";
import WorkPage from "./pages/work-page";
import TeamPage from "./pages/team-page";

export const BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
    return (
        <Container maxW={"1800px"}>
            <Toaster />
            <BrowserRouter>
                <Navbar />
                <Routes>
                    <Route path="/work" element={<WorkPage />} />
                    <Route path="/team" element={<TeamPage />} />
                    <Route path="*" element={<Navigate to="/work" replace />} />
                </Routes>
            </BrowserRouter>
        </Container>
    );
}

export default App;
