import { createFileRoute, Link } from '@tanstack/react-router';
import { Plus, ArrowUpRight } from 'lucide-react';
import { Page } from '@/components/psychositive/page';
import { Button } from '@/components/ui/button';
import { pageMeta } from '@/lib/page-meta';
export const Route = createFileRoute('/faq')({ head: () => pageMeta('Frequently asked questions', 'Clear answers about Psychositive’s preparation, proposed online sessions, confidentiality and emergency limitations.'), component: FAQ });
const questions = [
 ['Can I book a session now?', 'You can send a reservation request for a time Hala has made available. The time is reserved once the request is saved. Hala must confirm the appointment, suitability and fees. No payment is collected here.'],
 ['What qualifications does Hala hold?', 'Verified professional title, qualifications, registration and permitted practice locations are pending. They must be published and checked before appointments open. No specific qualification or licence is claimed here.'],
 ['Are sessions online?', 'The proposed options are online video and audio sessions. The initial consultation lasts 30 minutes; individual and audio sessions last 45 minutes. Fees and suitability remain to be confirmed.'],
 ['Can I attend from any country?', 'Not necessarily. Eligibility depends on the professional’s authorisation and your physical location at the time of a session. Permitted locations are pending verification.'],
 ['Will our conversations be confidential?', 'A clear confidentiality policy, including its legal and safety-related limits, must be explained before any real session. This preview is not a clinical service; please do not enter sensitive information.'],
 ['What happens if I need to cancel?', 'Cancel an eligible reservation from your client portal. The current online notice period is 24 hours, configurable by the practice. For a different time, cancel and submit a new request. Fees and the final service cancellation policy still need confirmation.'],
 ['Is this a crisis or diagnostic service?', 'No. This site does not offer emergency care, AI diagnosis or individual medical advice. In immediate danger, contact your local emergency services. For urgent support, contact a crisis helpline in your country.'],
];
function FAQ() { return <Page eyebrow="A few things you might be wondering" title="Clarity, before you begin."><div className="faq-list">{questions.map(([q,a]) => <details key={q} className="faq-item"><summary>{q}<Plus strokeWidth={1.4}/></summary><p>{a}</p></details>)}</div><Button asChild variant="editorial" className="mt-7 px-0"><Link to="/contact">Have another question?<ArrowUpRight/></Link></Button></Page>; }

