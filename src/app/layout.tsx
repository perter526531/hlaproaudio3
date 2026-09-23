import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { getSiteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const cfg = await getSiteConfig();
  return {
    title: {
      default: `${cfg.brand} | ${cfg.tagline}`,
      template: `%s | ${cfg.brand}`,
    },
    description: `${cfg.brand} - ${cfg.tagline}. ${cfg.address}`,
    keywords: ["专业音响", "扩声系统", "线阵列", "功放", "调音台", cfg.brand],
    authors: [{ name: cfg.brand }],
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen flex flex-col">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
