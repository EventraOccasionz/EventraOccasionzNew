import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useEffect, useState } from 'react';
import AuthModal from './AuthModal';

export default function Layout() {
  const [forcingGate, setForcingGate] = useState(false);
  const location = useLocation();
  const isInviteLink = location.pathname.startsWith('/invite');

  // Listener for direct gate login request
  useEffect(() => {
    const handleTriggerGate = () => {
      setForcingGate(true);
    };
    window.addEventListener('eventra-trigger-gate', handleTriggerGate);
    return () => {
      window.removeEventListener('eventra-trigger-gate', handleTriggerGate);
    };
  }, []);

  // Custom cursor logic
  useEffect(() => {
    let animId: number;
    // Strict mobile check
    const isMobile = window.matchMedia('(max-width: 768px)').matches || 
                     window.matchMedia('(pointer: coarse)').matches;
    if (isMobile) return;

    const cur = document.createElement('div');
    const ring = document.createElement('div');
    
    cur.id = 'cur';
    ring.id = 'ring';
    
    document.body.appendChild(cur);
    document.body.appendChild(ring);

    const style = document.createElement('style');
    style.id = 'cursor-style';
    style.innerHTML = `
      #cur { position: fixed; width: 10px; height: 10px; background: #c9a84c; border-radius: 50%; pointer-events: none; z-index: 9999; transform: translate(-50%, -50%); transition: width .25s, height .25s; mix-blend-mode: screen; }
      #ring { position: fixed; width: 36px; height: 36px; border: 1px solid rgba(201, 168, 76, 0.55); border-radius: 50%; pointer-events: none; z-index: 9998; transform: translate(-50%, -50%); transition: transform .35s border-radius, width .3s, height .3s; }
      body.hov #cur { width: 18px; height: 18px; }
      body.hov #ring { width: 52px; height: 52px; opacity: .4; }
    `;
    document.head.appendChild(style);

    let mx = 0, my = 0, rx = 0, ry = 0;

    const handleMouseMove = (e: MouseEvent) => {
      mx = e.clientX;
      my = e.clientY;
      if (cur) {
        cur.style.left = `${mx}px`;
        cur.style.top = `${my}px`;
      }
    };

    const animateRing = () => {
      rx += (mx - rx) * 0.12;
      ry += (my - ry) * 0.12;
      if (ring) {
        ring.style.left = `${rx}px`;
        ring.style.top = `${ry}px`;
      }
      animId = requestAnimationFrame(animateRing);
    };

    const handleOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('a, button')) {
        document.body.classList.add('hov');
      }
    };

    const handleOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.closest('a, button')) {
        document.body.classList.remove('hov');
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseover', handleOver);
    window.addEventListener('mouseout', handleOut);
    animateRing();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseover', handleOver);
      window.removeEventListener('mouseout', handleOut);
      cancelAnimationFrame(animId);
      cur.remove();
      ring.remove();
      style.remove();
      document.body.classList.remove('hov');
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-sans bg-dark text-text-primary selection:bg-gold selection:text-dark">
      <AuthModal 
        isOpen={forcingGate} 
        onClose={() => setForcingGate(false)} 
        onSuccess={() => {
          setForcingGate(false);
        }} 
      />
      {!isInviteLink && <Navbar />}
      <main className="flex-grow">
        <Outlet />
      </main>
      {!isInviteLink && <Footer />}
    </div>
  );
}
