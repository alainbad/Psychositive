import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import roomImage from '@/assets/quiet-room.jpg';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/')({ head: () => pageMeta('Home', 'A thoughtful space for online psychological support, reflection and personal growth. An independent practice in preparation.'), component: Home });
function Home() {
  return <div className="home-main fade-in"><section className="home-hero" aria-labelledby="home-title">
    <img src={roomImage} className="home-photo" width={1536} height={1024} alt="An imagined quiet room, with an oxblood armchair beside a softly lit window" />
    <div className="hero-content"><span className="eyebrow">A thoughtful space. A human connection.</span><h1 id="home-title">A little more room<br />to be <em>yourself.</em></h1><p>You don’t have to have it all figured out.<br />A space for open conversation, reflection,<br className="hidden sm:block" /> and finding your own way forward.</p><div className="hero-actions"><Button variant="hero" size="lg" asChild><Link to="/booking">Book a session<ArrowUpRight /></Link></Button><Button variant="heroOutline" size="lg" asChild><Link to="/about">Meet Hala<ArrowRight /></Link></Button></div></div>
    <div className="hero-foot"><span>Online support · At your own pace</span><span>Come as you are.</span></div>
  </section><div className="home-note"><span>An independent practice in preparation. Reservation requests require Hala’s confirmation.</span><span>Concept imagery · Not the practice’s actual room</span></div></div>;
}

