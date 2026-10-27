import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { Menu, Home, FileText, User, LogOut, X, Search, Bell, ClipboardList, Send, Truck } from 'lucide-react';
import firmaLogo from '../assets/firma-logo.png';
import { tenantConfig } from '../config';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
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

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  const closeSidebarMobile = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  const handleLogout = () => {
    // TODO: Gerçek çıkış işlemleri eklenecek (token silme vb.)
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-background">
      
      {/* MOBİL HEADER */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          <div className="flex items-center">
             <button 
                onClick={() => setIsSidebarOpen(true)} 
                className="rounded-lg p-2 mr-2 text-brand hover:bg-brand/10"
              >
                <Menu className="h-6 w-6" />
             </button>
             <img src={firmaLogo} alt={tenantConfig.name} className="h-8 w-auto object-contain" />
          </div>
          
          {/* Mobilde Sağ Üst İkonlar */}
          <div className="flex items-center space-x-2">
             <button className="rounded-full p-2 text-gray-500 hover:bg-gray-100">
                <Search className="h-5 w-5" />
             </button>
             
             <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
              </span>
            </button>

            {/* Profil Dropdown (Mobil) */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center justify-center h-8 w-8 rounded-full bg-brand text-white font-bold text-sm hover:bg-brand/90 focus:outline-none"
              >
                {tenantConfig.name.charAt(0)}
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b">
                     <p className="text-sm font-medium text-gray-900 truncate">Firma Yetkilisi</p>
                     <p className="text-xs text-gray-500 truncate">{tenantConfig.name}</p>
                  </div>
                  <NavLink 
                    to="/panel/firmam"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </NavLink>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
      )}

      {/* OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <img src={firmaLogo} alt={tenantConfig.name} className="h-10 w-auto object-contain" />
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
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
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
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
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
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
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
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
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
              }`
            }
          >
            <Send className="mr-3 h-5 w-5" />
            Başvurular
          </NavLink>
        </nav>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 flex flex-col overflow-hidden pt-16 lg:pt-0">
        
        {/* ÜST BAR */}
        <header className="hidden lg:flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 md:px-8">
          
          {/* Arama Kısmı */}
          <div className="flex w-full max-w-lg items-center rounded-xl border border-gray-200 bg-gray-100 px-4 py-2.5 transition-colors focus-within:border-brand focus-within:bg-white focus-within:ring-1 focus-within:ring-brand">
            <Search className="h-5 w-5 text-gray-400" />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="ml-3 w-full bg-transparent text-sm text-gray-700 placeholder-gray-500 outline-none"
            />
          </div>

          <div className="flex items-center space-x-5">
            
            {/* Bildirim Çanı */}
            <button className="relative rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
              <Bell className="h-6 w-6" />
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border-2 border-white"></span>
              </span>
            </button>
            
            {/* Profil İkonu */}
            <div className="relative" ref={dropdownRef}>
              <button 
                onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                className="flex items-center space-x-2 rounded-full p-1 hover:bg-gray-100 focus:outline-none"
              >
                <div className="h-10 w-10 rounded-full bg-brand flex items-center justify-center text-white font-bold text-lg hover:bg-brand/90 transition-colors">
                  {tenantConfig.name.charAt(0)}
                </div>
              </button>

              {isProfileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-xl border border-gray-100 bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="px-4 py-2 border-b">
                     <p className="text-sm font-medium text-gray-900 truncate">Firma Yetkilisi</p>
                     <p className="text-xs text-gray-500 truncate">{tenantConfig.name}</p>
                  </div>
                  <NavLink 
                    to="/panel/firmam"
                    onClick={() => setIsProfileDropdownOpen(false)}
                    className="flex px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-brand"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </NavLink>
                  <button 
                    onClick={handleLogout}
                    className="flex w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Çıkış Yap
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Sayfa İçeriği */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-background">
          <Outlet /> {/* TODO: React Router'dan gelen alt sayfalar burada render edilecek */}
        </div>
      </main>
    </div>
  );
}