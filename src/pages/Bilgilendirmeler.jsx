import { useMemo, useState } from 'react';
import { Mail, MessageSquare, FileText, CheckCircle2, XCircle, Inbox, Paperclip } from 'lucide-react';
import { getKepMessages, getSentMessages, fileUrls } from '../services/api';
import useApi from '../hooks/useApi';
import FileLink from '../components/ui/FileLink';
import { LoadingState, ErrorState, EmptyState } from '../components/ui/PageState';
import { formatDate, formatRelative } from '../utils/format';

const TABS = [
  { key: 'kep', label: 'KEP Yazıları', icon: FileText },
  { key: 'mesaj', label: 'SMS ve E-posta', icon: MessageSquare },
];

const CHANNELS = {
  sms: { label: 'SMS', icon: MessageSquare, className: 'bg-emerald-50 text-emerald-700' },
  eposta: { label: 'E-posta', icon: Mail, className: 'bg-blue-50 text-blue-700' },
};

function KepList() {
  const { data, loading, error, reload } = useApi(getKepMessages);
  if (loading) return <LoadingState text='KEP yazıları yükleniyor...' className='h-64' />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState text='Size gönderilmiş KEP yazısı bulunmamaktadır.' icon={Inbox} />;

  return (
    <div className='divide-y divide-gray-100'>
      {data.map((kep) => (
        <article key={kep.id} className='flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between'>
          <div className='flex min-w-0 gap-4'>
            <div className='flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10'>
              <FileText className='h-5 w-5 text-brand' />
            </div>
            <div className='min-w-0'>
              <h3 className='text-sm font-bold text-gray-900'>{kep.konu}</h3>
              <p className='mt-0.5 text-xs text-gray-500'>
                {kep.gonderen} · {formatDate(kep.tarih)}
              </p>
              {kep.ozet && <p className='mt-2 text-sm text-gray-600'>{kep.ozet}</p>}
            </div>
          </div>
          {kep.ekler?.length > 0 && (
            <div className='flex shrink-0 flex-col items-start gap-1.5 pl-14 sm:items-end sm:pl-0'>
              <span className='flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400'>
                <Paperclip className='h-3 w-3' /> Ekler
              </span>
              {kep.ekler.map((ek) => (
                <FileLink
                  key={ek.id}
                  url={fileUrls.kepAttachment(kep.id, ek.id)}
                  label={ek.ad}
                  fileName={ek.ad}
                  className='max-w-[200px] text-xs'
                />
              ))}
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function MessageList() {
  const { data, loading, error, reload } = useApi(getSentMessages);
  const [channel, setChannel] = useState('tumu');

  const visible = useMemo(
    () => (data || []).filter((m) => channel === 'tumu' || m.kanal === channel),
    [data, channel]
  );

  if (loading) return <LoadingState text='Mesajlar yükleniyor...' className='h-64' />;
  if (error) return <ErrorState error={error} onRetry={reload} />;

  return (
    <>
      <div className='flex flex-wrap gap-2 border-b border-gray-100 p-4'>
        {[{ key: 'tumu', label: 'Tümü' }, ...Object.entries(CHANNELS).map(([key, c]) => ({ key, label: c.label }))].map(
          (f) => (
            <button
              key={f.key}
              onClick={() => setChannel(f.key)}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                channel === f.key
                  ? 'border-brand bg-brand text-white'
                  : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          )
        )}
      </div>

      {visible.length === 0 ? (
        <EmptyState text='Size gönderilmiş mesaj bulunmamaktadır.' icon={Inbox} />
      ) : (
        <div className='divide-y divide-gray-100'>
          {visible.map((m) => {
            const ch = CHANNELS[m.kanal] || CHANNELS.sms;
            const ChIcon = ch.icon;
            const delivered = m.durum !== 'basarisiz';
            return (
              <div key={m.id} className='flex gap-4 p-5'>
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ch.className}`}>
                  <ChIcon className='h-5 w-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <div className='flex flex-wrap items-center justify-between gap-2'>
                    <p className='text-sm font-semibold text-gray-900'>
                      {m.konu || `${ch.label} bilgilendirmesi`}
                    </p>
                    <span className='text-xs text-gray-400' title={formatDate(m.tarih)}>
                      {formatRelative(m.tarih)}
                    </span>
                  </div>
                  <p className='mt-1 text-sm text-gray-600'>{m.icerik}</p>
                  <div className='mt-2 flex flex-wrap items-center gap-3 text-xs text-gray-500'>
                    <span>Alıcı: {m.hedef}</span>
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        delivered ? 'text-emerald-600' : 'text-red-600'
                      }`}
                    >
                      {delivered ? <CheckCircle2 className='h-3.5 w-3.5' /> : <XCircle className='h-3.5 w-3.5' />}
                      {delivered ? 'İletildi' : 'İletilemedi'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}

export default function Bilgilendirmeler() {
  const [tab, setTab] = useState('kep');

  return (
    <div className='mx-auto max-w-5xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>Bilgilendirmeler</h1>
        <p className='mt-1 text-sm text-gray-500'>
          Firmanıza gönderilen KEP yazıları, SMS ve e-posta bilgilendirmeleri.
        </p>
      </div>

      <div className='mb-6 flex w-full max-w-md space-x-2 rounded-xl bg-gray-100/80 p-1'>
        {TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
                tab === t.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Icon className='h-4 w-4' />
              {t.label}
            </button>
          );
        })}
      </div>

      <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
        {tab === 'kep' ? <KepList /> : <MessageList />}
      </div>
    </div>
  );
}
