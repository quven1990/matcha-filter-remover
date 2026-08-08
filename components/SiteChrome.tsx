import Link from "next/link";

const links = [
  { href: "/remove", label: "Remove" },
  { href: "/apply", label: "Apply" },
  { href: "/guide/what-is-matcha-filter", label: "Guide" },
];

export function SiteHeader() {
  return (
    <header className="site-header-wrap">
      <div className="site-header">
        <Link href="/" className="brand">
          <span className="brand-mark" aria-hidden />
          Matcha Filter
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="nav-link">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <p className="footer-brand">Matcha Filter</p>
        <p className="footer-tag">Free · Private · On-device</p>
      </div>
      <div className="footer-links">
        <Link href="/remove">Remove</Link>
        <Link href="/apply">Apply</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/cookie">Cookie</Link>
      </div>
      <p className="footer-note">
        Independent tool. Not affiliated with TikTok or its trademarks.
      </p>
    </footer>
  );
}
