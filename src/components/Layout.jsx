import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Home, 
  FileText, 
  User, 
  LogOut, 
  X, 
  Search, 
  Bell, 
  Truck, 
  Send, 
  Briefcase, 
  MessageCircle,
  ExternalLink,
  CheckCheck,
  ArrowLeft
} from 'lucide-react';
import firmaLogo from '../assets/firma-logo.png';
import { tenantConfig } from '../config';
import { getNotifications, markAllNotificationsAsRead } from '../services/api';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  // Masaüstü ve mobil açılır menü state'leri
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [isMobileNotifOpen, setIsMobileNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([]);
  
  // Mobilde akıcı arama çubuğu state'i
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const mobileSearchInputRef = useRef(null);

  const desktopDropdownRef = useRef(null);
  const desktopNotificationRef = useRef(null);
  const mobileDropdownRef = useRef(null);
  const mobileNotificationRef = useRef(null);
  
  const mobileNotifBtnRef = useRef(null);
  const mobileProfileBtnRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true); 
      } else {
        setIsSidebarOpen(false); 
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobil arama açılınca input'a otomatik odaklan
  useEffect(() => {
    if (isMobileSearchOpen && mobileSearchInputRef.current) {
      setTimeout(() => mobileSearchInputRef.current.focus(), 150);
    }
  }, [isMobileSearchOpen]);

  // Bildirimleri API'den çek
  useEffect(() => {
    getNotifications().then(setNotifications).catch(console.error);
  }, []);

  // Dışarı tıklama kontrolü (Masaüstü ve Mobil)
  useEffect(() => {
    function handleClickOutside(event) {
      // Masaüstü Profil
      if (desktopDropdownRef.current && !desktopDropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
      // Masaüstü Bildirim
      if (desktopNotificationRef.current && !desktopNotificationRef.current.contains(event.target)) {
        setIsNotificationOpen(false);
      }
      // Mobil Bildirim
      if (
        mobileNotificationRef.current && 
        !mobileNotificationRef.current.contains(event.target) &&
        !mobileNotifBtnRef.current?.contains(event.target)
      ) {
        setIsMobileNotifOpen(false);
      }
      // Mobil Profil
      if (
        mobileDropdownRef.current && 
        !mobileDropdownRef.current.contains(event.target) &&
        !mobileProfileBtnRef.current?.contains(event.target)
      ) {
        setIsMobileProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const closeSidebarMobile = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    navigate('/login');
  };

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead().then(() => {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    });
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  return (
    <div className="flex h-screen bg-background relative selection:bg-brand/10 selection:text-brand">
      
      {/* MOBİL HEADER */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          
          {/* Sol: Menü Butonu & Logo */}
          <div className="flex items-center">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="rounded-lg p-2 mr-2 text-brand hover:bg-brand/10 active:scale-95 transition-all"
              >
                <Menu className="h-6 w-6" />
             </button>
             <img src={firmaLogo} alt={tenantConfig.name} className="h-8 w-auto object-contain" />
          </div>
          
          {/* Sağ: İkon Butonları */}
          <div className="flex items-center space-x-1.5">
             <button 
               onClick={() => {
                 setIsMobileSearchOpen(true);
                 setIsMobileNotifOpen(false);
                 setIsMobileProfileOpen(false);
               }}
               className="rounded-full p-2 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
             >
                <Search className="h-5 w-5" />
             </button>
             
             {/* Mobil Bildirim Butonu */}
             <button 
               ref={mobileNotifBtnRef}
               onClick={(e) => {
                 e.stopPropagation();
                 setIsMobileProfileOpen(false);
                 setIsMobileNotifOpen(prev => !prev);
               }}
               className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 active:scale-95 transition-all"
             >
               <Bell className="h-5 w-5" />
               {unreadCount > 0 && (
                 <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                   <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                   <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                 </span>
               )}
             </button>

             {/* Mobil Profil Butonu */}
             <button 
               ref={mobileProfileBtnRef}
               onClick={(e) => {
                 e.stopPropagation();
                 setIsMobileNotifOpen(false);
                 setIsMobileProfileOpen(prev => !prev);
               }}
               className="flex items-center justify-center h-8 w-8 rounded-full bg-brand text-white font-bold text-sm hover:bg-brand/90 focus:outline-none active:scale-95 transition-transform ml-1"
             >
               {tenantConfig.name.charAt(0)}
             </button>
          </div>

          {/* MOBİL BİLDİRİM PANELİ */}
          <div 
            ref={mobileNotificationRef}
            className={`absolute top-16 left-3 right-3 sm:left-auto sm:right-3 sm:w-[360px] origin-top rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/10 z-50 overflow-hidden transition-all duration-200 ease-out transform ${
              isMobileNotifOpen 
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between px-4 py-3.5 bg-gray-50/90 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-gray-900">Bildirimler</span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[11px] font-semibold">
                    {unreadCount} Yeni
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={handleMarkAllRead} 
                  className="text-xs font-medium text-brand hover:underline flex items-center gap-1 whitespace-nowrap"
                >
                  <CheckCheck className="h-3.5 w-3.5" /> Tümünü Okundu Say
                </button>
              )}
            </div>
            
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
              {notifications.length === 0 ? (
                <div className="py-8 text-center text-xs text-gray-400">Bildiriminiz bulunmuyor.</div>
              ) : (
                notifications.map(item => (
                  <div 
                    key={item.id} 
                    className={`p-4 text-xs transition-colors hover:bg-gray-50/80 ${
                      item.unread ? 'bg-amber-50/40' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        {item.unread && (
                          <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
                        )}
                        <span className={`font-semibold text-sm ${item.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                          {item.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{item.time}</span>
                    </div>
                    <p className={`text-gray-600 mt-1.5 leading-relaxed text-xs ${item.unread ? 'pl-4' : ''}`}>
                      {item.desc}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* MOBİL PROFİL DROPDOWN */}
          <div 
            ref={mobileDropdownRef}
            className={`absolute top-16 right-3 w-52 origin-top-right rounded-2xl border border-gray-100 bg-white py-1.5 shadow-2xl ring-1 ring-black/10 focus:outline-none z-50 transition-all duration-200 ease-out transform ${
              isMobileProfileOpen
                ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
            }`}
          >
            <div className="px-4 py-2.5 border-b border-gray-100">
               <p className="text-sm font-semibold text-gray-900 truncate">Firma Yetkilisi</p>
               <p className="text-xs text-gray-500 truncate mt-0.5">{tenantConfig.name}</p>
            </div>
            <NavLink 
              to="/panel/firmam"
              onClick={() => setIsMobileProfileOpen(false)}
              className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-brand transition-colors"
            >
              <User className="mr-2.5 h-4 w-4" />
              Profil
            </NavLink>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-2.5 h-4 w-4" />
              Çıkış Yap
            </button>
          </div>

          {/* MOBİL ARAMA ÇUBUĞU */}
          <div 
            className={`absolute inset-0 z-50 flex items-center bg-white px-3 gap-2 transition-all duration-300 ease-in-out transform ${
              isMobileSearchOpen 
                ? 'translate-y-0 opacity-100 pointer-events-auto' 
                : '-translate-y-full opacity-0 pointer-events-none'
            }`}
          >
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="rounded-full p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex flex-1 items-center rounded-xl bg-gray-100 px-3 py-2 border border-gray-200 focus-within:border-brand focus-within:bg-white transition-all">
              <Search className="h-4 w-4 text-gray-400 shrink-0" />
              <input 
                ref={mobileSearchInputRef}
                type="text" 
                placeholder="Fatura, duyuru veya işlem ara..." 
                className="ml-2 w-full bg-transparent text-sm text-gray-700 outline-none placeholder-gray-400"
              />
            </div>
            <button 
              onClick={() => setIsMobileSearchOpen(false)}
              className="rounded-full p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

        </header>
      )}

      {/* OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <img src={firmaLogo} alt={tenantConfig.name} className="h-10 w-auto object-contain" />
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Ana Menü
          </p>
          
          <NavLink 
            to="/panel" 
            end
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20 translate-x-1' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand hover:translate-x-1'
              }`
            }
          >
            <Home className="mr-3 h-5 w-5" />
            Ana Sayfa
          </NavLink>

          <NavLink 
            to="/panel/faturalar" 
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20 translate-x-1' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand hover:translate-x-1'
              }`
            }
          >
            <FileText className="mr-3 h-5 w-5" />
            Faturalar
          </NavLink>

          <NavLink 
            to="/panel/kavaleto" 
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20 translate-x-1' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand hover:translate-x-1'
              }`
            }
          >
            <Truck className="mr-3 h-5 w-5" />
            Kavaleto İşlemleri
          </NavLink>

          <NavLink 
            to="/panel/basvurular" 
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20 translate-x-1' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand hover:translate-x-1'
              }`
            }
          >
            <Send className="mr-3 h-5 w-5" />
            Başvurular
          </NavLink>

          <a
            href="https://ideriosb.org.tr" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center justify-between rounded-xl px-4 py-3 font-medium text-gray-600 transition-all duration-200 hover:bg-gray-100 hover:translate-x-1"
          >
            <div className="flex items-center">
              <Briefcase className="mr-3 h-5 w-5 text-gray-500" />
              <span>Aranan Eleman</span>
            </div>
            <ExternalLink className="h-4 w-4 text-gray-400" />
          </a>
        </nav>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        
        {/* ÜST BAR (Masaüstü) */}
        <header className="hidden lg:flex relative z-30 h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8">
          
          <div className="flex w-full max-w-lg items-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 transition-all duration-200 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/10">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="ml-3 w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-5">
            
            {/* Masaüstü Bildirim Zili & Popover */}
            <div className="relative" ref={desktopNotificationRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsNotificationOpen(prev => !prev);
                }}
                className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 active:scale-95 transition-all"
              >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
                  </span>
                )}
              </button>

              <div 
                className={`absolute right-0 mt-3 w-[380px] origin-top-right rounded-2xl border border-gray-100 bg-white shadow-2xl ring-1 ring-black/5 z-50 overflow-hidden transition-all duration-200 ease-out transform ${
                  isNotificationOpen 
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="flex items-center justify-between px-5 py-3.5 bg-gray-50/70 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900">Bildirimler</span>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-50 text-red-600 px-2 py-0.5 text-[11px] font-semibold">
                        {unreadCount} Yeni
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllRead} 
                      className="text-xs font-medium text-brand hover:underline flex items-center gap-1 whitespace-nowrap"
                    >
                      <CheckCheck className="h-3.5 w-3.5" /> Tümünü Okundu Say
                    </button>
                  )}
                </div>
                
                <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400">Yeni bildiriminiz bulunmuyor.</div>
                  ) : (
                    notifications.map(item => (
                      <div 
                        key={item.id} 
                        className={`p-4 text-xs transition-colors hover:bg-gray-50/90 cursor-pointer ${
                          item.unread ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {item.unread && (
                              <span className="h-2 w-2 rounded-full bg-brand shrink-0" />
                            )}
                            <h4 className={`font-semibold ${item.unread ? 'text-gray-900' : 'text-gray-700'}`}>
                              {item.title}
                            </h4>
                          </div>
                          <span className="text-[11px] text-gray-400 shrink-0 whitespace-nowrap">{item.time}</span>
                        </div>
                        <p className={`mt-1.5 text-xs text-gray-500 leading-relaxed ${item.unread ? 'pl-4' : ''}`}>
                          {item.desc}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Profil Dropdown (Masaüstü) */}
            <div className="relative" ref={desktopDropdownRef}>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setIsProfileDropdownOpen(prev => !prev);
                }}
                className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none active:scale-95 transition-all"
              >
                <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg hover:bg-brand/90 transition-colors shadow-sm">
                  {tenantConfig.name.charAt(0)}
                </div>
              </button>

              <div 
                className={`absolute right-0 mt-3 w-48 origin-top-right rounded-xl border border-gray-100 bg-white py-1 shadow-2xl ring-1 ring-black/10 focus:outline-none z-50 transition-all duration-200 ease-out transform ${
                  isProfileDropdownOpen 
                    ? 'opacity-100 scale-100 translate-y-0 pointer-events-auto' 
                    : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                }`}
              >
                <div className="px-4 py-2 border-b">
                   <p className="text-sm font-medium text-gray-900 truncate">Firma Yetkilisi</p>
                   <p className="text-xs text-gray-500 truncate">{tenantConfig.name}</p>
                </div>
                <NavLink 
                  to="/panel/firmam"
                  onClick={() => setIsProfileDropdownOpen(false)}
                  className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand transition-colors"
                >
                  <User className="mr-2 h-4 w-4" />
                  Profil
                </NavLink>
                <button 
                  onClick={handleLogout}
                  className="flex w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Çıkış Yap
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Sayfa İçeriği & Footer Alanı */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-background relative flex flex-col justify-between">
          <div className="flex-1">
            <Outlet /> 
          </div>

          <footer className="mt-12 border-t border-gray-200/70 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-400">
            <p>© {new Date().getFullYear()} {tenantConfig.fullName}. Tüm hakları saklıdır.</p>
            <div className="flex items-center space-x-4">
              <span className="hover:text-gray-600 cursor-pointer transition-colors">KVKK Aydınlatma Metni</span>
              <span>•</span>
              <span className="hover:text-gray-600 cursor-pointer transition-colors">Gizlilik Politikası</span>
              <span>•</span>
              <span className="rounded bg-gray-200/60 px-1.5 py-0.5 text-[10px] font-semibold text-gray-500">v1.0.0</span>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}