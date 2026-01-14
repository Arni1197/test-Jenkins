// src/components/Navbar.tsx
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { logout } from "../api/auth";
import { useAuth } from "../api/AuthContext";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `text-sm px-3 py-1.5 rounded-full ${
    isActive
      ? "bg-[rgba(99,102,241,0.18)] text-white"
      : "text-[var(--text-muted)] hover:bg-[rgba(15,23,42,0.9)]"
  }`;

function Navbar() {
  const { user, loading, clearAuthLocal } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // ✅ твоя авторизация (адаптируй, если поле не userId)
  const isAuthed = !!user?.userId;

  // ✅ роут-логика для UI
  const isOnProfile = location.pathname.startsWith("/profile");
  const isOnAuthPage =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register");

  const handleLogout = async () => {
    try {
      await logout();
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      clearAuthLocal();
      navigate("/login");
    }
  };

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
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr", // ✅ ключ к “ровно и прямо”
          alignItems: "center",
          gap: 12,
          minHeight: 56,
        }}
      >
        {/* LEFT */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-start" }}>
          <Link to="/" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 999,
                background:
                  "radial-gradient(circle at 30% 20%, #facc15, #4f46e5)",
                flex: "0 0 auto",
              }}
            />
            <div style={{ display: "flex", flexDirection: "column", lineHeight: 1.15 }}>
              <span style={{ fontSize: 14, fontWeight: 600 }}>Game Project</span>
              <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
                DevOps playground
              </span>
            </div>
          </Link>
        </div>

        {/* CENTER */}
        <nav
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center", // ✅ центрируем именно nav
            gap: 6,
            flexWrap: "wrap",
          }}
        >
          <NavLink to="/catalog" className={navLinkClass}>
            Catalog
          </NavLink>

          {(isAuthed || isOnProfile) && (
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
          )}
        </nav>

        {/* RIGHT */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end", // ✅ всегда вправо
            gap: 8,
          }}
        >
          {loading ? null : isAuthed || isOnProfile ? (
            <button
              onClick={handleLogout}
              className="btn-soft"
              style={{ padding: "6px 10px", fontSize: 12, whiteSpace: "nowrap" }}
            >
              Sign out
            </button>
          ) : (
            !isOnAuthPage && (
              <NavLink to="/login" className={navLinkClass}>
                Sign in
              </NavLink>
            )
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;