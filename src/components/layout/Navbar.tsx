import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { dataService } from '../../lib/dataService';
import eventraLogo from '../../assets/images/eventra_logo_1783423905494.jpg';

const navLinks = [
  { name: 'Services', href: '#services' },
  { name: 'Gallery', href: '#gallery' },
  { name: 'Reviews', href: '#testi' },
  { name: 'Book', href: '#booking' },
  { name: 'Contact', href: '#contact' },
];

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [authType, setAuthType] = useState<string | null>(() => sessionStorage.getItem('eventra_auth_type'));
  const [authName, setAuthName] = useState<string | null>(() => sessionStorage.getItem('eventra_auth_name'));
  const [isAdmin, setIsAdmin] = useState<boolean>(() => localStorage.getItem('is_admin') === 'true');

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    
    const handleAuthChange = () => {
      setAuthType(sessionStorage.getItem('eventra_auth_type'));
      setAuthName(sessionStorage.getItem('eventra_auth_name'));
      setIsAdmin(localStorage.getItem('is_admin') === 'true');
    };

    window.addEventListener('eventra-auth-changed', handleAuthChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('eventra-auth-changed', handleAuthChange);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await dataService.logout();
    } catch (e) {
      console.warn('Logout session termination issue:', e);
    }
    sessionStorage.removeItem('eventra_auth_type');
    sessionStorage.removeItem('eventra_auth_name');
    sessionStorage.removeItem('eventra_auth_code');
    localStorage.removeItem('is_admin');
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('access_')) {
        sessionStorage.removeItem(key);
      }
    }
    setAuthType(null);
    setAuthName(null);
    setIsAdmin(false);
    window.dispatchEvent(new Event('eventra-auth-changed'));
    navigate('/');
    window.location.reload();
  };

  const handleTriggerGate = () => {
    window.dispatchEvent(new Event('eventra-trigger-gate'));
  };

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-[1000] transition-all duration-500 flex items-center justify-between px-10 md:px-20
          ${isScrolled 
            ? 'bg-dark-2/95 backdrop-blur-2xl border-b border-gold/20 py-4' 
            : 'bg-transparent py-6'}`}
      >
        <Link to="/" className="flex items-center gap-3 md:gap-4 group">
          <img 
            src={eventraLogo} 
            alt="Eventra Occasionz Logo" 
            className="w-12 h-12 md:w-[3.5rem] md:h-[3.5rem] object-contain transition-transform duration-300 group-hover:scale-105"
            referrerPolicy="no-referrer"
          />
          <h1 className="hidden sm:block font-serif text-xl md:text-2xl tracking-[0.2em] uppercase text-gold text-nowrap">Eventra Occasionz</h1>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <li key={link.name}>
              <a
                href={link.href}
                className="text-[11px] uppercase tracking-[0.15em] font-medium text-gold/70 hover:text-gold transition-colors relative pb-1 group"
              >
                {link.name}
                <span className="absolute bottom-0 left-0 w-0 h-[1px] bg-gold transition-all duration-300 group-hover:w-full" />
              </a>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 md:gap-6">
          {authType ? (
            <div className="hidden sm:flex items-center gap-3">
              {authType === 'guest' ? (
                <button
                  onClick={() => {
                    const name = sessionStorage.getItem('eventra_auth_name') || '';
                    const slug = name.toLowerCase().replace(/\s+family/i, '-family').replace(/\s+/g, '-');
                    navigate(`/invite/${slug}`);
                  }}
                  className="px-3.5 py-1.5 bg-gold/15 border border-gold/30 rounded-md text-[10px] text-gold uppercase tracking-[0.15em] hover:bg-gold/25 transition-all text-nowrap cursor-pointer"
                >
                  ✦ {authName}
                </button>
              ) : (
                <span className="px-3.5 py-1.5 bg-white/5 border border-white/10 rounded-md text-[10px] text-cream uppercase tracking-[0.15em] text-nowrap">
                  Visitor: {authName?.split(' ')[0]}
                </span>
              )}
              <button 
                onClick={handleLogout}
                className="p-1 px-2 border border-gold/10 hover:border-rose-400/20 text-gold/60 hover:text-rose-400 rounded transition-colors uppercase text-[9px] tracking-widest font-mono cursor-pointer"
                title="Log out session"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              onClick={handleTriggerGate}
              className="hidden sm:inline-block px-4 py-1.5 bg-gold/5 border border-gold/40 rounded-full text-[10px] text-gold uppercase tracking-[0.15em] hover:bg-gold hover:text-dark font-mono transition-all cursor-pointer shadow-[0_4px_15px_rgba(201,168,76,0.1)]"
            >
              Client Portal
            </button>
          )}

          {isAdmin && (
            <Link 
              to="/admin" 
              className="hidden lg:inline-block px-4 py-1.5 border border-gold/40 hover:border-gold rounded-full text-[10px] text-gold uppercase tracking-widest transition-all font-mono shadow-[0_4px_15px_rgba(201,168,76,0.1)]"
            >
              Admin Panel
            </Link>
          )}
          
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden text-gold focus:outline-none"
          >
            {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 bg-dark/95 z-[990] flex flex-col items-center justify-center gap-6"
          >
            <img 
              src={eventraLogo} 
              alt="Eventra Occasionz Logo" 
              className="w-20 h-20 object-contain"
              referrerPolicy="no-referrer"
            />
            
            {authType && (
              <div className="text-center bg-gold/5 border border-gold/20 p-4 rounded-xl w-4/5 max-w-xs mb-2">
                <p className="text-[10px] uppercase font-mono tracking-widest text-gold/50">Active Session</p>
                <p className="font-serif text-xl text-gold mt-1">
                  {authName}
                </p>
                <button
                  onClick={() => {
                    closeMenu();
                    handleLogout();
                  }}
                  className="mt-3 text-xs uppercase font-mono text-rose-400 hover:text-rose-300 tracking-wider inline-flex items-center gap-1 cursor-pointer"
                >
                  Logout Account ×
                </button>
              </div>
            )}

            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                onClick={closeMenu}
                className="font-serif text-3xl font-light text-text-primary tracking-wider hover:text-gold transition-colors"
              >
                {link.name}
              </a>
            ))}

            {!authType && (
              <button
                onClick={() => {
                  closeMenu();
                  handleTriggerGate();
                }}
                className="px-6 py-2.5 border border-gold text-gold text-xs uppercase tracking-widest rounded-full cursor-pointer bg-gold/5 font-mono"
              >
                Client Portal Login
              </button>
            )}

            {isAdmin && (
              <Link
                to="/admin"
                onClick={closeMenu}
                className="text-gold uppercase tracking-widest text-xs mt-4 font-mono border-t border-gold/10 pt-4 w-1/2 text-center"
              >
                Admin Controls
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
