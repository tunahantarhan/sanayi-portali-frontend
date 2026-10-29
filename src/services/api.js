import {
  mockDashboardData,
  mockInvoices,
  mockApplications,
  mockKavaletoList,
  mockFirmProfile,
  mockNotifications,
} from './mockData';

// Dinamik ERP API yapılandırması
export const ERP_CONFIG = {
  baseURL: import.meta.env.VITE_ERP_BASE_URL || 'http://erp.ideriosb.org.tr/api/v1/sanayici-panel',
  apiKey: import.meta.env.VITE_ERP_API_KEY || '',
  get headers() {
    return {
      Authorization: `Colab-Api-Key ${this.apiKey}`,
      Accept: 'application/json',
    };
  },
};

// Ağ gecikmesini simüle etmek için yardımcı gecikme (opsiyonel 200ms)
const simulateDelay = (data, delay = 200) => {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
};

// 1. Dashboard API Servisleri
export const getDashboardData = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/dashboard')).data;
  return simulateDelay(mockDashboardData);
};

// 2. Faturalar API Servisi
export const getInvoices = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/invoices')).data;
  return simulateDelay(mockInvoices);
};

// 3. Başvurular API Servisi
export const getPreviousApplications = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/applications')).data;
  return simulateDelay(mockApplications);
};

export const submitNewApplication = async (formData) => {
  // TODO: Fastify hazır olduğunda -> return (await axios.post('/api/applications', formData)).data;
  return simulateDelay(
    // Gerçekte oluşacak response delay'ini simüle ediyoruz, backend bağlandığında gerek kalmayacak
    { success: true, takipNo: 'IDOSB-2026-' + Math.floor(1000 + Math.random() * 9000) },
    800
  );
};

// 4. Kavaleto API Servisi
export const getKavaletoList = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/kavaleto')).data;
  return simulateDelay(mockKavaletoList);
};

// 5. Firma Profili API Servisi
export const getFirmProfile = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/firm/profile')).data;
  return simulateDelay(mockFirmProfile);
};

// 6. Bildirimler API Servisi
export const getNotifications = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.get('/api/notifications')).data;
  return simulateDelay(mockNotifications);
};
export const markAllNotificationsAsRead = async () => {
  // TODO: Fastify hazır olduğunda -> return (await axios.post('/api/notifications/mark-read')).data;
  return simulateDelay({ success: true });
};
