
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";

const formSchema = z.object({
  heartRate: z.coerce.number().min(30).max(220),
  systolic: z.coerce.number().min(50).max(250),
  diastolic: z.coerce.number().min(30).max(150),
  spo2: z.coerce.number().min(70).max(100),
  temp: z.coerce.number().min(30).max(45),
  pain: z.number().min(0).max(10),
  fatigue: z.number().min(0).max(10),
});

export type VitalsData = z.infer<typeof formSchema>;

interface VitalsFormProps {
  form: any; // ReturnType<typeof useForm<VitalsData>>
}

export function VitalsForm({ form }: VitalsFormProps) {
  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-blue-500 rounded-full"/> Vital Signs
              </h4>
              
              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="heartRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">Heart Rate</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" placeholder="72" />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M19 14c1.49-1.28 3.6-2.34 3.6-4.44C22.6 7.3 20.78 5.5 18.5 5.5c-2.42 0-3.26 1.63-4.18 2.8C13.4 9.4 13.1 10 12.4 10c-.7 0-1-.6-1.92-1.7C9.58 7.13 8.74 5.5 6.32 5.5 4.04 5.5 2.2 7.3 2.2 9.56c0 2.1 2.11 3.16 3.6 4.44L12 21l7-7z"/></svg>
                          </div>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">BPM</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="spo2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">SpO2</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" placeholder="98" />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                          </div>
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">%</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="systolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">Systolic BP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" placeholder="120" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">mmHg</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="diastolic"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">Diastolic BP</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input type="number" {...field} className="h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" placeholder="80" />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">mmHg</span>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="temp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-slate-600">Temperature</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input type="number" {...field} className="pl-9 h-11 bg-slate-50 border-slate-200 focus:bg-white transition-all text-lg font-medium" placeholder="36.5" />
                         <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"/></svg>
                          </div>
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">°C</span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
              <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <span className="w-1.5 h-4 bg-amber-500 rounded-full"/> Patient Reported
              </h4>

              <FormField
                control={form.control}
                name="pain"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-slate-600">Pain Level</FormLabel>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${field.value > 7 ? 'bg-red-100 text-red-700' : field.value > 4 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                        {field.value}/10
                      </span>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">0</span>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="flex-1 py-4"
                        />
                        <span className="text-xs font-bold text-slate-400">10</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-slate-400">Slide to adjust pain intensity</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="h-px bg-slate-100 my-4" />

              <FormField
                control={form.control}
                name="fatigue"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between mb-2">
                      <FormLabel className="text-slate-600">Fatigue Level</FormLabel>
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${field.value > 7 ? 'bg-indigo-100 text-indigo-700' : field.value > 4 ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'}`}>
                        {field.value}/10
                      </span>
                    </div>
                    <FormControl>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-slate-400">0</span>
                        <Slider
                          min={0}
                          max={10}
                          step={1}
                          value={[field.value]}
                          onValueChange={(vals) => field.onChange(vals[0])}
                          className="flex-1 py-4"
                        />
                        <span className="text-xs font-bold text-slate-400">10</span>
                      </div>
                    </FormControl>
                    <FormDescription className="text-xs text-slate-400">Slide to adjust fatigue level</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
