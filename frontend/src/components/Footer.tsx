// src/components/Footer.tsx
function Footer() {
    return (
      <footer
        style={{
          borderTop: "1px solid rgba(15,23,42,0.85)",
          padding: "10px 16px 16px",
          fontSize: 12,
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            gap: 8,
          }}
        >
          <span>© {new Date().getFullYear()} Game Project</span>
          <span>DevOps / SRE playground</span>
        </div>
      </footer>
    );
  }
  
  export default Footer;