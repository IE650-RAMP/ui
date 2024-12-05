// RootLayout.tsx

import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import React from "react";

const geistSans = localFont({
    src: "./fonts/GeistVF.woff",
    variable: "--font-geist-sans",
    weight: "100 900",
});
const geistMono = localFont({
    src: "./fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
    weight: "100 900",
});

export const metadata: Metadata = {
    title: "RAMP",
    description: "Rapid Assisted Module Planner",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased flex`}
            >
                <SidebarProvider>
                    {/* Flex Container */}
                    <div className="flex flex-grow min-h-screen">
                        {/* Sidebar */}
                        <AppSidebar />

                        {/* Main Content */}
                        <main className="flex-grow p-4 overflow-x-hidden">
                            {/* Sidebar Trigger */}
                            <div className="mb-4">
                                <SidebarTrigger />
                            </div>
                            {/* Page Content */}
                            {children}
                        </main>
                    </div>
                </SidebarProvider>
            </body>
            <script defer data-domain="ramp.h4hn.de" src="https://analytics.teckdigital.de/js/script.js"></script>
        </html>
    );
}
