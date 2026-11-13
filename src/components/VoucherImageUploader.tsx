import React, { useRef, useState } from 'react';
import { Camera, Image as ImageIcon, Trash2, Eye, Upload, RefreshCw } from 'lucide-react';
import { Language, tr } from '../utils/i18n';
import { ImageViewerModal } from './ImageViewerModal';

interface VoucherImageUploaderProps {
  image?: string;
  onChange: (base64Image?: string) => void;
  label?: string;
  subLabel?: string;
  language?: Language;
  disabled?: boolean;
}

/**
 * Client-side Canvas Image Compression:
 * Resizes large photos to max 1200px width/height and compresses to quality 0.78 JPEG,
 * reducing a 5-10MB mobile photo to ~50-100KB without visible loss of document readability.
 */
function compressImageFile(file: File, maxWidth = 900, quality = 0.70): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxWidth) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxWidth) / height);
            height = maxWidth;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        // Fill white background for transparent images
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const VoucherImageUploader: React.FC<VoucherImageUploaderProps> = ({
  image,
  onChange,
  label,
  subLabel,
  language = 'en',
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert(tr('অনুগ্রহ করে শুধুমাত্র ছবি ফাইল নির্বাচন করুন (JPG, PNG, WebP)', 'Please select an image file only (JPG, PNG, WebP)', language));
      return;
    }

    try {
      setIsProcessing(true);
      const compressed = await compressImageFile(file);
      onChange(compressed);
    } catch (err) {
      console.error('Image compression failed:', err);
      alert(tr('ছবি প্রসেস করতে ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।', 'Failed to process image. Please try again.', language));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
    // reset input so the same file can be selected again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isProcessing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isProcessing) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Estimate approximate KB size of the base64 string
  const approxKb = image ? Math.round((image.length * 3) / 4 / 1024) : 0;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-zinc-800">
          {label || tr('ভাউচার / মানি রিসিটের ছবি (ঐচ্ছিক)', 'Voucher / Receipt Image (Optional)', language)}
        </label>
        <span className="text-[10px] text-zinc-400">
          {subLabel || tr('JPG, PNG, WebP • সর্বোচ্চ অপ্টিমাইজড', 'JPG, PNG, WebP • Auto-optimized', language)}
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        disabled={disabled || isProcessing}
        className="hidden"
      />

      {image ? (
        // Preview Card when image is attached
        <div className="flex items-center justify-between p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl">
          <div className="flex items-center gap-3 min-w-0">
            <div 
              onClick={() => setIsViewerOpen(true)}
              className="relative w-12 h-12 rounded-lg overflow-hidden border border-zinc-200 shrink-0 bg-white cursor-pointer group shadow-2xs"
            >
              <img
                src={image}
                alt="Voucher Preview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Eye className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0">
              <span className="text-xs font-bold text-zinc-900 block truncate flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                {tr('ভাউচারের ছবি সংযুক্ত', 'Voucher Image Attached', language)}
              </span>
              <span className="text-[10px] text-zinc-500 font-mono block">
                ~{approxKb} KB • {tr('স্বয়ংক্রিয় কম্প্রেসড', 'Auto Compressed', language)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setIsViewerOpen(true)}
              className="p-1.5 text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors"
              title={tr('বড় করে দেখুন', 'View Fullscreen', language)}
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled || isProcessing}
              className="p-1.5 text-zinc-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              title={tr('ছবি পরিবর্তন করুন', 'Change Image', language)}
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onChange(undefined)}
              disabled={disabled || isProcessing}
              className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title={tr('ছবি মুছে ফেলুন', 'Remove Image', language)}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        // Dropzone when no image is attached
        <div
          onClick={() => !disabled && !isProcessing && fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
            isDragging 
              ? 'border-blue-500 bg-blue-50/60' 
              : 'border-zinc-300 hover:border-zinc-400 bg-zinc-50/50 hover:bg-zinc-50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {isProcessing ? (
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-zinc-600">
              <RefreshCw className="w-4 h-4 animate-spin text-zinc-900" />
              <span>{tr('ছবি অপ্টিমাইজ করা হচ্ছে...', 'Optimizing image...', language)}</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2.5 py-1 text-xs text-zinc-600">
              <div className="w-7 h-7 rounded-lg bg-zinc-200/80 flex items-center justify-center text-zinc-700 shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="font-semibold text-zinc-800 block text-xs">
                  {tr('ভাউচারের ছবি নির্বাচন করুন', 'Select or Drop Voucher Image', language)}
                </span>
                <span className="text-[10px] text-zinc-400 block">
                  {tr('ক্লিক করুন অথবা ড্র্যাগ করে আনুন (ঐচ্ছিক)', 'Click to upload or drag & drop (Optional)', language)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Fullscreen Viewer Modal */}
      <ImageViewerModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        imageUrl={image}
        title={label || tr('ভাউচার কপি', 'Voucher Copy', language)}
        subtitle={tr('বিদ্যাবাড়ি পাবলিকেশন ভাউচার ডকুমেন্ট', 'Biddabari Publication Voucher Document', language)}
        language={language}
      />
    </div>
  );
};
