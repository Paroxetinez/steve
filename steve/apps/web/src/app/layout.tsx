import type { Metadata, Viewport } from "next";
import { Inter, Montserrat, Lato } from "next/font/google";
import { cn } from "@/lib/utils";
import { cookies } from "next/headers";
import { SessionTokenProvider } from "@/lib/session-token-context";
import "./globals.css";
import ConvexClientProvider from "./ConvexClientProvider";
import { I18nProvider } from "@/lib/i18n";
import { webViewport } from "./viewportConfig";

const inter = Inter({ subsets: ["latin"] });
const montserrat = Montserrat({ subsets: ["latin"] });
const lato = Lato({ weight: "400", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Steve Chat",
  description: "Phone-password chat application powered by Convex.",
};

export const viewport: Viewport = webViewport;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialSessionToken = (await cookies()).get("steve_session")?.value ?? null;

  return (
    <html lang="en">
      <body className={cn(inter.className, montserrat.className, lato.className)}>
        <ConvexClientProvider>
          <SessionTokenProvider initialSessionToken={initialSessionToken}>
            <I18nProvider>{children}</I18nProvider>
          </SessionTokenProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
