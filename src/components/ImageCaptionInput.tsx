import { Input } from "@/components/ui/input";

interface ImageCaptionInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}

export const ImageCaptionInput = ({
  value,
  onChange,
  placeholder = "Add a caption...",
  maxLength = 200,
  className = "",
}: ImageCaptionInputProps) => {
  return (
    <div className={`relative ${className}`}>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value.slice(0, maxLength))}
        placeholder={placeholder}
        className="text-sm h-9"
        maxLength={maxLength}
      />
      {value.length > 0 && (
        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
          {value.length}/{maxLength}
        </span>
      )}
    </div>
  );
};
