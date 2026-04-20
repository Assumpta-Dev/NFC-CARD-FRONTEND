import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { HiOutlineClipboard, HiOutlineCheck, HiOutlineEye } from "react-icons/hi";
import { getPublicCardPath, getPublicCardUrl } from "./publicCardUrl";

interface CardQrCodePanelProps {
  cardId: string;
  title?: string;
  description?: string;
  previewInNewTab?: boolean;
  className?: string;
}

export function CardQrCodePanel({
  cardId,
  title = "QR Code",
  description = "Use this same URL for QR print, NFC writing, preview, and sharing.",
  previewInNewTab = true,
  className = "",
}: CardQrCodePanelProps) {
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [copied, setCopied] = useState(false);

  const publicPath = getPublicCardPath(cardId);
  const publicUrl = getPublicCardUrl(cardId);

  useEffect(() => {
    let active = true;

    QRCode.toDataURL(publicUrl, {
      width: 320,
      margin: 1,
      color: {
        dark: "#111827",
        light: "#ffffff",
      },
    })
      .then((url) => {
        if (active) {
          setQrDataUrl(url);
        }
      })
      .catch(() => {
        if (active) {
          setQrDataUrl("");
        }
      });

    return () => {
      active = false;
    };
  }, [publicUrl]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={`card p-5 ${className}`.trim()}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="mx-auto w-full max-w-[220px] rounded-3xl border border-[#e9d7d2] bg-white p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08),0_2px_10px_rgba(15,23,42,0.04)]">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${cardId}`}
              className="w-full rounded-2xl"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-2xl bg-gray-50 text-sm text-gray-400">
              QR unavailable
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gray-500">
            {title}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900">{cardId}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p>

          <div className="mt-4 rounded-2xl border border-[#e9d7d2] bg-gray-50 px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Public Link
            </p>
            <p className="mt-1 break-all font-mono text-xs text-gray-800">{publicUrl}</p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={publicPath}
              target={previewInNewTab ? "_blank" : undefined}
              rel={previewInNewTab ? "noopener noreferrer" : undefined}
              className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-600"
            >
              <HiOutlineEye className="text-base" />
              Preview
            </a>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-2 rounded-xl border border-[#e9d7d2] px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
            >
              {copied ? (
                <HiOutlineCheck className="text-base text-green-500" />
              ) : (
                <HiOutlineClipboard className="text-base" />
              )}
              {copied ? "Copied" : "Copy Link"}
            </button>

            {qrDataUrl && (
              <a
                href={qrDataUrl}
                download={`${cardId}-qr.png`}
                className="inline-flex items-center rounded-xl border border-[#e9d7d2] px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
              >
                Download QR
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
