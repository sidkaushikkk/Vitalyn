import {
  LayoutDashboard,
  Users,
  HeartPulse,
  Bell,
  Settings,
  Activity,
  FileText,
  ShieldAlert
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "OPD Queue", url: "/opd-queue", icon: Users },
  { title: "Post-Op Monitoring", url: "/post-op", icon: HeartPulse },
  { title: "Risk Reports", url: "/reports", icon: FileText },
  { title: "Alerts", url: "/alerts", icon: Bell },
  { title: "System Health", url: "/system", icon: ShieldAlert },
  { title: "Settings", url: "/settings", icon: Settings },
];

export function AppSidebar() {
  return (
    <Sidebar className="border-r border-slate-200 bg-slate-50/80 backdrop-blur-xl">
      <SidebarHeader className="px-5 py-5 border-b border-slate-200/50">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-white shadow-lg shadow-blue-500/15 ring-1 ring-slate-200 overflow-hidden">
            <img
              src="/vitalyn.png"
              alt="Vitalyn logo"
              className="h-9 w-9 object-contain"
            />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900 leading-none">Vitalyn</p>
            <p className="text-[10px] font-medium text-slate-500 mt-1">Doctor Portal</p>
          </div>
        </div>
      </SidebarHeader>
      
      <SidebarContent className="px-3 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2 text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-1">
                  <SidebarMenuButton asChild className="h-auto py-1">
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-white hover:text-blue-600 hover:shadow-sm hover:translate-x-0.5"
                      activeClassName="bg-white text-blue-700 font-semibold shadow-sm ring-1 ring-slate-200/60"
                    >
                      <item.icon className="h-4.5 w-4.5" />
                      <span>{item.title}</span>
                      {item.title === "Alerts" && (
                        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 text-[10px] font-bold text-rose-600">
                          3
                        </span>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-slate-200/50">
         <div className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg shadow-slate-900/10">
            <div className="flex items-start gap-3">
               <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-white">
                  <Activity className="h-4 w-4" />
               </div>
               <div>
                  <p className="text-xs font-semibold text-white">System Status</p>
                  <div className="flex items-center gap-1.5 mt-1">
                     <span className="relative flex h-2 w-2">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                     </span>
                     <p className="text-[10px] text-slate-300">All Systems Operational</p>
                  </div>
               </div>
            </div>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}
