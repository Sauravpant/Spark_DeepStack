import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, RotateCcw } from 'lucide-react';

interface TranscriptStepProps {
  text: string;
  onChange: (text: string) => void;
  onConfirm: () => void;
  onRedo: () => void;
  loading?: boolean;
}

export default function TranscriptStep({
  text,
  onChange,
  onConfirm,
  onRedo,
  loading,
}: TranscriptStepProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm font-medium text-slate-700 mb-2">ट्रान्सक्रिप्ट जाँच गर्नुहोस्</p>
        <Textarea
          value={text}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="text-base"
          placeholder="बोलेको पाठ…"
        />
      </div>
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={onConfirm}
          disabled={!text.trim() || loading}
          className="bg-[#E3182D] hover:bg-red-700"
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          कारोबार निकाल्नुहोस्
        </Button>
        <Button type="button" variant="outline" onClick={onRedo}>
          <RotateCcw className="mr-2 h-4 w-4" />
          फेरि बोल्नुहोस्
        </Button>
      </div>
    </div>
  );
}
