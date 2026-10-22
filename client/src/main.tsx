import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "@fontsource/barlow/latin-400.css";
import "@fontsource/barlow/latin-500.css";
import "@fontsource/barlow/latin-600.css";
import "@fontsource/barlow-condensed/latin-600.css";
import "@fontsource/courier-prime/latin-400.css";
import "@fontsource/courier-prime/latin-700.css";
import ProtocolLab from "@/features/protocol-lab/protocol-lab";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ProtocolLab />
  </StrictMode>,
);
