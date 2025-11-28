import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Sidebar from "./components/Sidebar";

import Pms from "./pages/Pms";
import { ThemeProvider } from "./context/ThemeContext";
// import Analytics from "./pages/Analytics";
// import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import "./App.css";
import { fontFamily } from "./assets/fonts";
import PmsDetail from "./pages/PmsDetail"
import { GlobalProgressProvider } from "./context/GlobalProgressContext";
import GlobalProgressBar from "./components/GlobalProgressBar";

const App = () => {
  return (
    <ThemeProvider> 
      <div className="app" style={{ fontFamily }}>
        <BrowserRouter>
          <Sidebar />
          <GlobalProgressProvider>
            <GlobalProgressBar/>
          <Routes>
            {/* <Route path="/trend" element={<TrendPage />} /> */}
            {/* <Route path="/" element={<Navigate to="/pms" replace />} /> */}
            
            {/* <Route path="/Lotstatus" element={<Lotstatus />} /> */}
            <Route path="/" element={<Pms />} />
            <Route path="/pms/detail/:testId" element={<PmsDetail />} />
            {/* <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} /> */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          </GlobalProgressProvider>
        </BrowserRouter>
      </div>
    </ThemeProvider> 
  );
};

export default App;
