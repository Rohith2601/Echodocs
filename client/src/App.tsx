// src/App.tsx
import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import AiPlaygroundPage from "./pages/AiPlaygroundPage";

import Dashboard from "./pages/Dashboard";
import ViewPage from "./pages/ViewPage";
import PersonalEditorPage from "./pages/PersonalEditorPage";
import SharedEditorPage from "./pages/SharedEditorPage";

export default function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <div className="container">
          <header className="header">
            <div className="brand">
              <div className="logo">OT</div>
              <div className="title">
                <div className="main">OTDocs — Collaborative Editor</div>
                <div className="sub">
                  Personal & shared editors with timeline, stats and replay
                </div>
              </div>
            </div>

            <div className="header-actions">
              <Link to="/dashboard" className="btn">
                Dashboard
              </Link>
              <Link to="/personal/new" className="btn">
                New Personal
              </Link>
              <Link to="/shared/new" className="btn">
                New Shared
              </Link>
            </div>
          </header>

          <main style={{ marginTop: 18 }}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/personal/new" element={<PersonalEditorPage />} />
              <Route path="/personal/:id" element={<PersonalEditorPage />} />
              <Route path="/shared/new" element={<SharedEditorPage />} />
              <Route path="/shared/:id" element={<SharedEditorPage />} />
              <Route path="/view/:id" element={<ViewPage />} />
              <Route path="/ai" element={<AiPlaygroundPage />} />
            </Routes>
          </main>
        </div>
      </div>
    </BrowserRouter>
  );
}
