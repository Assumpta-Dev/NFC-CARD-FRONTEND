import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Button } from "../../components/ui";
import {
  IconCopy,
  IconEye,
  IconPaid,
  IconQrCode,
} from "../../components/icons/DashboardIcons";
import { getPublicCardPath, getPublicCardUrl } from "./publicCardUrl";

interface CardQrCodePanelProps {
  cardId: string;
  onQrReady?: (url: string) => void;
  title?: string;
  description?: string;
  previewInNewTab?: boolean;
  className?: string;
}

export function CardQrCodePanel({
  cardId,
  onQrReady,
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
          onQrReady?.(url);
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
  }, [publicUrl, onQrReady]);

  const handleCopyLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className={`rounded-2xl border border-gray-100/80 bg-white p-5 dark:border-gray-800 dark:bg-gray-900 ${className}`.trim()}>
      <div className="flex flex-col gap-5 md:flex-row md:items-center">
        <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-gray-950">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`QR code for ${cardId}`}
              className="w-full rounded-xl"
            />
          ) : (
            <div className="flex aspect-square items-center justify-center rounded-xl bg-gray-50 text-sm text-gray-400 dark:bg-gray-900">
              <IconQrCode size={32} className="opacity-40" />
            </div>
          )}
        </div>

        <div className="flex-1">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
            {title}
          </p>
          <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{cardId}</h3>
          <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>

          <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-gray-950">
            <p className="text-[10px] font-medium uppercase tracking-[0.12em] text-gray-400">
              Public Link
            </p>
            <p className="mt-1 break-all font-mono text-xs text-gray-800 dark:text-gray-200">
              {publicUrl}
            </p>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={publicPath}
              target={previewInNewTab ? "_blank" : undefined}
              rel={previewInNewTab ? "noopener noreferrer" : undefined}
            >
              <Button className="gap-2">
                <IconEye size={16} />
                Preview
              </Button>
            </a>

            <Button variant="secondary" onClick={handleCopyLink} className="gap-2">
              {copied ? (
                <IconPaid size={16} className="text-emerald-500" />
              ) : (
                <IconCopy size={16} />
              )}
              {copied ? "Copied" : "Copy Link"}
            </Button>

            {qrDataUrl && (
              <a href={qrDataUrl} download={`${cardId}-qr.png`}>
                <Button variant="secondary">Download QR</Button>
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
