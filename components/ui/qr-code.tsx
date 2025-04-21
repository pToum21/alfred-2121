import { QRCodeSVG } from 'qrcode.react';

interface QRCodeProps {
  value: string;
  size?: number;
}

export function QRCode({ value, size = 256 }: QRCodeProps) {
  return (
    <div className="flex justify-center p-4 bg-white rounded-lg">
      <QRCodeSVG 
        value={value} 
        size={size}
        level="M"
        includeMargin={true}
      />
    </div>
  );
} 