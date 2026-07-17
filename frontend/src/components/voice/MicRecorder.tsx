import { useCallback, useRef, useState } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MicRecorderProps {
  onBlobReady: (blob: Blob) => void;
  onError: (msg: string) => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function MicRecorder({ onBlobReady, onError, loading, disabled }: MicRecorderProps) {
  const [recording, setRecording] = useState(false);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    onError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      onError('माइक्रोफोन पहुँच अस्वीकृत। ब्राउजर सेटिङ जाँच गर्नुहोस्।');
    }
  }, [onError]);

  const stopRecording = useCallback(() => {
    const recorder = mediaRef.current;
    if (!recorder || recorder.state === 'inactive') {
      setRecording(false);
      return;
    }
    recorder.onstop = () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      setRecording(false);
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
      if (blob.size > 0) onBlobReady(blob);
    };
    recorder.stop();
  }, [onBlobReady]);

  return (
    <div className="flex flex-col items-center gap-6 py-6">
      <button
        type="button"
        disabled={disabled || loading}
        onClick={recording ? stopRecording : startRecording}
        className={cn(
          'relative flex h-28 w-28 items-center justify-center rounded-full transition-all disabled:opacity-50',
          recording
            ? 'bg-red-600 shadow-lg shadow-red-200 animate-pulse'
            : 'bg-[#E3182D] hover:bg-red-700 shadow-md'
        )}
      >
        {loading ? (
          <Loader2 className="h-10 w-10 text-white animate-spin" />
        ) : recording ? (
          <Square className="h-10 w-10 text-white fill-white" />
        ) : (
          <Mic className="h-12 w-12 text-white" />
        )}
      </button>
      <p className="text-sm text-slate-500 text-center max-w-sm">
        {loading
          ? 'ट्रान्सक्रिप्ट हुँदैछ…'
          : recording
            ? 'बोल्नुहोस्… रोक्न फेरि थिच्नुहोस्'
            : 'नेपालीमा बोल्नुहोस् — एक वा धेरै सामान (बिक्री/खरिद)'}
      </p>
    </div>
  );
}
