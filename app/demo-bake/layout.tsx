import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  title: "Demo bake (internal)",
};

export default function DemoBakeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
