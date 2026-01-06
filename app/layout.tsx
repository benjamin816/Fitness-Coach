import React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { StorageProviderComponent } from "../components/StorageContext";
import Navigation from "../components/Navigation";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Fitness Coach",
  description: "Adaptive fitness coaching for fat loss and muscle gain",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50`}>
        <StorageProviderComponent>
          <div className="flex flex-col min-h-screen pb-20 md:pb-0 md:pt-0">
            <header className="bg-white border-b px-4 py-3 sticky top-0 z-30 flex justify-between items-center md:hidden">
              <h1 className="text-xl font-bold text-blue-600">Fitness Coach</h1>
            </header>
            <Navigation />
            <main className="flex-grow p-4 md:p-8 max-w-4xl mx-auto w-full">
              {children}
            </main>
          </div>
        </StorageProviderComponent>
      </body>
    </html>
  );
}
