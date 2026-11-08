// Liste sıralama yardımcısı.
// getters: { kolonAnahtarı: (satır) => karşılaştırılacak değer }
export const sortList = (list, getters, { key, direction }) => {
  const getValue = getters[key];
  if (!getValue) return list;
  const dir = direction === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    const av = getValue(a);
    const bv = getValue(b);
    if (typeof av === 'string' || typeof bv === 'string') {
      return String(av ?? '').localeCompare(String(bv ?? ''), 'tr', { numeric: true }) * dir;
    }
    return ((av ?? 0) - (bv ?? 0)) * dir;
  });
};

export const nextSort = (current, key) => ({
  key,
  direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc',
});
