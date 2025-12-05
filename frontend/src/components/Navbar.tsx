// src/components/Navbar.tsx
import { Link, NavLink } from "react-router-dom";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm px-3 py-1.5 rounded-full ${
    isActive
      ? "bg-[rgba(99,102,241,0.18)] text-white"
      : "text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.9)]"
  }`;

function Navbar() {
  return (
    <header
      style={{
        borderBottom: "1px solid rgba(148,163,184,0.18)",
        backdropFilter: "blur(18px)",
        background:
          "linear-gradient(to bottom, rgba(15,23,42,0.8), rgba(15,23,42,0.3))",
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifyContent: "space-between",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 999,
              background:
                "radial-gradient(circle at 30% 20%, #facc15, #4f46e5)",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>Game Project</span>
            <span
              style={{
                fontSize: 11,
                color: "var(--text-muted)",
              }}
            >
              DevOps playground
            </span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLink to="/catalog" className={navLinkClass}>
            Catalog
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            Profile
          </NavLink>
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <NavLink to="/login" className={navLinkClass}>
            Sign in
          </NavLink>
          <NavLink to="/register" className={navLinkClass}>
            Sign up
          </NavLink>
        </div>
      </div>
    </header>
  );
}

export default Navbar;