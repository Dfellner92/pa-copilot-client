import "./globals.css";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { DarkModeToggle } from "@/components/theme/DarkModeToggle";

export const metadata: Metadata = {
  title: "PA Copilot",
  description: "Frontend",
};

const getInitialTheme = async (): Promise<"light" | "dark"> => {
  const c = (await cookies()).get("theme")?.value;
  return c === "dark" ? "dark" : "light";
};

const RootLayout = async ({ children }: { children: React.ReactNode }) => {
  const initialTheme = await getInitialTheme();
  // render correct class on first paint to avoid flash
  return (
    <html
      lang="en"
      className={initialTheme === "dark" ? "dark" : ""}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-white dark:bg-black text-black dark:text-white">
        <ThemeProvider initialTheme={initialTheme}>
          {/* Main */}
          <div className="flex-1 flex flex-col">
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-black">
              <h1 className="font-semibold text-black dark:text-white">
                PA Copilot
              </h1>
              <DarkModeToggle />
            </header>
            <main className="flex-1 bg-white dark:bg-black">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
};

export default RootLayout;
