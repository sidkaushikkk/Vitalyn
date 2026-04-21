
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Camera, RefreshCw, CheckCircle, AlertTriangle } from "lucide-react";

interface VideoRecorderProps {
  onRecordingComplete: (blob: Blob) => void;
}

export function VideoRecorder({ onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [lightingQuality, setLightingQuality] = useState<"unknown" | "good" | "low">("unknown");
  const [circleOverlay, setCircleOverlay] = useState<{ left: number | string; top: number | string; size: number } | null>(null);
  const [fallbackCircleSize, setFallbackCircleSize] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    let interval: number | undefined;

    const measureBrightness = () => {
      const video = videoRef.current;
      if (!video || !video.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement("canvas");
      const width = 160;
      const height = Math.floor((video.videoHeight / video.videoWidth) * width);
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, width, height);
      const data = ctx.getImageData(0, 0, width, height).data;
      let total = 0;
      const len = data.length;
      for (let i = 0; i < len; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        total += 0.299 * r + 0.587 * g + 0.114 * b;
      }
      const avg = total / (len / 4);
      if (avg < 45) {
        setLightingQuality("low");
      } else {
        setLightingQuality("good");
      }
    };

    if (isCameraReady && !previewUrl) {
      interval = window.setInterval(measureBrightness, 800);
    } else {
      setLightingQuality("unknown");
    }

    return () => {
      if (interval !== undefined) {
        window.clearInterval(interval);
      }
    };
  }, [isCameraReady, previewUrl]);

  useEffect(() => {
    const update = () => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height) * 0.7;
      setFallbackCircleSize(size);
    };
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  useEffect(() => {
    let animationId: number | undefined;
    const video = videoRef.current;
    const FaceDetectorCtor = (window as any).FaceDetector;
    if (!isCameraReady || previewUrl || !video || !FaceDetectorCtor) {
      setCircleOverlay(null);
      return;
    }
    const detector = new FaceDetectorCtor({ fastMode: true, maxDetectedFaces: 1 });
    const loop = async () => {
      if (!video.videoWidth || !video.videoHeight) {
        animationId = window.requestAnimationFrame(loop);
        return;
      }
      try {
        const faces = await detector.detect(video);
        if (faces && faces.length > 0) {
          const box = faces[0].boundingBox;
          const centerX = box.x + box.width / 2;
          const centerY = box.y + box.height / 2;
          const size = Math.max(box.width, box.height) * 1.5;
          setCircleOverlay({ left: centerX, top: centerY, size });
        } else {
          setCircleOverlay(null);
        }
      } catch {
        setCircleOverlay(null);
      }
      animationId = window.requestAnimationFrame(loop);
    };
    animationId = window.requestAnimationFrame(loop);
    return () => {
      if (animationId !== undefined) {
        window.cancelAnimationFrame(animationId);
      }
    };
  }, [isCameraReady, previewUrl]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraReady(true);
        setLightingQuality("unknown");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
    }
  };

  const startRecording = () => {
    chunksRef.current = [];
    const stream = videoRef.current?.srcObject as MediaStream;
    if (!stream) return;

    const mediaRecorder = new MediaRecorder(stream);
    mediaRecorderRef.current = mediaRecorder;

    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      setRecordedBlob(blob);
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      onRecordingComplete(blob);
      
      // Stop all tracks to release camera
      stream.getTracks().forEach(track => track.stop());
      setIsCameraReady(false);
    };

    mediaRecorder.start();
    setIsRecording(true);
    
    // Auto-stop after 5 seconds
    setTimeout(() => {
      if (mediaRecorder.state === "recording") {
        stopRecording();
      }
    }, 5000);
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const reset = () => {
    setRecordedBlob(null);
    setPreviewUrl(null);
    setLightingQuality("unknown");
    startCamera();
  };

  const activeCircle = circleOverlay || (fallbackCircleSize > 0 ? { left: "50%", top: "50%", size: fallbackCircleSize } : null);

  return (
    <Card className="w-full max-w-lg mx-auto overflow-hidden border-0 shadow-none bg-transparent">
      <CardContent className="p-0 flex flex-col items-center gap-6">
        <div ref={containerRef} className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden flex items-center justify-center shadow-2xl ring-4 ring-slate-100 group">
          {previewUrl ? (
            <video src={previewUrl} controls className="w-full h-full object-cover" />
          ) : (
            <>
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transition-opacity duration-500 ${isRecording ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                onLoadedMetadata={() => videoRef.current?.play()}
              />
              {/* Overlay Grid */}
              <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                  <div className="border-r border-b border-white/50"></div>
                  <div className="border-r border-b border-white/50"></div>
                  <div className="border-b border-white/50"></div>
                  <div className="border-r border-b border-white/50"></div>
                  <div className="border-r border-b border-white/50"></div>
                  <div className="border-b border-white/50"></div>
                  <div className="border-r border-white/50"></div>
                  <div className="border-r border-white/50"></div>
                  <div className=""></div>
                </div>
              </div>
              {activeCircle && (
                <div className="absolute inset-0 pointer-events-none">
                  <div
                    className="border-2 border-white/40 rounded-full transition-all duration-300"
                    style={{
                      position: "absolute",
                      width: activeCircle.size,
                      height: activeCircle.size,
                      left: activeCircle.left,
                      top: activeCircle.top,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </div>
              )}
            </>
          )}
          
          {isRecording && (
             <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-sm px-3 py-1 rounded-full animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full"></div>
                <span className="text-xs font-bold text-white uppercase tracking-wider">REC</span>
             </div>
          )}
          
          {!previewUrl && !isRecording && !isCameraReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px] transition-all duration-300">
              <Button
                variant="secondary"
                className="z-10 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white border border-white/20 h-12 px-6 rounded-full font-medium"
                onClick={startCamera}
              >
                <Camera className="mr-2 h-5 w-5" /> Enable Camera
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 w-full items-center">
          {isCameraReady && !previewUrl && (
            <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-black/40 text-slate-100 backdrop-blur-sm shadow-sm">
              <AlertTriangle className={`h-3.5 w-3.5 ${lightingQuality === "low" ? "text-amber-300" : "text-emerald-300"}`} />
              <span>
                {lightingQuality === "low"
                  ? "Lighting looks dim. Move towards a light or window so we can read your face clearly."
                  : "Keep your face in the center circle with steady lighting for the most accurate scan."}
              </span>
            </div>
          )}

          <div className="flex gap-4 w-full justify-center">
          {!recordedBlob ? (
            <Button
              variant={isRecording ? "destructive" : "default"}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isCameraReady}
              className={`h-14 px-8 rounded-full text-base font-bold shadow-lg transition-all ${isRecording ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' : 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20 hover:scale-105'}`}
            >
              {isRecording ? (
                <span className="flex items-center"><span className="w-3 h-3 bg-white rounded-sm mr-2 animate-pulse"/> Stop Recording</span>
              ) : (
                "Record 5s Clip"
              )}
            </Button>
          ) : (
            <Button variant="outline" onClick={reset} className="h-12 px-6 rounded-full border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium">
              <RefreshCw className="mr-2 h-4 w-4" /> Retake Video
            </Button>
          )}
          
          {recordedBlob && (
            <div className="flex items-center bg-green-50 px-4 py-2 rounded-full border border-green-100 text-green-700 font-bold shadow-sm animate-in fade-in zoom-in duration-300">
              <CheckCircle className="mr-2 h-5 w-5 text-green-600" /> Capture Ready
            </div>
          )}
          </div>
        </div>
        <p className="text-sm text-slate-500 text-center max-w-xs">
          Please look directly at the camera. We analyze facial cues for fatigue and pain.
        </p>
      </CardContent>
    </Card>
  );
}
