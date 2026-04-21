import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell, Shield, Database, User, Globe, Moon, Save } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fdfbf6]">
              System Configuration
            </h2>
            <p className="text-sm sm:text-base text-[#f1ede2]/90">
              Manage your workspace preferences and system parameters
            </p>
          </div>
          <Button className="bg-[#fdfbf6] text-[#111322] hover:bg-[#f1ede2] border border-[#111322]/40 shadow-[0_10px_30px_rgba(6,10,40,0.35)] rounded-full px-5">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </div>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="bg-white p-1 border border-slate-200 rounded-xl mb-6 h-12">
            <TabsTrigger value="general" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4">General</TabsTrigger>
            <TabsTrigger value="clinical" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4">Clinical Thresholds</TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4">Notifications</TabsTrigger>
            <TabsTrigger value="api" className="rounded-lg data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900 px-4">API & Integrations</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-blue-500" /> User Profile
                </CardTitle>
                <CardDescription>Manage your personal account settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input defaultValue="Dr. Sarah Chen" className="bg-slate-50 border-slate-200" />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input defaultValue="Chief Resident" disabled className="bg-slate-100 text-slate-500" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input defaultValue="sarah.chen@hospital.org" className="bg-slate-50 border-slate-200" />
                </div>
              </CardContent>
            </Card>
             
            <Card className="border-0 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="h-5 w-5 text-indigo-500" /> Interface
                </CardTitle>
                <CardDescription>Customize your dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Dark Mode</Label>
                     <p className="text-sm text-slate-500">Switch between light and dark themes</p>
                   </div>
                   <Switch />
                </div>
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Compact Mode</Label>
                     <p className="text-sm text-slate-500">Reduce padding and font sizes for high density</p>
                   </div>
                   <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="clinical" className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-rose-500" /> Risk Analysis Parameters
                </CardTitle>
                <CardDescription>Configure sensitivity for Time-to-Risk predictions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Critical Threshold (minutes)</Label>
                      <Input type="number" defaultValue={30} className="bg-slate-50 border-slate-200" />
                      <p className="text-xs text-slate-500">Alert triggers when predicted risk is within this window</p>
                    </div>
                    <div className="space-y-2">
                      <Label>Warning Threshold (minutes)</Label>
                      <Input type="number" defaultValue={120} className="bg-slate-50 border-slate-200" />
                    </div>
                 </div>
                 <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                   <div className="space-y-0.5">
                     <Label className="text-base">Auto-Escalation</Label>
                     <p className="text-sm text-slate-500">Automatically flag patients with rapid deterioration</p>
                   </div>
                   <Switch defaultChecked />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-6">
             <Card className="border-0 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Bell className="h-5 w-5 text-amber-500" /> Alert Preferences
                </CardTitle>
                <CardDescription>Manage how you receive critical updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Push Notifications</Label>
                     <p className="text-sm text-slate-500">Receive browser notifications for critical alerts</p>
                   </div>
                   <Switch defaultChecked />
                </div>
                 <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Audio Alerts</Label>
                     <p className="text-sm text-slate-500">Play sound for high-priority events</p>
                   </div>
                   <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                   <div className="space-y-0.5">
                     <Label className="text-base">Email Summaries</Label>
                     <p className="text-sm text-slate-500">Daily digest of shift analytics</p>
                   </div>
                   <Switch />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api" className="space-y-6">
            <Card className="border-0 shadow-sm ring-1 ring-slate-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Database className="h-5 w-5 text-emerald-500" /> Backend Connection
                </CardTitle>
                <CardDescription>Configure connection to the ML inference engine</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>API Endpoint</Label>
                  <Input defaultValue="https://api.waitless.ai/v1" className="font-mono bg-slate-50 border-slate-200" />
                </div>
                <div className="space-y-2">
                  <Label>Refresh Rate (seconds)</Label>
                  <Input type="number" defaultValue={30} className="bg-slate-50 border-slate-200" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
