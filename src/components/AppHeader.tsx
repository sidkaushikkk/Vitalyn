import { SidebarTrigger } from "@/components/ui/sidebar";
import { Bell, Search, Command } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/80 px-6 backdrop-blur-xl transition-all">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="-ml-2 h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900" />
        
        <div className="hidden h-6 w-px bg-slate-200 sm:block" />
        
        <div className="hidden sm:block">
          <h1 className="text-sm font-semibold text-slate-900">
            Vitalyn
            <span className="ml-2 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              Time-to-Risk Intelligence
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Bar (Visual Only) */}
        <div className="hidden md:flex relative group">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <Input 
            placeholder="Search patient or record..." 
            className="w-64 h-9 pl-9 bg-slate-50 border-slate-200 focus-visible:ring-blue-500 focus-visible:ring-offset-0 transition-all hover:bg-white hover:border-slate-300"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
             <span className="text-[10px] font-medium text-slate-400 border border-slate-200 rounded px-1.5 py-0.5 bg-white">⌘K</span>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 mx-1" />

        <Button variant="ghost" size="icon" className="relative h-9 w-9 text-slate-500 hover:bg-slate-100 hover:text-slate-900">
          <Bell className="h-4 w-4" />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </Button>
        
        <div className="flex items-center gap-3 pl-1">
          <div className="hidden text-right text-xs sm:block">
            <p className="font-semibold text-slate-900">Dr. Sarah Chen</p>
            <p className="text-slate-500">Chief Resident</p>
          </div>
          <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shadow-md ring-2 ring-white">
            SC
          </div>
        </div>
      </div>
    </header>
  );
}
