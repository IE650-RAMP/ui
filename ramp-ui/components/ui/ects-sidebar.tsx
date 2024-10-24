import {Calendar, Home, Inbox, Search, Settings} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from "@/components/ui/sidebar"
import {RadialChart} from "@/components/ui/radialChart";

// Menu items.
const items = [
    {
        title: "Planner",
        url: "/planner",
        icon: Home,
    },
    {
        title: "Search",
        url: "/search",
        icon: Search,
    },
    {
        title: "Calender",
        url: "#",
        icon: Calendar,
    },
    {
        title: "Settings",
        url: "#",
        icon: Settings,
    },
]

export function ECTSSidebar() {
    return (
        <Sidebar collapsible={"icon"} side={"right"}>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>ECTS</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <RadialChart />
                        <RadialChart/>
                        <RadialChart/>
                        <RadialChart/>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    )
}
