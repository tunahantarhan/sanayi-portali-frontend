// Backend olmadan çalışan sahte API. Gerçek uç noktalarla aynı imza ve yanıt şeklini döndürür.
// Yalnızca VITE_USE_MOCK=false verilmediğinde (demo, geliştirme) kullanılır.

import { ApiError } from './http';
import { tenantConfig } from '../config';
import {
  mockFirm,
  mockDashboard,
  mockAlerts,
  mockInvoices,
  mockApplicationTypes,
  mockApplications,
  mockKavaleto,
  mockFirmProfile,
  mockIsgaliye,
  mockNotifications,
  mockKep,
  mockMessages,
} from './mockData';

const delay = (data, ms = 250) =>
  new Promise((resolve) => setTimeout(() => resolve(structuredClone(data)), ms));

const fail = (message, status, code, ms = 400) =>
  new Promise((_, reject) => setTimeout(() => reject(new ApiError(message, { status, code })), ms));

// Demo oturumu sayfa yenilenince kaybolmasın diye sessionStorage'da tutulur.
const SESSION_KEY = 'mock-session';
const storage = {
  get() {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY));
    } catch {
      return null;
    }
  },
  set(value) {
    try {
      if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
      else sessionStorage.removeItem(SESSION_KEY);
    } catch {
      // Depolama kapalıysa oturum yalnızca bellekte kalır
    }
  },
};

let pendingLogin = null; // { vergiNo, sendCount }
let lastCodeSentAt = 0;

// Kademeli süre: 1. gönderim 60 sn, 2. 180 sn, sonrakiler 300 sn (config.otpStepsSec)
const otpSec = () => {
  const steps = tenantConfig.otpStepsSec;
  return steps[Math.min((pendingLogin?.sendCount || 1) - 1, steps.length - 1)];
};

let applications = structuredClone(mockApplications);
let notifications = structuredClone(mockNotifications);

export const mockApi = {
  // ---- Giriş ----
  async login({ vergiNo, sifre }) {
    if (!/^\d{10,11}$/.test(vergiNo) || !sifre || sifre.length < 8) {
      return fail('Vergi numarası veya şifre hatalı.', 401, 'INVALID_CREDENTIALS');
    }
    pendingLogin = { vergiNo, sendCount: 1 };
    lastCodeSentAt = Date.now();
    return delay({ kanal: 'sms', hedef: '+90 5** *** ** 12', gecerlilikSn: otpSec() }, 600);
  },

  async verify({ kod }) {
    if (!pendingLogin)
      return fail('Oturum süresi doldu, lütfen tekrar giriş yapınız.', 401, 'NO_PENDING_LOGIN');
    if ((Date.now() - lastCodeSentAt) / 1000 > otpSec()) {
      return fail('Kodun süresi doldu. Lütfen yeni kod isteyiniz.', 401, 'OTP_EXPIRED');
    }
    // Demo: "000000" hatalı kod senaryosunu gösterir, diğer 6 haneli kodlar kabul edilir.
    if (!/^\d{6}$/.test(kod) || kod === '000000') {
      return fail('Doğrulama kodu hatalı.', 401, 'OTP_INVALID');
    }
    const firma = { ...mockFirm, vergiNo: pendingLogin.vergiNo };
    pendingLogin = null;
    storage.set(firma);
    return delay({ firma }, 500);
  },

  async resend() {
    if (!pendingLogin)
      return fail('Oturum süresi doldu, lütfen tekrar giriş yapınız.', 401, 'NO_PENDING_LOGIN');
    const elapsed = (Date.now() - lastCodeSentAt) / 1000;
    if (elapsed < otpSec()) {
      return fail('Yeni kod için süre dolmadı.', 429, 'OTP_TOO_EARLY');
    }
    pendingLogin = { ...pendingLogin, sendCount: pendingLogin.sendCount + 1 };
    lastCodeSentAt = Date.now();
    return delay({ kanal: 'sms', hedef: '+90 5** *** ** 12', gecerlilikSn: otpSec() }, 500);
  },

  async logout() {
    storage.set(null);
    return delay(null, 100);
  },

  async me() {
    const firma = storage.get();
    if (!firma) return fail('Oturum bulunamadı.', 401, 'UNAUTHENTICATED', 50);
    return delay({ firma }, 50);
  },

  // ---- Panel ----
  getDashboard: () => delay(mockDashboard),
  getAlerts: () => delay({ data: mockAlerts }),
  getInvoices: () => delay(mockInvoices),
  getApplicationTypes: () => delay({ data: mockApplicationTypes }),
  getApplications: () => delay({ data: applications }),

  async createApplication({ turId, konu, detay, files }) {
    const tur = mockApplicationTypes.find((t) => t.id === turId);
    const id = Math.max(...applications.map((a) => a.id)) + 1;
    const today = new Date();
    const yyyyMmDd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    applications = [
      {
        id,
        evrakNo: String(id),
        evrakTipi: tur?.ad || 'Başvuru',
        konu,
        detay,
        tarih: yyyyMmDd,
        durum: 'islemde',
        acan: 'firma',
        talepDosyalari: files.map((f, i) => ({ id: `${id}-${i + 1}`, ad: f.name })),
        cevapDosyalari: [],
      },
      ...applications,
    ];
    return delay({ id, evrakNo: String(id) }, 900);
  },

  getKavaleto: () => delay({ data: mockKavaleto }),
  getFirmProfile: () => delay(mockFirmProfile),
  getIsgaliye: () => delay({ data: mockIsgaliye }),
  getNotifications: () => delay({ data: notifications }),

  async markAllNotificationsRead() {
    notifications = notifications.map((n) => ({ ...n, okundu: true }));
    return delay(null, 150);
  },

  getKep: () => delay({ data: mockKep }),
  getMessages: () => delay({ data: mockMessages }),
};
