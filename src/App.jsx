import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Promptpay from "./pages/Promptpay";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/promptpay" element={<Promptpay />} />
    </Routes>
  );
}