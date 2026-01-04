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
          </div>
        </nav>
        <main className="container mx-auto px-6 py-8 max-w-6xl">{children}</main>
      </body>
    </html>
  );
}
