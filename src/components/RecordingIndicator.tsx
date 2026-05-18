// [CMP-d6ff17] RecordingIndicator — recording indicator component
import { Mic, MicOff } from "lucide-react";

interface RecordingIndicatorProps {
  isRecording: boolean;
  duration?: number;
}

export const RecordingIndicator = ({ isRecording, duration = 0 }: RecordingIndicatorProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isRecording) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <Mic size={16} className="text-red-500" />
        <span className="text-sm font-medium text-red-700">Recording</span>
      </div>
      <span className="text-sm text-red-600 font-mono">{formatTime(duration)}</span>
    </div>
  );
};