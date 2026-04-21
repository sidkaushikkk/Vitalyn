
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, Square, RefreshCw, PlayCircle } from "lucide-react";

interface AudioRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function AudioRecorder({ onRecordingComplete }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        onRecordingComplete(blob);
        
        // Stop tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const reset = () => {
    setAudioBlob(null);
  };

  const promptTitle = audioBlob
    ? "Voice sample saved"
    : isRecording
    ? "Recording in progress"
    : "Reading prompt";

  const promptText = audioBlob
    ? "You can redo the recording or submit your check-in."
    : "\"The quick brown fox jumps over the lazy dog.\"";

  return (
    <Card className="w-full max-w-lg mx-auto border-0 shadow-none bg-transparent">
      <CardContent className="p-0 flex flex-col items-center gap-8">
        <div className={`relative w-32 h-32 rounded-full flex items-center justify-center transition-all duration-500 ${isRecording ? "bg-red-50 shadow-2xl shadow-red-500/20 scale-110" : "bg-white shadow-xl shadow-slate-200/50"}`}>
          {isRecording && (
             <>
               <div className="absolute inset-0 rounded-full border-4 border-red-100 animate-[ping_2s_ease-in-out_infinite]"/>
               <div className="absolute inset-0 rounded-full border-2 border-red-50 animate-[ping_1.5s_ease-in-out_infinite_delay-200]"/>
             </>
          )}
          <Mic className={`h-12 w-12 transition-colors duration-300 ${isRecording ? "text-red-500" : "text-slate-400"}`} />
        </div>

        <div className="flex flex-col items-center gap-4 w-full max-w-xs">
          {!audioBlob ? (
            <Button
              size="lg"
              className={`w-full h-14 rounded-xl text-base font-bold shadow-lg transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 hover:scale-[1.02]'}`}
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? (
                <>
                  <Square className="mr-2 h-5 w-5 fill-current" /> Stop Recording
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" /> Start Voice Check
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 h-12 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 font-medium" onClick={reset}>
                <RefreshCw className="mr-2 h-4 w-4" /> Redo
              </Button>
              <Button className="flex-1 h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20">
                <PlayCircle className="mr-2 h-5 w-5" /> Saved
              </Button>
            </div>
          )}
        </div>
        
        <div className="bg-white/60 backdrop-blur p-4 rounded-xl border border-slate-200/60 text-center max-w-sm">
           <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
             {promptTitle}
           </p>
           <p className="text-lg font-medium text-slate-700 leading-relaxed font-serif italic">
            {promptText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
