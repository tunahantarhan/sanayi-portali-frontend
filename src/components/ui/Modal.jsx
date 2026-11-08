import { useEffect } from 'react';
import { X } from 'lucide-react';

// Ortak modal: arka plana tıklayınca veya Esc ile kapanır.
export default function Modal({
  title,
  subtitle,
  icon,
  headerClassName = 'bg-gray-50/80',
  onClose,
  footer,
  size = 'max-w-lg',
  children,
}) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm'
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
      role='dialog'
      aria-modal='true'
    >
      <div
        className={`flex max-h-[90vh] w-full ${size} flex-col overflow-hidden rounded-2xl bg-white shadow-2xl`}
      >
        <div
          className={`flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4 ${headerClassName}`}
        >
          <div className='flex min-w-0 items-center gap-3'>
            {icon}
            <div className='min-w-0'>
              <h3 className='text-sm font-bold text-gray-900'>{title}</h3>
              {subtitle && <p className='text-xs text-gray-500'>{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label='Kapat'
            className='rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-200/60'
          >
            <X className='h-5 w-5' />
          </button>
        </div>
        <div className='overflow-y-auto'>{children}</div>
        {footer && (
          <div className='flex shrink-0 items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/50 px-6 py-3.5'>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
