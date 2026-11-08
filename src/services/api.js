// Sayfaların ve Layout'un veri aldığı tek katman.
// Her fonksiyon, portal backend'indeki (Fastify) bir uç noktaya karşılık gelir.
// Uç noktaların ayrıntılı sözleşmesi: Backend Rehberi (notlar/, git dışında).
//
// USE_MOCK açıkken (varsayılan) veriler mockApi'den gelir; VITE_USE_MOCK=false ile gerçek backend kullanılır.

import { http, buildApiUrl, USE_MOCK } from './http';
import { mockApi } from './mockApi';

const get = (url) => http.get(url).then((r) => r.data);
const post = (url, body) => http.post(url, body).then((r) => r.data);

// ---- Giriş ----

// POST /api/auth/login  { vergiNo, sifre } -> { kanal, hedef, gecerlilikSn }
export const login = (vergiNo, sifre) =>
  USE_MOCK ? mockApi.login({ vergiNo, sifre }) : post('/auth/login', { vergiNo, sifre });

// POST /api/auth/verify  { kod } -> { firma }  (+ oturum cookie'si)
export const verifyCode = (kod) =>
  USE_MOCK ? mockApi.verify({ kod }) : post('/auth/verify', { kod });

// POST /api/auth/resend -> { kanal, hedef, gecerlilikSn }
export const resendCode = () => (USE_MOCK ? mockApi.resend() : post('/auth/resend'));

// POST /api/auth/logout -> 204
export const logout = () => (USE_MOCK ? mockApi.logout() : post('/auth/logout'));

// GET /api/auth/me -> { firma } | 401
export const getSession = () => (USE_MOCK ? mockApi.me() : get('/auth/me'));

// ---- Ana sayfa ----

// GET /api/dashboard -> { tuketim, duyurular }
export const getDashboardData = () => (USE_MOCK ? mockApi.getDashboard() : get('/dashboard'));

// GET /api/alerts -> { data: [{ id, tur, baslik, aciklama, tutar, sonTarih, dosyalar }] }
export const getAlerts = () =>
  (USE_MOCK ? mockApi.getAlerts() : get('/alerts')).then((r) => r.data);

// ---- Faturalar ----

// GET /api/invoices -> { odemeAktif, data: [...] }
export const getInvoices = () => (USE_MOCK ? mockApi.getInvoices() : get('/invoices'));

// ---- OSB Başvuru ----

// GET /api/applications/types -> { data: [{ id, ad, aciklama, sik }] }
export const getApplicationTypes = () =>
  (USE_MOCK ? mockApi.getApplicationTypes() : get('/applications/types')).then((r) => r.data);

// GET /api/applications -> { data: [...] }
export const getApplications = () =>
  (USE_MOCK ? mockApi.getApplications() : get('/applications')).then((r) => r.data);

// POST /api/applications (multipart/form-data: turId, konu, detay, files[]) -> { id, evrakNo }
export const submitApplication = ({ turId, konu, detay, files }) => {
  if (USE_MOCK) return mockApi.createApplication({ turId, konu, detay, files });
  const form = new FormData();
  form.append('turId', String(turId));
  form.append('konu', konu);
  form.append('detay', detay);
  files.forEach((file) => form.append('files[]', file));
  return http.post('/applications', form).then((r) => r.data);
};

// ---- Kavaleto ----

// GET /api/kavaleto -> { data: [...] }
export const getKavaletoList = () =>
  (USE_MOCK ? mockApi.getKavaleto() : get('/kavaleto')).then((r) => r.data);

// ---- Firmam ----

// GET /api/firm/profile
export const getFirmProfile = () => (USE_MOCK ? mockApi.getFirmProfile() : get('/firm/profile'));

// ---- Bildirimler ----

// GET /api/notifications -> { data: [...] }
export const getNotifications = () =>
  (USE_MOCK ? mockApi.getNotifications() : get('/notifications')).then((r) => r.data);

// POST /api/notifications/mark-read -> 204
export const markAllNotificationsAsRead = () =>
  USE_MOCK ? mockApi.markAllNotificationsRead() : post('/notifications/mark-read');

// ---- Bilgilendirmeler ----

// GET /api/kep -> { data: [...] }
export const getKepMessages = () => (USE_MOCK ? mockApi.getKep() : get('/kep')).then((r) => r.data);

// GET /api/messages -> { data: [...] }  (firmaya gönderilen SMS ve e-postalar)
export const getSentMessages = () =>
  (USE_MOCK ? mockApi.getMessages() : get('/messages')).then((r) => r.data);

// ---- Dosya indirme ----
// İndirmeler cookie ile yetkilendirilen düz GET isteğidir. Mock modda gerçek dosya yoktur (null döner).
// Backend her istekte dosyanın oturumdaki firmaya ait olduğunu kontrol eder.

const fileUrl = (path) => (USE_MOCK ? null : buildApiUrl(path));

export const fileUrls = {
  invoicePdf: (invoiceId) => fileUrl(`/invoices/${encodeURIComponent(invoiceId)}/pdf`),
  applicationFile: (applicationId, fileId) =>
    fileUrl(
      `/applications/${encodeURIComponent(applicationId)}/files/${encodeURIComponent(fileId)}`
    ),
  kavaletoPdf: (kavaletoId) => fileUrl(`/kavaleto/${encodeURIComponent(kavaletoId)}/pdf`),
  alertFile: (fileId) => fileUrl(`/alerts/files/${encodeURIComponent(fileId)}`),
  kepAttachment: (kepId, fileId) =>
    fileUrl(`/kep/${encodeURIComponent(kepId)}/files/${encodeURIComponent(fileId)}`),
};
