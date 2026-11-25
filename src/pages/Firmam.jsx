import {
  Building2,
  ShieldCheck,
  FileCheck,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Briefcase,
  Landmark,
  Gauge,
} from 'lucide-react';
import { tenantConfig } from '../config';
import { getFirmProfile, getAlerts } from '../services/api';
import useApi from '../hooks/useApi';
import AlertsPanel from '../components/AlertsPanel';
import { LoadingState, ErrorState } from '../components/ui/PageState';
import { TEMINAT_TYPE_LABELS } from '../utils/warnings';
import { daysUntil, formatCurrency, formatDate, formatDaysLeft } from '../utils/format';

// Kalan güne göre renk: geçmiş/7 gün içinde kırmızı, eşik içinde sarı, değilse yeşil
const expiryTone = (days, threshold) => {
  if (days === null)
    return {
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    };
  if (days <= 7) return { text: 'text-red-600', badge: 'bg-red-50 text-red-700 ring-red-600/20' };
  if (days <= threshold)
    return { text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 ring-amber-600/20' };
  return { text: 'text-emerald-600', badge: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' };
};

export default function Firmam() {
  const profile = useApi(getFirmProfile);
  const alerts = useApi(getAlerts);
  const { contact, warningThresholdDays } = tenantConfig;

  if (profile.loading) return <LoadingState text='Firma bilgileri yükleniyor...' />;
  if (profile.error) return <ErrorState error={profile.error} onRetry={profile.reload} />;

  const firm = profile.data;
  // Backend bir alanı göndermezse (servisi yoksa) ilgili kart hiç gösterilmez.
  const hasTeminat = Array.isArray(firm.teminatlar);
  const hasKanal = 'kanalIzni' in firm;
  const yerler = firm.yerler || [];
  const teminatlar = firm.teminatlar || [];
  const teminatDays = teminatlar.map((t) => daysUntil(t.bitisTarihi));
  const teminatNeedsRenewal = teminatDays.some(
    (d) => d !== null && d <= warningThresholdDays.teminat
  );

  const kanal = firm.kanalIzni;
  const kanalDays = daysUntil(kanal?.bitisTarihi);
  const kanalTone = expiryTone(kanalDays, warningThresholdDays.kanalIzni);

  return (
    <div className='mx-auto max-w-7xl space-y-8'>
      <div>
        <h1 className='text-2xl font-bold text-gray-800'>Firma Profili ve Bilgileri</h1>
        <p className='mt-1 text-sm text-gray-500'>
          Sicil kayıtları, teminatlar ve OSB ile olan izinleriniz.
        </p>
      </div>

      <AlertsPanel alerts={alerts.data} />

      {/* Firma genel bilgileri */}
      <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h3 className='mb-4 flex items-center gap-2 text-lg font-bold text-gray-900'>
          <Building2 className='h-5 w-5 text-brand' /> Firma Genel Bilgileri
        </h3>
        <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4'>
          <InfoItem label='Firma Unvanı'>{firm.unvan}</InfoItem>
          <InfoItem label={firm.vergiDairesi ? 'Vergi No / Dairesi' : 'Vergi No'}>
            {firm.vergiNo}
            {firm.vergiDairesi && ` (${firm.vergiDairesi})`}
          </InfoItem>
          {firm.nace && (
            <InfoItem label='NACE Kodu'>
              {firm.nace.kod}
              {firm.nace.aciklama && (
                <span className='mt-0.5 block text-xs font-normal text-gray-500'>
                  {firm.nace.aciklama}
                </span>
              )}
            </InfoItem>
          )}
          {firm.yetkili && (
            <InfoItem label='Yetkili Kişi'>
              {firm.yetkili.adSoyad || '—'}
              {[firm.yetkili.telefon, firm.yetkili.eposta].filter(Boolean).map((v) => (
                <span key={v} className='mt-0.5 block break-all text-xs font-normal text-gray-500'>
                  {v}
                </span>
              ))}
            </InfoItem>
          )}
          {firm.aboneNo && <InfoItem label='Abone No'>{firm.aboneNo}</InfoItem>}
          {firm.smsTebligat && (
            <InfoItem label='SMS Bilgilendirme'>
              <span
                className={`flex items-center gap-1 ${
                  firm.smsTebligat.aktif ? 'text-emerald-600' : 'text-gray-500'
                }`}
              >
                <MessageSquare className='h-3.5 w-3.5' />
                {firm.smsTebligat.aktif ? 'Aktif' : 'Pasif'}
                {firm.smsTebligat.telefon && ` (${firm.smsTebligat.telefon})`}
              </span>
            </InfoItem>
          )}
        </div>
      </div>

      {/* Parsel ve tesisatlar: aynı vergi no altında birden fazla yer olabilir */}
      {yerler.length > 0 && (
        <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
          <h3 className='mb-4 flex items-center gap-2 text-lg font-bold text-gray-900'>
            <Landmark className='h-5 w-5 text-brand' /> Parsel ve Tesisatlar
          </h3>
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {yerler.map((yer, i) => (
              <div
                key={`${yer.unvan}-${i}`}
                className='rounded-xl border border-gray-100 bg-gray-50 p-4'
              >
                <p className='text-sm font-semibold text-gray-800'>{yer.unvan}</p>
                {yer.adres && (
                  <p className='mt-1 flex items-start gap-1.5 text-xs text-gray-500'>
                    <MapPin className='mt-0.5 h-3.5 w-3.5 shrink-0' />
                    {yer.adres}
                  </p>
                )}
                <div className='mt-3 flex flex-wrap gap-1.5'>
                  {yer.parseller.map((p) => (
                    <span
                      key={`p-${p}`}
                      className='rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200'
                    >
                      Parsel {p}
                    </span>
                  ))}
                  {yer.tesisatlar.map((t) => (
                    <span
                      key={`t-${t}`}
                      className='flex items-center gap-1 rounded-md bg-white px-2 py-0.5 text-xs font-medium text-gray-700 ring-1 ring-gray-200'
                    >
                      <Gauge className='h-3 w-3 text-brand' />
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(hasTeminat || hasKanal) && (
        <div className='grid grid-cols-1 gap-6 lg:grid-cols-2'>
          {/* Teminatlar */}
          {hasTeminat && (
            <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='flex items-center gap-2 text-lg font-bold text-gray-900'>
                  <ShieldCheck className='h-5 w-5 text-brand' /> Teminat Bilgileri
                </h3>
                {teminatNeedsRenewal && (
                  <span className='rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-600/20'>
                    Yenileme Bekliyor
                  </span>
                )}
              </div>

              {teminatlar.length === 0 ? (
                <p className='text-sm text-gray-500'>Kayıtlı teminat bulunmamaktadır.</p>
              ) : (
                <div className='space-y-4'>
                  {teminatlar.map((item, i) => {
                    const days = teminatDays[i];
                    const tone = expiryTone(days, warningThresholdDays.teminat);
                    return (
                      <div
                        key={item.id}
                        className='flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0 last:pb-0'
                      >
                        <div className='min-w-0'>
                          <p className='text-sm font-semibold text-gray-800'>
                            {TEMINAT_TYPE_LABELS[item.tur] || item.tur}
                          </p>
                          <p className='text-xs text-gray-500'>
                            {[item.banka, item.belgeNo].filter(Boolean).join(' · ') || '—'}
                          </p>
                        </div>
                        <div className='shrink-0 text-right'>
                          <p className='text-sm font-bold text-gray-900'>
                            {formatCurrency(item.tutar)}
                          </p>
                          <p className={`text-xs font-medium ${tone.text}`}>
                            {item.bitisTarihi
                              ? `Bitiş: ${formatDate(item.bitisTarihi)} · ${formatDaysLeft(days)}`
                              : 'Süresiz / Aktif'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Kanal bağlantı izni */}
          {hasKanal && (
            <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
              <div className='mb-4 flex items-center justify-between'>
                <h3 className='flex items-center gap-2 text-lg font-bold text-gray-900'>
                  <FileCheck className='h-5 w-5 text-brand' /> Kanal Bağlantı İzni
                </h3>
                {kanalDays !== null && (
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${kanalTone.badge}`}
                  >
                    {formatDaysLeft(kanalDays)}
                  </span>
                )}
              </div>

              {kanal ? (
                <div className='space-y-3'>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>İzin Belge No:</span>
                    <span className='font-semibold text-gray-800'>{kanal.belgeNo || '—'}</span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Geçerlilik Başlangıç:</span>
                    <span className='font-semibold text-gray-800'>
                      {formatDate(kanal.baslangicTarihi)}
                    </span>
                  </div>
                  <div className='flex justify-between text-sm'>
                    <span className='text-gray-500'>Bitiş Tarihi:</span>
                    <span className={`font-bold ${kanalTone.text}`}>
                      {formatDate(kanal.bitisTarihi)}
                    </span>
                  </div>
                  <p className='mt-2 rounded-xl border border-gray-100 bg-gray-50 p-3 text-xs text-gray-500'>
                    Süre bitiminden önce arıtma tesisi parametre değerlerinizle birlikte OSB Başvuru
                    ekranından yenileme başvurusu yapmanız gerekmektedir.
                  </p>
                </div>
              ) : (
                <p className='text-sm text-gray-500'>Kanal bağlantı izni kaydı bulunmamaktadır.</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* OSB iletişim (config'ten) */}
      <div className='rounded-2xl border border-gray-200 bg-white p-6 shadow-sm'>
        <h3 className='mb-4 text-lg font-bold text-gray-900'>
          {tenantConfig.fullName} Bölge Müdürlüğü
        </h3>
        <div className='grid grid-cols-1 gap-6 text-sm md:grid-cols-4'>
          <div className='flex items-start gap-3'>
            <MapPin className='mt-0.5 h-5 w-5 shrink-0 text-brand' />
            <div>
              <p className='font-semibold text-gray-800'>Adres</p>
              <p className='mt-1 text-xs text-gray-500'>{contact.adres}</p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Phone className='mt-0.5 h-5 w-5 shrink-0 text-brand' />
            <div>
              <p className='font-semibold text-gray-800'>Santral / Telefon</p>
              <a
                href={`tel:${contact.telefon.replace(/[^\d+]/g, '')}`}
                className='mt-1 block text-xs text-gray-500 hover:text-brand'
              >
                {contact.telefon}
              </a>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Mail className='mt-0.5 h-5 w-5 shrink-0 text-brand' />
            <div>
              <p className='font-semibold text-gray-800'>E-Posta & KEP</p>
              <p className='mt-1 text-xs text-gray-500'>
                <a href={`mailto:${contact.eposta}`} className='hover:text-brand'>
                  {contact.eposta}
                </a>
                <br />
                {contact.kep}
              </p>
            </div>
          </div>
          <div className='flex items-start gap-3'>
            <Briefcase className='mt-0.5 h-5 w-5 shrink-0 text-brand' />
            <div>
              <p className='font-semibold text-gray-800'>İstihdam / İlan</p>
              <p className='mt-1 text-xs text-gray-500'>
                {tenantConfig.name} kariyer sayfasından personel arayışlarınızı yayınlayabilirsiniz.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoItem({ label, children }) {
  return (
    <div className='min-w-0'>
      <span className='text-xs font-medium text-gray-400'>{label}</span>
      <div className='mt-1 text-sm font-semibold text-gray-800'>{children}</div>
    </div>
  );
}
