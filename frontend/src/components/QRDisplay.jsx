import { QRCodeCanvas } from 'qrcode.react';
import { Download } from 'lucide-react';

/**
 * QRDisplay — renders a QR code token as a styled card.
 * Used for seat reservation passes and book pickup confirmations.
 */
const QRDisplay = ({ value, label, sublabel, size = 180 }) => {
  if (!value) return null;

  const downloadQR = () => {
    const canvas = document.getElementById('bookify-qr-canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bookify-pass.png';
    a.click();
  };

  return (
    <div className="card flex flex-col items-center gap-4 max-w-xs mx-auto">
      <div className="p-4 bg-white rounded-lg">
        <QRCodeCanvas
          id="bookify-qr-canvas"
          value={value}
          size={size}
          level="M"
        />
      </div>
      {label && <p className="font-semibold text-center" style={{ color: 'var(--color-on-surface)' }}>{label}</p>}
      {sublabel && <p className="text-sm text-center" style={{ color: 'var(--color-on-surface-variant)' }}>{sublabel}</p>}
      <button
        onClick={downloadQR}
        className="btn-secondary btn flex items-center gap-2 text-xs"
      >
        <Download size={14} />
        Download Pass
      </button>
    </div>
  );
};

export default QRDisplay;
