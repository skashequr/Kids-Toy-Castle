import type { Metadata, Viewport } from "next";
import { Hind_Siliguri, Inter, Playfair_Display } from "next/font/google";
import "./globals.css";
import { ThemeInitializer } from "@/components/theme-initializer";
import { Toaster } from "@/components/ui/toaster";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { AnalyticsTracker } from "@/components/analytics-tracker";
import { SessionProvider } from "next-auth/react";
import { getStoreInformation, getTrackingSettings } from "@/server/services/settings";
import { StoreInformationProvider } from "@/components/store-information-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const hindSiliguri = Hind_Siliguri({
  subsets: ["bengali", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-hind-siliguri",
  display: "swap",
  preload: false,
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

export async function generateMetadata(): Promise<Metadata> {
  const store = await getStoreInformation();
  const title = store.tagline ? `${store.storeName} — ${store.tagline}` : store.storeName;
  return {
  title: {
    default: title,
    template: `%s | ${store.storeName}`,
  },
  description:
    store.tagline || store.storeName,
  keywords: [
    "kids toys Bangladesh",
    "children's toys BD",
    "toy castle",
    "educational toys",
    store.storeName,
  ],
  authors: [{ name: store.storeName }],
  creator: store.storeName,
  publisher: store.storeName,
  metadataBase: new URL("https://kidstoycastle.com"),
  openGraph: {
    type: "website",
    locale: "en_BD",
    siteName: store.storeName,
    title,
    description: store.tagline || store.storeName,
    images: [{ url: "/cover.png", width: 2014, height: 781, alt: store.storeName }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description: store.tagline || store.storeName,
    images: ["/cover.png"],
  },
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large" },
  },
  icons: {
    icon: store.favicon,
    shortcut: store.favicon,
  },
  manifest: "/manifest.json",
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#faf8ea" },
    { media: "(prefers-color-scheme: dark)", color: "#faf8ea" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [tracking, store] = await Promise.all([getTrackingSettings(), getStoreInformation()]);
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${hindSiliguri.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-ivory dark:bg-navy text-navy dark:text-ivory antialiased">
        <ThemeInitializer />
        <StoreInformationProvider store={store}>
          <SessionProvider>{children}</SessionProvider>
          <AnalyticsTracker
            googleAnalyticsId={tracking.googleAnalyticsId}
            facebookPixelId={tracking.facebookPixelId}
          />
          <CartDrawer />
          <Toaster />
        </StoreInformationProvider>
      </body>
    </html>
  );
}
