import { AlertTriangle, Loader2, RefreshCw } from 'lucide-react';

export function LoadingState({ text = 'Yükleniyor...', className = 'h-96' }) {
  return (
    <div className={`flex items-center justify-center ${className}`} role='status'>
      <Loader2 className='h-8 w-8 animate-spin text-brand' />
      <span className='ml-3 text-sm font-medium text-gray-500'>{text}</span>
    </div>
  );
}

export function ErrorState({ error, onRetry, className = 'py-16' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      <div className='mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-red-50'>
        <AlertTriangle className='h-6 w-6 text-red-500' />
      </div>
      <p className='text-sm font-semibold text-gray-800'>Veriler alınamadı</p>
      <p className='mt-1 max-w-sm text-xs text-gray-500'>
        {error?.message || 'Beklenmeyen bir hata oluştu.'}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className='mt-4 inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50'
        >
          <RefreshCw className='h-3.5 w-3.5' /> Tekrar Dene
        </button>
      )}
    </div>
  );
}

export function EmptyState({ text, icon: Icon, className = 'py-12' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${className}`}>
      {Icon && <Icon className='mb-2 h-8 w-8 text-gray-300' />}
      <p className='text-sm text-gray-500'>{text}</p>
    </div>
  );
}
