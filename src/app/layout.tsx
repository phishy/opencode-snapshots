import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenCode Snapshots",
  description: "Browse and restore OpenCode snapshots",
};

function OpenCodeLogo() {
  return (
    <svg width="156" height="28" viewBox="0 0 234 42" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H30V6H6V36H30V42H0V0Z" fill="#4B4646"/>
      <path d="M12 12H18V30H12V12Z" fill="#4B4646"/>
      <path d="M6 6H12V12H6V6Z" fill="#B7B1B1"/>
      <path d="M18 6H24V12H18V6Z" fill="#B7B1B1"/>
      <path d="M6 30H12V36H6V30Z" fill="#B7B1B1"/>
      <path d="M18 30H24V36H18V30Z" fill="#B7B1B1"/>
      
      <path d="M36 0H66V6H42V18H60V24H42V36H66V42H36V0Z" fill="#4B4646"/>
      <path d="M42 6H48V12H42V6Z" fill="#B7B1B1"/>
      <path d="M48 12H54V18H48V12Z" fill="#B7B1B1"/>
      <path d="M42 30H48V36H42V30Z" fill="#B7B1B1"/>
      
      <path d="M72 0H102V6H78V18H96V24H78V42H72V0Z" fill="#4B4646"/>
      <path d="M78 6H84V12H78V6Z" fill="#B7B1B1"/>
      <path d="M84 12H90V18H84V12Z" fill="#B7B1B1"/>
      
      <path d="M108 0H138V6H114V18H132V24H114V42H108V0Z" fill="#4B4646"/>
      <path d="M114 6H120V12H114V6Z" fill="#B7B1B1"/>
      <path d="M120 12H126V18H120V12Z" fill="#B7B1B1"/>
      <path d="M126 18H132V24H126V18Z" fill="#B7B1B1"/>
      
      <path d="M144 0H174V6H150V36H174V42H144V0Z" fill="#4B4646"/>
      <path d="M156 12H162V30H156V12Z" fill="#4B4646"/>
      <path d="M150 6H156V12H150V6Z" fill="#F1ECEC"/>
      <path d="M162 6H168V12H162V6Z" fill="#F1ECEC"/>
      <path d="M150 30H156V36H150V30Z" fill="#F1ECEC"/>
      <path d="M162 30H168V36H162V30Z" fill="#F1ECEC"/>
      
      <path d="M180 0H210V6H186V18H204V24H186V42H180V0Z" fill="#4B4646"/>
      <path d="M186 6H192V12H186V6Z" fill="#F1ECEC"/>
      <path d="M192 12H198V18H192V12Z" fill="#F1ECEC"/>
      <path d="M186 30H192V36H186V30Z" fill="#F1ECEC"/>
      <path d="M192 24H198V30H192V24Z" fill="#F1ECEC"/>
      <path d="M198 30H204V36H198V30Z" fill="#F1ECEC"/>
      
      <path d="M216 0H234V42H228V6H222V42H216V0Z" fill="#4B4646"/>
      <path d="M222 6H228V12H222V6Z" fill="#F1ECEC"/>
      <path d="M222 18H228V24H222V18Z" fill="#F1ECEC"/>
      <path d="M222 30H228V36H222V30Z" fill="#F1ECEC"/>
    </svg>
  );
}

function LogoMark() {
  return (
    <svg width="16" height="20" viewBox="0 0 240 300" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 0H240V60H60V240H240V300H0V0Z" fill="#4B4646"/>
      <path d="M60 60H120V120H60V60Z" fill="#F1ECEC"/>
      <path d="M120 60H180V120H120V60Z" fill="#F1ECEC"/>
      <path d="M60 180H120V240H60V180Z" fill="#F1ECEC"/>
      <path d="M120 180H180V240H120V180Z" fill="#F1ECEC"/>
      <path d="M120 120H180V180H120V120Z" fill="#4B4646"/>
    </svg>
  );
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-oc-bg-base text-oc-text-base">
        <nav className="border-b border-oc-border-subtle px-6 py-4">
          <div className="flex items-center justify-between max-w-6xl mx-auto">
            <a href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <LogoMark />
              <span className="text-sm font-medium text-oc-text-weak">snapshots</span>
            </a>
            <div className="flex items-center gap-4">
              <a
                href="/search"
                className="flex items-center gap-2 text-sm text-oc-text-weak hover:text-oc-text-base transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
                Search
              </a>
              <a
                href="https://github.com/phishy/opencode-snapshots"
                target="_blank"
                rel="noopener noreferrer"
                className="text-oc-text-weak hover:text-oc-text-base transition-colors"
                title="View on GitHub"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>
          </div>
        </nav>
        <main className="container mx-auto px-6 py-8 max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
