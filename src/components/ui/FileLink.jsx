import { Download } from 'lucide-react';

// Backend'den dosya indirme bağlantısı. `url` null ise (mock mod) dosya yoktur, bilgi verilir.
export default function FileLink({ url, label = 'İndir', fileName, className = '', iconOnly }) {
  const base = `inline-flex items-center gap-1.5 font-medium text-brand transition-colors hover:text-brand-dark ${className}`;
  const content = (
    <>
      <Download className='h-4 w-4 shrink-0' />
      {!iconOnly && <span className='truncate'>{label}</span>}
    </>
  );

  if (!url) {
    return (
      <button
        type='button'
        title={fileName || label}
        onClick={() =>
          window.alert(
            `Demo modunda dosya indirme kapalıdır.${fileName ? `\n\nDosya: ${fileName}` : ''}`
          )
        }
        className={base}
      >
        {content}
      </button>
    );
  }

  return (
    <a href={url} target='_blank' rel='noopener' title={fileName || label} className={base}>
      {content}
    </a>
  );
}
