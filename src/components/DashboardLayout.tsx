import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="relative z-10 flex min-h-screen w-full bg-gradient-to-b from-[#3a3e61] via-[#3a3e61] to-[#f1ede2]">
        <AppSidebar />
        <div className="flex flex-1 flex-col relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#3a3e61] via-[#4c5591] to-[#f1ede2]/40 -z-10" />
          <AppHeader />
          <main className="flex-1 overflow-auto p-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
