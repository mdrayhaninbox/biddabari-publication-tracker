import React from 'react';
import { X, Download, Printer, ZoomIn, Image as ImageIcon } from 'lucide-react';
import { Language, tr } from '../utils/i18n';

interface ImageViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string | null;
  title?: string;
  subtitle?: string;
  language?: Language;
}

export const ImageViewerModal: React.FC<ImageViewerModalProps> = ({
  isOpen,
  onClose,
  imageUrl,
  title,
  subtitle,
  language = 'en',
}) => {
  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `voucher-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title || 'Voucher Image'}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: sans-serif; text-align: center; background: #fff; }
            h2 { margin: 0 0 6px; font-size: 18px; color: #111; }
            p { margin: 0 0 16px; font-size: 12px; color: #666; }
            img { max-width: 100%; max-height: 88vh; object-fit: contain; border: 1px solid #ddd; border-radius: 8px; }
            @media print {
              body { padding: 0; }
              img { max-height: 92vh; }
            }
          </style>
        </head>
        <body>
          <h2>${title || 'Voucher Copy'}</h2>
          ${subtitle ? `<p>${subtitle}</p>` : ''}
          <img src="${imageUrl}" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-zinc-900 border border-zinc-700 text-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-zinc-100 truncate">
                {title || tr('ভাউচার / রিসিটের ছবি', 'Voucher / Receipt Image', language)}
              </h3>
              {subtitle && (
                <p className="text-[11px] text-zinc-400 truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              title={tr('প্রিন্ট করুন', 'Print Image', language)}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr('প্রিন্ট', 'Print', language)}</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-lg transition-colors"
              title={tr('ছবি ডাউনলোড করুন', 'Download Image', language)}
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr('ডাউনলোড', 'Download', language)}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Image Body */}
        <div className="p-3 sm:p-6 overflow-auto flex-1 flex items-center justify-center bg-black/40 min-h-[280px]">
          <img
            src={imageUrl}
            alt={title || 'Voucher'}
            className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-lg border border-zinc-800 select-none"
          />
        </div>

        {/* Footer info */}
        <div className="px-4 py-2 border-t border-zinc-800 bg-zinc-950/40 flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5">
            <ZoomIn className="w-3.5 h-3.5" />
            {tr('অরিজিনাল সাইজ ও কোয়ালিটি সংরক্ষিত', 'Original high quality image preserved', language)}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-zinc-300 hover:text-white underline underline-offset-2"
          >
            {tr('বন্ধ করুন', 'Close', language)}
          </button>
        </div>
      </div>
    </div>
  );
};
