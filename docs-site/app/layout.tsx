import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { PixelBackground } from "@/components/ui/pixel-background";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "UISchema - Standards-Aligned, Token-Efficient Generative UI IR",
  description: "Let users generate dashboards, widgets, apps, and data visualizations from prompts — safely constrained to components you define.",
  keywords: ["UISchema", "AI UI generation", "React components", "guardrails", "structured output"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <PixelBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
