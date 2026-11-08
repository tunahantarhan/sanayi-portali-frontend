// Backend tarihleri ISO (YYYY-MM-DD veya ISO 8601), tutarları sayı olarak gönderir.
// Ekrana uygun biçimlendirme burada yapılır.

const MONTHS = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

// "2026-10-24" yerel saatle gece yarısı olarak yorumlanır (UTC kayması olmasın diye).
export const parseDate = (value) => {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const toTimestamp = (value) => parseDate(value)?.getTime() ?? 0;

// "2026-10-24" -> "24.10.2026"
export const formatDate = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

// "2026-09" -> "Eylül 2026"
export const formatPeriod = (value) => {
  if (!value) return '—';
  const [y, m] = value.split('-').map(Number);
  if (!y || !m) return value;
  return `${MONTHS[m - 1]} ${y}`;
};

// "2026-09" -> "Eyl"
export const formatMonthShort = (value) => {
  const [, m] = (value || '').split('-').map(Number);
  return m ? MONTHS[m - 1].slice(0, 3) : value;
};

// ISO zaman damgası -> "10 dk önce", "2 saat önce", "Dün", "28.10.2026"
export const formatRelative = (value) => {
  const date = parseDate(value);
  if (!date) return '';
  const diffMin = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMin < 1) return 'Az önce';
  if (diffMin < 60) return `${diffMin} dk önce`;
  const diffHour = Math.round(diffMin / 60);
  if (diffHour < 24) return `${diffHour} saat önce`;
  const diffDay = Math.round(diffHour / 24);
  if (diffDay === 1) return 'Dün';
  if (diffDay < 7) return `${diffDay} gün önce`;
  return formatDate(value);
};

// Bugünden hedef tarihe kalan tam gün sayısı (geçmişse negatif)
export const daysUntil = (value) => {
  const date = parseDate(value);
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};

export const formatDaysLeft = (days) => {
  if (days === null || days === undefined) return '';
  if (days < 0) return `${Math.abs(days)} gün geçti`;
  if (days === 0) return 'Bugün sona eriyor';
  return `${days} gün kaldı`;
};

export const formatCurrency = (amount) =>
  amount === null || amount === undefined
    ? '—'
    : new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(amount);

export const formatNumber = (value, fractionDigits = 0) =>
  value === null || value === undefined
    ? '—'
    : new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: fractionDigits,
        maximumFractionDigits: fractionDigits,
      }).format(value);

export const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
};
