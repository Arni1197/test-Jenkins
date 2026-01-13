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
      // можно залогировать, но не блокируем выход
      console.error("Logout error", e);
    } finally {
      // 🔑 сразу чистим локальную auth-сессию
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
            <span style={{ fontSize: 11, color: "var(--text-muted)" }}>
              DevOps playground
            </span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <NavLink to="/catalog" className={navLinkClass}>
            Catalog
          </NavLink>

          {(isAuthed || isOnProfile) && (
            <NavLink to="/profile" className={navLinkClass}>
              Profile
            </NavLink>
          )}
        </nav>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Пока идёт первичная загрузка me() — можно вообще ничего не рендерить справа */}
          {loading ? null : isAuthed || isOnProfile ? (
            <button
              onClick={handleLogout}
              className="btn-soft"
              style={{ padding: "6px 10px", fontSize: 12 }}
            >
              Sign out
            </button>
          ) : (
            // На страницах /login и /register кнопку входа можно скрыть
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