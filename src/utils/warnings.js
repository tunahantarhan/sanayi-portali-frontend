import { tenantConfig } from '../config';
import { daysUntil } from './format';

export const ALERT_TYPE_LABELS = {
  vadesi_gecmis_borc: 'Vadesi Geçmiş Borç',
  eksik_teminat: 'Eksik Teminat',
  eksik_dbs: 'Eksik DBS',
};

export const TEMINAT_TYPE_LABELS = {
  teminat_mektubu: 'Teminat Mektubu',
  dbs: 'DBS (Doğrudan Borçlandırma Sistemi)',
  nakit: 'Nakit Teminat',
};

// Firma profilinden süresi yaklaşan/geçen teminat ve kanal izni uyarılarını üretir.
// Eşikler config'tedir (warningThresholdDays). Uyarı yoksa boş dizi döner.
export const buildExpiryWarnings = (profile) => {
  if (!profile) return [];
  const { teminat: teminatDays, kanalIzni: kanalDays } = tenantConfig.warningThresholdDays;
  const warnings = [];

  (profile.teminatlar || []).forEach((t) => {
    const days = daysUntil(t.bitisTarihi);
    if (days !== null && days <= teminatDays) {
      warnings.push({
        id: `teminat-${t.id}`,
        kind: 'teminat',
        title: `${TEMINAT_TYPE_LABELS[t.tur] || 'Teminat'} süresi ${days < 0 ? 'doldu' : 'doluyor'}`,
        text: `${t.banka ? `${t.banka} ` : ''}${TEMINAT_TYPE_LABELS[t.tur]?.toLowerCase() || 'teminat'} süresi`,
        date: t.bitisTarihi,
        days,
      });
    }
  });

  const kanal = profile.kanalIzni;
  const kanalLeft = daysUntil(kanal?.bitisTarihi);
  if (kanalLeft !== null && kanalLeft <= kanalDays) {
    warnings.push({
      id: 'kanal-izni',
      kind: 'kanal',
      title: `Kanal bağlantı izni ${kanalLeft < 0 ? 'süresi doldu' : 'yenileme'}`,
      text: 'Kanal bağlantı izninizin süresi',
      date: kanal.bitisTarihi,
      days: kanalLeft,
    });
  }

  return warnings.sort((a, b) => a.days - b.days);
};
