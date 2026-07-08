import { Link } from 'react-router-dom';
import { Facebook, Instagram, Youtube, Linkedin } from 'lucide-react';
import eventraLogo from '../../assets/images/eventra_logo_1783423905494.jpg';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-dark-4 border-t border-gold/20 pt-20 pb-8 px-8 md:px-20">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-14">
        <div className="flex flex-col gap-4">
          <Link to="/" className="flex items-center gap-3 font-serif text-2xl tracking-widest text-gold mb-2 group">
            <img 
              src={eventraLogo} 
              alt="Eventra Occasionz Logo" 
              className="w-12 h-12 object-contain bg-transparent"
              referrerPolicy="no-referrer"
            />
            <span>Eventra <em className="italic text-gold-light">Occasionz</em></span>
          </Link>
          <p className="text-sm text-text-secondary leading-relaxed max-w-xs">
            Crafting luxury events with elegance, passion, and meticulous attention to every detail. Your celebration, our canvas.
          </p>
          <div className="flex gap-3 mt-4">
            {[
              { Icon: Facebook, url: 'https://www.facebook.com/share/17yRD9f7T5/', label: 'Facebook' },
              { Icon: Instagram, url: 'https://www.instagram.com/eventra_occasionz?igsh=c2Izd2dxZW50bHlp', label: 'Instagram' },
              { Icon: Linkedin, url: 'https://www.linkedin.com/in/shivam-chawla-9ab87b3a1?utm_source=share_via&utm_content=profile&utm_medium=member_android', label: 'LinkedIn' }
            ].map(({ Icon, url, label }, i) => (
              <a
                key={i}
                href={url}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-9 h-9 border border-gold/20 flex items-center justify-center text-text-secondary hover:border-gold hover:text-gold transition-all"
              >
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div className="flex flex-col">
          <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Quick Links</h5>
          <ul className="flex flex-col gap-3">
            {['Services', 'Gallery', 'Reviews', 'Book Now', 'Contact'].map((item) => (
              <li key={item}>
                <a href={`#${item.toLowerCase().replace(' ', '')}`} className="text-sm text-text-secondary hover:text-gold transition-colors">
                  {item}
                </a>
              </li>
            ))}
            <li>
              <Link to="/admin" className="text-sm text-text-secondary hover:text-gold transition-colors font-medium flex items-center gap-1 mt-1">
                ✦ Admin Portal
              </Link>
            </li>
          </ul>
        </div>

        <div className="flex flex-col">
          <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Services</h5>
          <ul className="flex flex-col gap-3">
            {['Wedding Planning', 'Birthday Décor', 'Balloon Décor', 'Photography', 'Catering', 'Corporate Events'].map((item) => (
              <li key={item}>
                <a href="#services" className="text-sm text-text-secondary hover:text-gold transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col">
          <h5 className="text-[0.62rem] uppercase tracking-[0.28em] text-gold mb-6 font-medium">Luxury Invitation</h5>
          <p className="text-sm text-text-secondary mb-4">
            Are you a guest? Enter your access code here to view your personalized invitation.
          </p>
          <Link
            to="/invite-access"
            className="px-6 py-2 border border-gold/40 text-gold text-[0.7rem] uppercase tracking-widest text-center hover:bg-gold hover:text-dark transition-all"
          >
            Access My Invitation
          </Link>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-gold/20 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-[0.72rem] text-text-secondary">
        <p>© {currentYear} <span className="text-gold">Eventra Occasionz</span>. All rights reserved.</p>
        <p>Crafted with <span className="text-gold">✦</span> for extraordinary moments</p>
      </div>
    </footer>
  );
}
