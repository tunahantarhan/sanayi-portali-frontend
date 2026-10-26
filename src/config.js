// Kurum/Firma yapılandırma dosyası

export const tenantConfig = {
  name: 'İDOSB',
  fullName: 'İstanbul Deri Organize Sanayi Bölgesi',

  // Tailwind config ile senkronize çalışacak ana tema rengi
  // Not: Tailwind'in de bu rengi derleyebilmesi için tailwind.config.js içindeki
  // brand: '#******' değerinin buradaki primary ile AYNI olması gerekir.
  colors: {
    primary: '#83472F',
  },
};
