import type { Metadata } from "next";
import { Fraunces, Manrope } from "next/font/google";
import Script from "next/script";
import { SiteFooter, SiteHeader } from "@/components/SiteChrome";
import "./globals.css";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-sans",
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
        description:
          "Private browser toolkit to apply or reduce the viral matcha green look on-device.",
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
      <body className={`${display.variable} ${sans.variable}`}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJson) }}
        />
        {/* Privacy-friendly analytics by Plausible */}
        <Script
          async
          src="https://plausible.shipsolo.io/js/pa-I3fncP_hihcj0SQKo2Teu.js"
          strategy="afterInteractive"
        />
        <Script id="plausible-init" strategy="afterInteractive">
          {`window.plausible=window.plausible||function(){(plausible.q=plausible.q||[]).push(arguments)},plausible.init=plausible.init||function(i){plausible.o=i||{}};
plausible.init()`}
        </Script>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-GZRT1YKE5C"
          strategy="afterInteractive"
        />
        <Script id="ga4-gtag" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-GZRT1YKE5C');`}
        </Script>
        {/* Microsoft Clarity */}
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`(function(c,l,a,r,i,t,y){
c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "xzfom2wtm3");`}
        </Script>
        <SiteHeader />
        <main>{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
