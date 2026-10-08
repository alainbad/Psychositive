import { Link } from '@tanstack/react-router';
import { ArrowUpRight, LockKeyhole } from 'lucide-react';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
const navigation = [
  ['/', 'Home'], ['/about', 'About Hala'], ['/services', 'Services'], ['/library', 'Psychology Library'], ['/thoughts', "Hala’s Thoughts"], ['/faq', 'FAQ'], ['/contact', 'Contact'],
] as const;
export function SiteShell({ children }: { children: ReactNode }) {
  return <div className="site-shell">
    <header className="site-header">
      <div className="header-top">
        <Link to="/" className="wordmark" aria-label="Psychositive by Hala Touma, home"><span className="wordmark-name">Psychositive<span aria-hidden="true">.</span></span><span className="wordmark-by">by Hala Touma</span></Link>
        <div className="header-actions">
          <Link to="/portal" className="portal-link"><LockKeyhole size={13} strokeWidth={1.4} />Client portal</Link>
          <Button asChild className="book-button" size="lg"><Link to="/booking">Book a session<ArrowUpRight size={15} /></Link></Button>
        </div>
      </div>
      <nav aria-label="Main navigation" className="site-nav">{navigation.map(([to,label]) => <Link key={to} to={to} activeOptions={{ exact: true }}>{label}</Link>)}</nav>
    </header>
    <main className="site-main" id="main-content">{children}</main>
    <footer className="site-footer">
      <div className="footer-top"><span>© {new Date().getUTCFullYear()} Psychositive · by Hala Touma</span><div className="footer-links"><Link to="/consent">Consent</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/cancellation">Cancellation</Link><span>Independent online practice</span></div></div>
      <p className="emergency-note">Not an emergency service. If you are in immediate danger, contact your local emergency services or crisis helpline.</p>
    </footer>
  </div>;
}

