// src/App.tsx
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import DocumentPage from "./pages/DocumentPage";

const Home: React.FC = () => {
  return (
    <div style={{ padding: "20px" }}>
      <h1>Welcome</h1>
      <p>Go to a sample document:</p>
      <Link to="/doc/123">
        <button>Open Document 123</button>
      </Link>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/doc/:id" element={<DocumentPage />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
