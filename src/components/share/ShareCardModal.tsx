import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import html2canvas from 'html2canvas';
import { ShareCard } from './ShareCard';
import { saveBracket } from '../../utils/bracketStorage';
import { useBracketStore } from '../../stores/bracketStore';
import { useAuthStore } from '../../stores/authStore';
import type { SeededArtist } from '../../types/bracket';
import type { BracketSize } from '../../types/bracket';

interface ShareCardModalProps {
  champion: SeededArtist;
  bracketPath: { round: string; opponent: string }[];
  onClose: () => void;
}

export function ShareCardModal({ champion, bracketPath, onClose }: ShareCardModalProps) {
  const bracket = useBracketStore((s) => s.bracket);
  const user = useAuthStore((s) => s.user);
  const cardRef = useRef<HTMLDivElement>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string>('');
  const [saving, setSaving] = useState(true);
  const [copied, setCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Save bracket + generate image
  useEffect(() => {
    if (!bracket || !user) return;

    let cancelled = false;

    async function saveAndCapture() {
      try {
        const bracketId = await saveBracket(bracket!, user!);
        const url = `${window.location.origin}/shared/${bracketId}`;
        if (cancelled) return;
        setShareUrl(url);
        setSaving(false);

        // Wait for ShareCard to render with the URL, then capture
        await new Promise((r) => setTimeout(r, 200));
        if (cancelled || !cardRef.current) return;

        const canvas = await html2canvas(cardRef.current, {
          useCORS: true,
          backgroundColor: '#0D0D0D',
          scale: 2,
          logging: false,
        });

        if (cancelled) return;
        canvasRef.current = canvas;
        setImageUrl(canvas.toDataURL('image/png'));
      } catch (err) {
        console.error('Failed to save/capture bracket:', err);
        if (!cancelled) setSaving(false);
      }
    }

    saveAndCapture();
    return () => { cancelled = true; };
  }, [bracket, user]);

  const handleDownload = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `music-madness-${champion.name.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(url);
    }, 'image/png');
  }, [champion.name]);

  const handleShare = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );

    if (blob && navigator.share) {
      try {
        const file = new File([blob], 'music-madness.png', { type: 'image/png' });
        await navigator.share({
          text: `\u{1F3C6} My Music Madness Champion: ${champion.name}!\n\n${shareUrl}`,
          files: [file],
        });
        return;
      } catch { /* fallback to copy */ }
    }

    // Fallback: copy link
    handleCopyLink();
  }, [champion.name, shareUrl]);

  const handleCopyLink = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareUrl]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-bg-secondary rounded-2xl p-6 max-w-lg w-full"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-heading font-bold">Share Your Champion</h3>
            <button
              onClick={onClose}
              className="text-text-secondary hover:text-text-primary text-2xl leading-none cursor-pointer"
            >
              &times;
            </button>
          </div>

          {/* Card preview */}
          <div className="rounded-lg overflow-hidden mb-4 bg-bg-primary">
            {saving ? (
              <div className="flex items-center justify-center h-48">
                <div className="text-text-secondary font-body text-sm">Saving bracket...</div>
              </div>
            ) : imageUrl ? (
              <img src={imageUrl} alt="Share card" className="w-full" />
            ) : (
              <div className="flex items-center justify-center h-48">
                <div className="text-text-secondary font-body text-sm">Generating card...</div>
              </div>
            )}
          </div>

          {/* Share URL */}
          {shareUrl && (
            <div className="bg-bg-primary rounded-lg px-3 py-2 mb-4 flex items-center gap-2">
              <span className="text-text-secondary text-xs font-body truncate flex-1">
                {shareUrl}
              </span>
              <button
                onClick={handleCopyLink}
                className="text-spotify-green text-xs font-body font-semibold flex-shrink-0 cursor-pointer"
              >
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={handleDownload}
              disabled={!imageUrl}
              className="flex-1 bg-bg-card hover:bg-border-subtle text-text-primary font-bold py-3 rounded-full font-body cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Download Image
            </button>
            <button
              onClick={handleShare}
              disabled={!imageUrl}
              className="flex-1 bg-spotify-green hover:bg-spotify-green-bright text-black font-bold py-3 rounded-full font-body cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Share
            </button>
          </div>
        </motion.div>

        {/* Off-screen ShareCard for html2canvas capture */}
        <div style={{ position: 'fixed', left: '-9999px', top: '-9999px' }}>
          <ShareCard
            ref={cardRef}
            champion={champion}
            bracketPath={bracketPath}
            shareUrl={shareUrl || window.location.origin}
            size={bracket?.size ?? 32 as BracketSize}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
