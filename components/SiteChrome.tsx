import Link from "next/link";

const links = [
  { href: "/remove", label: "Remove" },
  { href: "/apply", label: "Apply" },
  { href: "/pricing", label: "Credits" },
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
        <p className="footer-tag">Free on-device · Optional AI credits</p>
      </div>
      <div className="footer-links">
        <Link href="/remove">Remove</Link>
        <Link href="/apply">Apply</Link>
        <Link href="/pricing">Credits</Link>
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
        <Link href="/refund">Refund</Link>
        <Link href="/cookie">Cookie</Link>
      </div>
      <div className="footer-badges">
        <a
          className="footer-badge"
          href="https://smollist.com/projects/matcha-filter?utm_source=badge"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://r2.direasy-multi-tenant.focusapps.app/uploads/616d0b1a-3979-4b8c-94d1-b4f1fedd3ead/1783046749147/q1b2bvmvyl/featured-on-light.svg"
            alt="Featured on Smol List"
            width={180}
            height={44}
          />
        </a>
        <a
          className="footer-badge"
          href="https://findly.tools/matcha-filter-remove?utm_source=matcha-filter-remove"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://findly.tools/badges/findly-tools-badge-light.svg"
            alt="Featured on Findly.tools"
            width={175}
            height={55}
          />
        </a>
        <a
          className="footer-badge"
          href="https://saastool.site/item/matcha-filter"
          target="_blank"
          rel="noopener noreferrer"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://saastool.site/badges/saastool-light.svg"
            alt="Featured on SaaSTool.site"
            width={175}
            height={54}
          />
        </a>
      </div>
      <p className="footer-note">
        Independent tool. Not affiliated with TikTok or its trademarks. Contact:{" "}
        <a href="mailto:contact@matchafilter.online">contact@matchafilter.online</a>
      </p>
    </footer>
  );
}
