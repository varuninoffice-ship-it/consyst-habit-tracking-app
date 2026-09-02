import type { Metadata } from "next";
import { Plus_Jakarta_Sans, DM_Mono, Lora } from "next/font/google";
import ServiceWorkerRegistration from "@/components/pwa/ServiceWorkerRegistration";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-jakarta",
  display: "swap",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Consyst",
  description: "Consyst – Your personal operating system",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://consyst.app"),
  applicationName: "Consyst",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Consyst",
  },
  formatDetection: { telephone: false },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="theme-color" content="#111111" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body
        className={`${plusJakartaSans.variable} ${dmMono.variable} ${lora.variable} font-sans antialiased`}
      >
        <ServiceWorkerRegistration />
        {children}
      </body>
    </html>
  );
}
