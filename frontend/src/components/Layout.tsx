// src/components/Layout.tsx
import { ReactNode } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

interface Props {
  children: ReactNode;
}

function Layout({ children }: Props) {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="app-main">
        <div className="app-main-inner">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export default Layout;