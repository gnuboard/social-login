import "./globals.css";
import { Metadata } from "next";
import { Inter } from "next/font/google";
import Header from "@/components/Header";
import Providers from "@/components/Providers";

const inter = Inter({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DevWant - 개발자 커뮤니티",
  description: "개발자들을 위한 커뮤니티 플랫폼",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('');
  console.log('');
  return (
    <html lang="ko" className="h-full">
      <body className={`${inter.className} h-full`}>
        <div className="min-h-screen flex flex-col">
          <Providers>
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </Providers>
        </div>
      </body>
    </html>
  );
}
