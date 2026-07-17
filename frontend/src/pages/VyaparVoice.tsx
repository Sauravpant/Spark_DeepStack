import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useProducts } from "@/hooks/useInventory";
import { useCustomers } from "@/hooks/useCustomers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  transcribeAudio,
  extractVoiceTransactions,
  confirmVoiceWithAudio,
} from "@/services/voice.service";
import { queryClient } from "@/lib/queryClient";
import type {
  VoiceConfirmPayload,
  VoiceAction,
} from "@/services/voice.service";
import {
  Mic,
  MicOff,
  Volume2,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Play,
  RotateCcw,
  Sparkles,
  User,
  Calendar,
  AlertCircle,
  Loader2,
  Wand2,
  ShoppingCart,
  Package,
  ChevronRight,
  Zap,
} from "lucide-react";
import toast from "react-hot-toast";

interface EditableTransactionItem {
  spoken_product: string;
  quantity: number;
  unit?: string | null;
  product_id: string | null;
  product_name: string;
  stock_quantity: number | null;
  match_confidence: "high" | "none";
}

interface EditableTransaction {
  action: VoiceAction;
  customer_name?: string | null;
  customer_id?: string | null;
  payment_type: string;
  due_date?: string | null;
  notes?: string | null;
  items: EditableTransactionItem[];
}

export default function VyaparVoice() {
  const { activeShop } = useAuth();
  const shopId = activeShop?.id || "";

  const { data: catalogProducts = [] } = useProducts(shopId);
  const { data: customerList = [] } = useCustomers(shopId);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);

  const [manualText, setManualText] = useState("");
  const [rawTranscript, setRawTranscript] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [transactions, setTransactions] = useState<EditableTransaction[]>([]);

  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [processedCount, setProcessedCount] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Audio analyzer canvas references
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isRecording) {
      setRecordingTime(0);
      interval = setInterval(() => setRecordingTime((p) => p + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  // Clean up visualization on unmount/stop
  const cleanupVisualizer = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      if (audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
      audioContextRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      cleanupVisualizer();
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
    };
  }, []);

  // Live frequency drawing effect
  useEffect(() => {
    if (isRecording && canvasRef.current && analyserRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const analyser = analyserRef.current;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      let active = true;
      const draw = () => {
        if (!active) return;
        animationFrameRef.current = requestAnimationFrame(draw);

        analyser.getByteFrequencyData(dataArray);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const width = canvas.width;
        const height = canvas.height;
        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const val = dataArray[i];
          const percent = val / 255;
          const barHeight = Math.max(3, percent * height * 0.9);

          // Premium solid red/slate theme bars
          ctx.fillStyle = `rgba(227, 24, 45, ${0.4 + percent * 0.6})`;

          // Center vertically
          const y = (height - barHeight) / 2;

          ctx.beginPath();
          if (typeof (ctx as any).roundRect === "function") {
            (ctx as any).roundRect(x, y, barWidth - 2.5, barHeight, 2);
          } else {
            ctx.rect(x, y, barWidth - 2.5, barHeight);
          }
          ctx.fill();

          x += barWidth;
        }
      };

      draw();
      return () => {
        active = false;
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isRecording]);

  const playConfirmationAudio = () => {
    if (!audioUrl) return;
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      setIsPlayingAudio(false);
    }
    const audio = new Audio(audioUrl);
    audioPlayerRef.current = audio;
    audio.onplay = () => setIsPlayingAudio(true);
    audio.onended = () => setIsPlayingAudio(false);
    audio.onerror = () => setIsPlayingAudio(false);
    audio.play().catch(() => setIsPlayingAudio(false));
  };

  const startRecording = async () => {
    try {
      setIsSuccess(false);
      setAudioUrl(null);
      setConfirmationText("");
      cleanupVisualizer();

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        await handleAudioProcess(blob);
        stream.getTracks().forEach((t) => t.stop());
        cleanupVisualizer();
      };

      // Connect standard AudioContext analyser for waveform render
      try {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioCtx();
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64; // nice sized frequency bars
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        audioContextRef.current = audioCtx;
        analyserRef.current = analyser;
        sourceRef.current = source;
      } catch (err) {
        console.warn("Audio visualizer failed to initialize:", err);
      }

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      toast.success("सुन्दैछु… (Listening in Nepali)");
    } catch {
      toast.error("Could not access microphone. Please check permissions.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };

  const handleAudioProcess = async (blob: Blob) => {
    setIsExtracting(true);
    const toastId = toast.loading("Transcribing spoken Nepali...");
    try {
      const text = await transcribeAudio(shopId, blob);
      setRawTranscript(text);
      setManualText(text);
      toast.loading("AI analyzing items...", { id: toastId });
      await processTextExtraction(text, toastId);
    } catch (err: any) {
      toast.error(err.message || "Speech processing failed.", { id: toastId });
      setIsExtracting(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualText.trim()) {
      toast.error("Please type a transaction command first");
      return;
    }
    setIsExtracting(true);
    setIsSuccess(false);
    setAudioUrl(null);
    setConfirmationText("");
    const toastId = toast.loading("Analyzing text with AI...");
    try {
      setRawTranscript(manualText);
      await processTextExtraction(manualText, toastId);
    } catch (err: any) {
      toast.error(err.message || "Failed to extract items.", { id: toastId });
      setIsExtracting(false);
    }
  };

  const processTextExtraction = async (text: string, toastId: string) => {
    try {
      const data = await extractVoiceTransactions(shopId, text);
      let parsedTxs: EditableTransaction[] = [];

      if (data.matched_transactions && data.matched_transactions.length > 0) {
        parsedTxs = data.matched_transactions.map((tx) => ({
          action: tx.action,
          customer_name: tx.customer_name || null,
          customer_id: tx.customer_id || null,
          payment_type: tx.payment_type || "cash",
          due_date: tx.due_date || new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
          notes: tx.notes || `Vyapar Voice: ${tx.action === "sale" ? "बिक्री" : "खरिद"}`,
          items: tx.items.map((it) => ({
            spoken_product: it.spoken_product,
            quantity: it.quantity,
            unit: it.unit || null,
            product_id: it.product_id,
            product_name: it.product_name,
            stock_quantity: it.stock_quantity,
            match_confidence: it.match_confidence,
          })),
        }));
      } else {
        const saleItems = data.matched_items.filter((i) => i.action === "sale");
        const purchaseItems = data.matched_items.filter((i) => i.action === "purchase");
        if (saleItems.length > 0) {
          const mainCustomerName = data.extracted.customer_name || null;
          let matchedCustId: string | null = null;
          if (mainCustomerName) {
            const match = customerList.find((c) =>
              c.full_name.toLowerCase().includes(mainCustomerName.toLowerCase())
            );
            if (match) matchedCustId = match.id;
          }
          parsedTxs.push({
            action: "sale",
            customer_name: mainCustomerName,
            customer_id: matchedCustId,
            payment_type: data.extracted.payment_type || "cash",
            due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
            notes: data.extracted.notes || "Vyapar Voice sale",
            items: saleItems.map((it) => ({
              spoken_product: it.spoken_product,
              quantity: it.quantity,
              unit: it.unit || null,
              product_id: it.product_id,
              product_name: it.product_name,
              stock_quantity: it.stock_quantity,
              match_confidence: it.match_confidence,
            })),
          });
        }
        purchaseItems.forEach((it) => {
          parsedTxs.push({
            action: "purchase",
            notes: data.extracted.notes || "Vyapar Voice stock-in",
            payment_type: "cash",
            items: [
              {
                spoken_product: it.spoken_product,
                quantity: it.quantity,
                unit: it.unit || null,
                product_id: it.product_id,
                product_name: it.product_name,
                stock_quantity: it.stock_quantity,
                match_confidence: it.match_confidence,
              },
            ],
          });
        });
      }

      setTransactions(parsedTxs);
      toast.success(`Analyzed ${parsedTxs.length} transaction entries!`, { id: toastId });
    } finally {
      setIsExtracting(false);
    }
  };

  const updateTransactionMeta = (txIndex: number, field: keyof EditableTransaction, value: any) => {
    setTransactions((prev) => {
      const updated = [...prev];
      updated[txIndex] = { ...updated[txIndex], [field]: value };
      if (field === "customer_id") {
        const found = customerList.find((c) => c.id === value);
        if (found) updated[txIndex].customer_name = found.full_name;
      }
      return updated;
    });
  };

  const updateTransactionItem = (
    txIndex: number,
    itemIndex: number,
    field: keyof EditableTransactionItem,
    value: any
  ) => {
    setTransactions((prev) => {
      const updated = [...prev];
      const items = [...updated[txIndex].items];
      if (field === "product_id") {
        const product = catalogProducts.find((p) => p.id === value);
        if (product) {
          items[itemIndex] = {
            ...items[itemIndex],
            product_id: product.id,
            product_name: product.product_name,
            stock_quantity: product.stock_quantity,
            match_confidence: "high",
          };
        } else {
          items[itemIndex] = {
            ...items[itemIndex],
            product_id: null,
            product_name: "",
            stock_quantity: null,
            match_confidence: "none",
          };
        }
      } else {
        items[itemIndex] = { ...items[itemIndex], [field]: value };
      }
      updated[txIndex] = { ...updated[txIndex], items };
      return updated;
    });
  };

  const addLineItem = (txIndex: number) => {
    setTransactions((prev) => {
      const updated = [...prev];
      updated[txIndex].items.push({
        spoken_product: "",
        quantity: 1,
        unit: "वटा",
        product_id: null,
        product_name: "",
        stock_quantity: null,
        match_confidence: "none",
      });
      return [...updated];
    });
  };

  const deleteLineItem = (txIndex: number, itemIndex: number) => {
    setTransactions((prev) => {
      const updated = [...prev];
      updated[txIndex].items.splice(itemIndex, 1);
      if (updated[txIndex].items.length === 0) updated.splice(txIndex, 1);
      return [...updated];
    });
  };

  const addNewTransaction = (action: VoiceAction) => {
    setTransactions((prev) => [
      ...prev,
      {
        action,
        payment_type: "cash",
        due_date: new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0],
        notes: `Manual ${action}`,
        items: [
          {
            spoken_product: "",
            quantity: 1,
            unit: "वटा",
            product_id: null,
            product_name: "",
            stock_quantity: null,
            match_confidence: "none",
          },
        ],
      },
    ]);
  };

  const removeTransaction = (txIndex: number) =>
    setTransactions((prev) => prev.filter((_, idx) => idx !== txIndex));

  const getValidationErrors = (): string[] => {
    const errors: string[] = [];
    if (transactions.length === 0) {
      errors.push("No transaction entries to confirm.");
      return errors;
    }
    transactions.forEach((tx, txIdx) => {
      const label = `Transaction #${txIdx + 1} (${tx.action === "sale" ? "Sale" : "Purchase"})`;
      if (tx.action === "sale" && tx.payment_type === "credit") {
        if (!tx.customer_id) errors.push(`${label}: Credit sale requires a customer.`);
        if (!tx.due_date) errors.push(`${label}: Credit sale requires a due date.`);
      }
      if (tx.items.length === 0) errors.push(`${label}: Needs at least one product.`);
      tx.items.forEach((item, itemIdx) => {
        const iLabel = `Line #${itemIdx + 1} in ${label}`;
        if (!item.product_id) errors.push(`${iLabel}: Product must be selected from catalog.`);
        if (!item.quantity || item.quantity <= 0) errors.push(`${iLabel}: Quantity must be > 0.`);
      });
    });
    return errors;
  };

  const validationErrors = getValidationErrors();
  const isValid = validationErrors.length === 0;

  const handleConfirmSave = async () => {
    if (!isValid) {
      toast.error("Please resolve all validation errors first.");
      return;
    }
    setIsSaving(true);
    const toastId = toast.loading("Saving & preparing voice response...");
    try {
      const payload: VoiceConfirmPayload = {
        items: [],
        transactions: transactions.map((t) => ({
          action: t.action,
          items: t.items.map((it) => ({
            action: t.action,
            product_id: it.product_id!,
            quantity: Math.round(it.quantity),
            product_name: it.product_name,
          })),
          payment_type: t.payment_type,
          customer_id: t.customer_id || undefined,
          due_date: t.due_date || undefined,
          notes: t.notes || undefined,
        })),
      };
      const result = await confirmVoiceWithAudio(shopId, payload);
      setConfirmationText(result.confirmationText);
      setProcessedCount(result.processedCount);
      setAudioUrl(result.audioUrl);
      setIsSuccess(true);
      queryClient.invalidateQueries({ queryKey: ["transactions", shopId] });
      queryClient.invalidateQueries({ queryKey: ["dashboard", shopId] });
      queryClient.invalidateQueries({ queryKey: ["products", shopId] });
      queryClient.invalidateQueries({ queryKey: ["credit-sales", shopId] });
      queryClient.invalidateQueries({ queryKey: ["customers", shopId] });
      void queryClient.refetchQueries({ queryKey: ["transactions", shopId] });
      void queryClient.refetchQueries({ queryKey: ["products", shopId] });
      void queryClient.refetchQueries({ queryKey: ["dashboard", shopId] });
      setTransactions([]);
      toast.success("Saved successfully!", { id: toastId });
      if (result.audioUrl) {
        setTimeout(() => {
          const audio = new Audio(result.audioUrl);
          audioPlayerRef.current = audio;
          audio.onplay = () => setIsPlayingAudio(true);
          audio.onended = () => setIsPlayingAudio(false);
          audio.onerror = () => setIsPlayingAudio(false);
          audio.play().catch(() => {});
        }, 300);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to save.", { id: toastId });
    } finally {
      setIsSaving(false);
    }
  };

  const sampleCommands = [
    { text: "कोक पाँच वटा बेचियो", label: "Quick Sale" },
    { text: "रामलाई पाँच वटा कोक र दुई वटा चामल उधारोमा दिएँ", label: "Credit Sale" },
    { text: "हरिलाई दुई वटा कोक बेचियो र दूध तीन लिटर थपियो", label: "Mixed" },
  ];

  return (
    <>
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        .fade-in { animation: fadeSlideIn 0.3s ease-out both; }
        
        .pulse-visual {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .7; transform: scale(1.03); }
        }
      `}</style>

      <div className="min-h-screen bg-slate-50/50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* ─── Hero Header (Sleek Slate Dark design, no gradients) ─── */}
          <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8 border border-slate-800 shadow-sm">
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-red-650 bg-[#E3182D] shadow-sm">
                    <Mic className="w-4.5 h-4.5 text-white" />
                  </div>
                  <Badge variant="outline" className="border-red-500/30 text-red-405 text-red-400 bg-red-950/20 text-[10px] uppercase tracking-wider font-bold px-2.5 py-0.5">
                    <Zap className="w-2.5 h-2.5 mr-1 inline text-red-500" /> AI Assistant
                  </Badge>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                  VyaparVoice
                  <span className="block text-slate-400 text-sm md:text-base font-normal mt-1 font-sans">
                    व्यापार वॉयस — नेपाली बोलेर काम गर्नुस्
                  </span>
                </h1>
                <p className="text-slate-400 text-xs md:text-sm max-w-lg leading-relaxed">
                  Speak naturally in Nepali to record sales, manage customer credits, and check stock-in. The AI system handles matching, logging, and validations automatically.
                </p>
              </div>

              <div className="flex items-center gap-4 flex-wrap">
                <div className="px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-white">{transactions.length}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Drafts</p>
                </div>
                <div className="px-4 py-3 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center min-w-[90px]">
                  <p className="text-xl font-bold text-emerald-400">{processedCount}</p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Saved</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* ─── Left: Voice Input Hub ─── */}
            <div className="lg:col-span-4 space-y-6">

              {/* Recording Card */}
              <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-red-650 bg-[#E3182D]" />
                    Speech Capture
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-500">
                    Tap the microphone and describe your sale or purchase in Nepali
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex flex-col items-center py-6 space-y-6">
                  {/* Circular Audio Button */}
                  <div className="relative flex items-center justify-center w-28 h-28">
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-red-500/10 animate-ping" />
                    )}
                    <button
                      type="button"
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`
                        relative z-10 w-20 h-20 rounded-full flex items-center justify-center
                        shadow-md font-bold text-white transition-all duration-200 outline-none
                        ${isRecording
                          ? "bg-red-650 bg-[#E3182D] hover:bg-red-700 scale-105 shadow-red-100"
                          : "bg-slate-900 hover:bg-slate-800 hover:scale-105 active:scale-95"
                        }
                      `}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                    >
                      {isRecording ? (
                        <MicOff className="w-7 h-7 text-white" />
                      ) : (
                        <Mic className="w-7 h-7 text-white" />
                      )}
                    </button>
                  </div>

                  {/* Realtime Canvas visualizer */}
                  <div className="w-full text-center">
                    {isRecording ? (
                      <div className="flex flex-col items-center gap-3 w-full">
                        <canvas
                          ref={canvasRef}
                          width={240}
                          height={44}
                          className="w-full max-w-[240px] h-11 rounded-lg bg-slate-50 border border-slate-100/80"
                        />
                        <div className="flex items-center gap-2 mt-1">
                          <span className="h-2 w-2 rounded-full bg-red-600 bg-[#E3182D] animate-pulse" />
                          <span className="text-[11px] font-bold text-red-600 text-[#E3182D] tracking-wider uppercase">
                            Listening — {formatTime(recordingTime)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">Tap button again to finalize</p>
                      </div>
                    ) : (
                      <p className="text-xs font-semibold text-slate-400 tracking-wider uppercase">
                        Tap microphone to start speaking
                      </p>
                    )}
                  </div>

                  {/* Predefined Voice Commands */}
                  <div className="w-full space-y-2 border-t border-slate-100 pt-5">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      💡 Quick Templates
                    </p>
                    {sampleCommands.map((cmd) => (
                      <button
                        key={cmd.text}
                        type="button"
                        onClick={() => {
                          setManualText(cmd.text);
                          toast.success("Command copied! Click 'Analyze' below.");
                        }}
                        className="w-full text-left px-3 py-2.5 rounded-xl border border-slate-150 bg-white hover:bg-slate-50 hover:border-slate-300 transition-all duration-150 group"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-xs text-slate-700 font-medium leading-relaxed line-clamp-2">
                            "{cmd.text}"
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <Badge className="text-[9px] bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 border-0">
                              {cmd.label}
                            </Badge>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-500 transition-colors" />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Manual Input form */}
              <Card className="border border-slate-200 shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Wand2 className="w-3.5 h-3.5 text-slate-400" />
                    Type Command Manually
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="space-y-3">
                    <textarea
                      value={manualText}
                      onChange={(e) => setManualText(e.target.value)}
                      placeholder="e.g. कोक पाँच वटा बेचियो र दूध दुई लिटर किन्यो..."
                      className="w-full h-24 px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-500 bg-slate-50/50 transition-all duration-150 placeholder-slate-400 resize-none"
                      disabled={isExtracting}
                    />
                    <Button
                      type="submit"
                      disabled={isExtracting || !manualText.trim()}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs py-2.5 rounded-xl shadow-sm transition-all duration-150"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                          Analyzing text...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 mr-2" />
                          Analyze &amp; Extract
                        </>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            {/* ─── Right: Transaction Review Panel ─── */}
            <div className="lg:col-span-8 space-y-6">

              {/* Speech bubble for transcription */}
              {rawTranscript && (
                <div className="fade-in flex items-start gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-200 shadow-sm">
                  <div className="w-7 h-7 shrink-0 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mt-0.5">
                    <Volume2 className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recognized Nepali Text</p>
                    <p className="text-xs text-slate-800 font-medium leading-relaxed">"{rawTranscript}"</p>
                  </div>
                  <button
                    onClick={() => {
                      setRawTranscript("");
                      setTransactions([]);
                    }}
                    className="shrink-0 text-slate-400 hover:text-red-650 hover:text-red-600 text-xs font-semibold px-2 py-1 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Clear Input
                  </button>
                </div>
              )}

              {/* Success Result Component */}
              {isSuccess && (
                <div className="fade-in">
                  <Card className="border border-emerald-200 shadow-sm overflow-hidden bg-emerald-50/20">
                    <CardContent className="py-6 space-y-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 shadow-inner">
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <h3 className="font-bold text-emerald-900 text-sm md:text-base">
                            Transactions Saved Successfully
                          </h3>
                          <p className="text-xs text-emerald-700 leading-relaxed">{confirmationText}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <Badge className="bg-emerald-100/80 text-emerald-800 border border-emerald-200/50 font-semibold text-[10px] px-2.5 py-0.5">
                              ✓ {processedCount} items logged
                            </Badge>
                            <Badge className="bg-slate-100 text-slate-800 border border-slate-200/60 font-semibold text-[10px] px-2.5 py-0.5">
                              ✓ Stock inventory updated
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Custom Audio player with micro wave animation */}
                      {audioUrl && (
                        <div className="flex items-center justify-between bg-white p-3.5 rounded-xl border border-emerald-100/80 shadow-sm">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={playConfirmationAudio}
                              className={`
                                w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 outline-none
                                ${isPlayingAudio
                                  ? "bg-emerald-600 text-white scale-95"
                                  : "bg-slate-900 text-white hover:bg-slate-800"
                                }
                              `}
                            >
                              {isPlayingAudio ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                              )}
                            </button>
                            <div>
                              <p className="text-xs font-semibold text-slate-800">
                                {isPlayingAudio ? "Playing confirmation..." : "Play Voice Confirmation"}
                              </p>
                              <p className="text-[10px] text-slate-400">
                                Click to hear the transaction receipt read aloud in Nepali
                              </p>
                            </div>
                          </div>
                          {isPlayingAudio && (
                            <div className="flex items-center gap-0.5 px-3">
                              {[1, 2.5, 3.5, 2, 4, 3, 1.5, 2.5, 1].map((h, idx) => (
                                <div
                                  key={idx}
                                  className="w-0.5 bg-emerald-500 rounded-full"
                                  style={{
                                    height: `${h * 4}px`,
                                    animation: "wave 0.5s ease-in-out infinite alternate",
                                    animationDelay: `${idx * 0.05}s`
                                  }}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Extraction Loader */}
              {isExtracting && (
                <div className="fade-in">
                  <Card className="border border-slate-200 shadow-sm bg-white py-14 flex flex-col items-center justify-center text-center">
                    <div className="relative mb-5">
                      <div className="w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                        <Loader2 className="w-7 h-7 text-slate-800 animate-spin" />
                      </div>
                    </div>
                    <h3 className="font-bold text-slate-800 text-base">Gemini NLP Parsing</h3>
                    <p className="text-slate-500 text-xs mt-1.5 max-w-xs leading-relaxed px-4">
                      Extracting items, identifying actions, and matching against inventory...
                    </p>
                    <div className="flex gap-1.5 mt-5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-slate-800 animate-bounce"
                          style={{ animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                  </Card>
                </div>
              )}

              {/* Transactions Review Container */}
              {transactions.length > 0 && (
                <div className="fade-in">
                  <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                    <CardHeader className="border-b border-slate-100 pb-4 pt-5">
                      <div className="flex items-center justify-between flex-wrap gap-3">
                        <div className="space-y-0.5">
                          <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                            Review Transactions
                            <Badge className="bg-slate-100 text-slate-700 border border-slate-200 font-bold text-[10px] px-2.5 py-0.5">
                              {transactions.length} Draft{transactions.length === 1 ? "" : "s"}
                            </Badge>
                          </CardTitle>
                          <CardDescription className="text-xs text-slate-500">
                            Confirm invoice items, prices, and match statuses below.
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => addNewTransaction("sale")}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <ShoppingCart className="w-3 h-3 text-red-600" /> + Sale
                          </button>
                          <button
                            onClick={() => addNewTransaction("purchase")}
                            className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                            <Package className="w-3 h-3 text-emerald-600" /> + Purchase
                          </button>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="p-0 divide-y divide-slate-100">
                      {transactions.map((tx, txIdx) => {
                        const isSale = tx.action === "sale";
                        return (
                          <div
                            key={txIdx}
                            className="p-5 space-y-4 hover:bg-slate-50/20 transition-colors duration-150"
                          >
                            {/* Metadata config row */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center gap-3 flex-wrap">
                                <div className={`
                                  flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold
                                  ${isSale
                                    ? "bg-red-50 text-red-700 border border-red-200/60"
                                    : "bg-slate-900 text-white"
                                  }
                                `}>
                                  {isSale ? <ShoppingCart className="w-3.5 h-3.5" /> : <Package className="w-3.5 h-3.5" />}
                                  {isSale ? "SALE (बिक्री)" : "PURCHASE (खरिद)"}
                                </div>

                                {isSale && (
                                  <div className="flex items-center bg-slate-200/70 p-0.5 rounded-lg border border-slate-200">
                                    {(["cash", "credit"] as const).map((type) => (
                                      <button
                                        key={type}
                                        type="button"
                                        onClick={() => updateTransactionMeta(txIdx, "payment_type", type)}
                                        className={`
                                          text-[10px] font-bold px-3 py-1 rounded-md transition-all duration-150
                                          ${tx.payment_type === type
                                            ? "bg-white text-slate-900 shadow-sm"
                                            : "text-slate-500 hover:text-slate-800"
                                          }
                                        `}
                                      >
                                        {type === "cash" ? "Cash" : "Credit (उधारो)"}
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>

                              <button
                                type="button"
                                onClick={() => removeTransaction(txIdx)}
                                className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-650 hover:bg-red-50 hover:text-red-600 px-2.5 py-1 rounded-lg transition-colors ml-auto sm:ml-0"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                Remove Entry
                              </button>
                            </div>

                            {/* Client & Date Details */}
                            {isSale && (
                              <div className={`flex flex-wrap gap-3 px-3 py-3 rounded-xl border ${
                                tx.payment_type === "credit"
                                  ? "bg-amber-50/40 border-amber-200/60"
                                  : "bg-slate-50/50 border-slate-200/60"
                              }`}>
                                <div className="flex items-center gap-2">
                                  <User className={`w-3.5 h-3.5 ${tx.payment_type === "credit" ? "text-amber-600" : "text-slate-500"}`} />
                                  <select
                                    value={tx.customer_id || ""}
                                    onChange={(e) => updateTransactionMeta(txIdx, "customer_id", e.target.value)}
                                    className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium focus:outline-none focus:ring-2 bg-white ${
                                      tx.payment_type === "credit" && !tx.customer_id
                                        ? "border-amber-400 focus:ring-amber-400/60 focus:border-amber-500"
                                        : "border-slate-200 focus:ring-slate-400/60 focus:border-slate-400"
                                    }`}
                                  >
                                    <option value="">— Select Customer {tx.payment_type === "credit" ? "(Required)" : "(Optional)"} —</option>
                                    {customerList.map((c) => (
                                      <option key={c.id} value={c.id}>{c.full_name}</option>
                                    ))}
                                  </select>
                                </div>

                                {tx.payment_type === "credit" && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                                    <input
                                      type="date"
                                      value={tx.due_date || ""}
                                      onChange={(e) => updateTransactionMeta(txIdx, "due_date", e.target.value)}
                                      className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-400/60 transition-all font-medium"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-2">
                                  <input
                                    type="text"
                                    value={tx.notes || ""}
                                    onChange={(e) => updateTransactionMeta(txIdx, "notes", e.target.value)}
                                    placeholder="Add transaction remark..."
                                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/60 transition-all w-48"
                                  />
                                </div>
                              </div>
                            )}

                            {/* Responsive Table Wrapper (Fixes layout bugs) */}
                            <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white">
                              <table className="w-full text-left text-xs min-w-[600px]">
                                <thead>
                                  <tr className="bg-slate-50/80 border-b border-slate-200">
                                    <th className="px-4 py-3 font-semibold text-slate-500 w-1/4">Spoken Product Name</th>
                                    <th className="px-4 py-3 font-semibold text-slate-500 w-1/3">Catalog Match</th>
                                    <th className="px-4 py-3 font-semibold text-slate-500 w-24">Qty</th>
                                    <th className="px-4 py-3 font-semibold text-slate-500 w-24 text-center">Confidence</th>
                                    <th className="px-4 py-3 font-semibold text-slate-500 text-center w-12" />
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                  {tx.items.map((item, itemIdx) => {
                                    const isMatched = !!item.product_id;
                                    const stockLow = isMatched && item.stock_quantity !== null && item.quantity > item.stock_quantity;
                                    return (
                                      <tr
                                        key={itemIdx}
                                        className="hover:bg-slate-50/40 transition-colors"
                                      >
                                        <td className="px-4 py-3">
                                          <span className="font-semibold text-slate-800 text-xs">
                                            {item.spoken_product || <span className="italic text-slate-400">Added manually</span>}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="space-y-1">
                                            <select
                                              value={item.product_id || ""}
                                              onChange={(e) => updateTransactionItem(txIdx, itemIdx, "product_id", e.target.value)}
                                              className={`
                                                text-xs px-2.5 py-1.5 rounded-lg border font-medium w-full max-w-xs
                                                focus:outline-none focus:ring-2 transition-all bg-white
                                                ${isMatched
                                                  ? "border-slate-200 focus:ring-slate-400/60 focus:border-slate-400 text-slate-800"
                                                  : "border-red-400 ring-1 ring-red-300 bg-red-50/10 text-red-800 focus:ring-red-400/60"
                                                }
                                              `}
                                            >
                                              <option value="">— Match Product —</option>
                                              {catalogProducts.map((p) => (
                                                <option key={p.id} value={p.id}>
                                                  {p.product_name} ({p.stock_quantity !== null ? `Stock: ${p.stock_quantity}` : "No stock limit"} {p.unit})
                                                </option>
                                              ))}
                                            </select>
                                            {isMatched && item.stock_quantity !== null && (
                                              <div className="text-[10px] text-slate-400 pl-1">
                                                Available Stock: <span className="font-semibold text-slate-600">{item.stock_quantity}</span> {item.unit || "units"}
                                              </div>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3">
                                          <div className="space-y-1">
                                            <input
                                              type="number"
                                              value={item.quantity}
                                              min="1"
                                              onChange={(e) => updateTransactionItem(txIdx, itemIdx, "quantity", parseFloat(e.target.value) || 0)}
                                              className={`
                                                w-20 px-2 py-1.5 rounded-lg border text-xs font-semibold
                                                focus:outline-none focus:ring-2 focus:ring-slate-400/60 transition-all bg-white
                                                ${item.quantity <= 0 ? "border-red-400 bg-red-50/10" : "border-slate-200"}
                                              `}
                                            />
                                            {stockLow && isSale && (
                                              <span className="text-[9px] text-amber-600 font-bold flex items-center gap-0.5 mt-0.5">
                                                <AlertTriangle className="w-2.5 h-2.5" /> Low stock
                                              </span>
                                            )}
                                          </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          {isMatched ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                              Matched
                                            </span>
                                          ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-50 text-red-700 border border-red-100">
                                              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                                              No Match
                                            </span>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <button
                                            type="button"
                                            onClick={() => deleteLineItem(txIdx, itemIdx)}
                                            className="p-1.5 rounded-lg text-slate-350 hover:text-red-650 hover:bg-slate-100 transition-colors"
                                            title="Remove item"
                                          >
                                            <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-650" />
                                          </button>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>

                            <div className="flex justify-start">
                              <button
                                type="button"
                                onClick={() => addLineItem(txIdx)}
                                className="flex items-center gap-1.5 text-xs text-slate-650 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors bg-white font-medium shadow-sm"
                              >
                                <Plus className="w-3.5 h-3.5" /> Add line item
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </CardContent>

                    {/* Form errors + confirm actions */}
                    <CardFooter className="flex flex-col items-stretch gap-4 p-6 bg-slate-50/70 border-t border-slate-200">
                      {!isValid && (
                        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-2">
                          <h4 className="text-xs font-bold text-amber-800 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                            Please resolve details before saving:
                          </h4>
                          <ul className="space-y-1 pl-6">
                            {validationErrors.map((err, idx) => (
                              <li key={idx} className="text-xs text-amber-700 list-disc leading-relaxed">{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <p className="text-xs text-slate-400 font-medium leading-relaxed max-w-sm">
                          * Saving commits transactions, logs sales history, and posts purchase bills directly.
                        </p>
                        <div className="flex items-center gap-3">
                          <Button
                            variant="outline"
                            onClick={() => setTransactions([])}
                            disabled={isSaving}
                            className="border-slate-250 hover:bg-slate-100 text-slate-600 rounded-xl font-semibold"
                          >
                            <RotateCcw className="w-4 h-4 mr-2" /> Reset Drafts
                          </Button>
                          <Button
                            onClick={handleConfirmSave}
                            disabled={!isValid || isSaving}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                          >
                            {isSaving ? (
                              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Committing...</>
                            ) : (
                              <><CheckCircle className="w-4 h-4 mr-2" /> Save Transactions</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardFooter>
                  </Card>
                </div>
              )}

              {/* Ready State */}
              {transactions.length === 0 && !isSuccess && !isExtracting && (
                <Card className="border border-slate-200 shadow-sm bg-white py-20 flex flex-col items-center justify-center text-center">
                  <div className="relative mb-5">
                    <div className="w-16 h-16 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shadow-inner">
                      <Mic className="w-7 h-7 text-slate-400" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shadow-md border border-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                  <h3 className="font-bold text-slate-900 text-lg">Voice Feed Center</h3>
                  <p className="text-slate-500 text-xs mt-2 max-w-sm leading-relaxed px-6">
                    Use speech recording or type a statement in the side panel. Voice matches will appear here for your approval.
                  </p>
                  <div className="flex items-center gap-3 mt-7">
                    <button
                      onClick={() => addNewTransaction("sale")}
                      className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-755 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Manual Sale
                    </button>
                    <button
                      onClick={() => addNewTransaction("purchase")}
                      className="flex items-center gap-2 text-xs font-semibold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-755 bg-white hover:bg-slate-50 transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> + Manual Purchase
                    </button>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
