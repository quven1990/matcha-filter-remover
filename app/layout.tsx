import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import { ClientChunkRecovery } from "@/components/ClientChunkRecovery";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["600"],
  display: "swap",
  preload: true,
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://matchafilter.online"),
  title: {
    default: "Matcha Filter — Viral Matcha Look, Apply or Remove Online",
    template: "%s | Matcha Filter",
  },
  description:
    "Matcha Filter is a private browser toolkit to apply the viral matcha green effect or reduce it from photos and videos — free, on-device, no account.",
  openGraph: {
    title: "Matcha Filter",
    description: "Apply or reduce the viral matcha look — privately in your browser.",
    url: "https://matchafilter.online",
    siteName: "Matcha Filter",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Matcha Filter",
    description: "Apply or reduce the viral matcha look — privately in your browser.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    other: {
      "msvalidate.01": "63C70060680DDE1CA023E6A4658A163C",
    },
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const orgJson = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://matchafilter.online/#organization",
        name: "Matcha Filter",
        url: "https://matchafilter.online",
        logo: "https://matchafilter.online/icon-512.png",
        email: "contact@matchafilter.online",
        description:
          "Private browser toolkit to apply or reduce the viral matcha green look on-device.",
        contactPoint: [
          {
            "@type": "ContactPoint",
            email: "contact@matchafilter.online",
            contactType: "customer support",
          },
          {
            "@type": "ContactPoint",
            email: "privacy@matchafilter.online",
            contactType: "privacy inquiries",
          },
        ],
      },
      {
        "@type": "WebSite",
        "@id": "https://matchafilter.online/#website",
        url: "https://matchafilter.online",
        name: "Matcha Filter",
        publisher: { "@id": "https://matchafilter.online/#organization" },
        inLanguage: "en-US",
      },
    ],
  };

  return (
    <html lang="en">
      <head>
        {/* Runs before Next hydrates — layout chunk 404s never reach ClientChunkRecovery. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var k="mf_boot_reload";function go(){try{if(sessionStorage.getItem(k)==="1")return;sessionStorage.setItem(k,"1")}catch(e){}var u=new URL(location.href);u.searchParams.set("_mf",String(Date.now()));location.replace(u.toString())}window.addEventListener("error",function(e){var t=e&&e.target;if(t&&t.tagName==="SCRIPT"&&t.src&&t.src.indexOf("/_next/static/")!==-1)go();if(e&&e.message&&/Loading chunk|ChunkLoadError/i.test(e.message))go()},true);window.addEventListener("unhandledrejection",function(e){var r=e&&e.reason,m=r&&(r.message||r)||"";if(/Loading chunk|ChunkLoadError/i.test(String(m)))go()})})();`,
          }}
        />
      </head>
      <body className={`${display.variable} ${sans.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJson) }}
        />
        {/* Privacy-friendly analytics by Plausible — small, keep after first paint */}
        <Script
          async
          src="https://plausible.shipsolo.io/js/pa-I3fncP_hihcj0SQKo2Teu.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}
        </Script>
        {/* GTAG / Clarity parse into 100ms+ main-thread tasks. Wait until load + idle so they don't compete with hydration / first input. Plausible still covers the funnel. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function load(){if(document.getElementById("ga4-gtag-src"))return;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};window.gtag("js",new Date());window.gtag("config","G-GZRT1YKE5C");var g=document.createElement("script");g.id="ga4-gtag-src";g.async=true;g.src="https://www.googletagmanager.com/gtag/js?id=G-GZRT1YKE5C";document.head.appendChild(g);var c=document.createElement("script");c.id="clarity-src";c.async=true;c.src="https://www.clarity.ms/tag/xzfom2wtm3";document.head.appendChild(c)}function schedule(){setTimeout(function(){if("requestIdleCallback"in window)requestIdleCallback(load,{timeout:6000});else load()},2500)}if(document.readyState==="complete")schedule();else window.addEventListener("load",schedule,{once:true})})();`,
          }}
        />
        <ClientChunkRecovery />
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
