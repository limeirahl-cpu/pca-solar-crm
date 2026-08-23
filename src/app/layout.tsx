import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PCA Solar",
  description: "Sistema interno da PCA Solar — leads, orçamentos, clientes e usinas",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
