import type { Metadata } from "next";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toast";
import { appConfig } from "@/config/app-config";
import "./globals.css";

export const metadata: Metadata = {
  title: appConfig.name,
  description: appConfig.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="font-sans">
      <body>
        <Toaster>
          <TooltipProvider>{children}</TooltipProvider>
        </Toaster>
      </body>
    </html>
  );
}
