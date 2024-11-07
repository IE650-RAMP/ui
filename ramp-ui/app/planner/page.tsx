'use client';

import Image from "next/image";
import { RadialChart } from "@/components/ui/radialChart";
import { Card, CardHeader } from "@/components/ui/card";
import { Car } from "lucide-react";
import { ECTSSidebar } from "@/components/ui/ects-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ModulePlanner } from "@/components/ui/module-planner";

export default function Planner() {
    return (
        <div className="grid grid-cols-2 gap-4">
            <ModulePlanner />
        </div>
    );
}