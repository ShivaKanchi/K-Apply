'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'motion/react';
import {
  Zap, Target, LayoutGrid, ChevronRight, Download,
  Check, Copy, ExternalLink, X, Shield, Code2, Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/* -------------------------------------------------------------------------
   CONSTANTS
-------------------------------------------------------------------------- */
const ATS_PLATFORMS = [
  { name: 'Greenhouse', tag: 'Native API + DOM', latency: '40ms' },
  { name: 'Lever', tag: 'REST API + Crawler', latency: '35ms' },
  { name: 'Ashby', tag: 'Direct Connect', latency: '45ms' },
  { name: 'Workday', tag: 'Multi-Step Synthetic', latency: '60ms' },
  { name: 'LinkedIn', tag: 'Easy Apply Engine', latency: '50ms' },
  { name: 'Indeed', tag: 'Instant Detection', latency: '30ms' },
];

const HUNTER_COMPANIES = [
  { value: 'stripe', label: 'Stripe (Greenhouse)' },
  { value: 'figma', label: 'Figma (Greenhouse)' },
  { value: 'vercel', label: 'Vercel (Lever)' },
  { value: 'notion', label: 'Notion (Ashby)' },
];

const FAQ_ITEMS = [
  {
    q: 'How does K-Apply differ from generic autofill extensions?',
    a: 'Generic autofill extensions only match standard name and address fields. K-Apply is designed specifically for software engineers: it resolves complex long-form questions, bypasses React\'s _valueTracker, substitutes company variables dynamically, and syncs with an autonomous board crawler and Kanban tracker.',
  },
  {
    q: 'What is K-Apply Hunter and how does it automate discovery?',
    a: 'K-Apply Hunter is the autonomous automation module. It connects to public ATS APIs (Greenhouse, Lever, Ashby) and crawls target companies for openings matching your profile, scoring compatibility and predicting company-specific interview questions before you even apply.',
  },
  {
    q: 'Is my personal data shared with external cloud providers?',
    a: 'No. Your data is stored locally in Chrome Storage and your private MongoDB instance. The AI pitch studio connects to your local Ollama server (Llama 3.1) running on localhost:11434. No candidate data is sold, monetized, or logged.',
  },
  {
    q: 'How do I load the K-Apply Chrome Extension?',
    a: 'Open chrome://extensions in Google Chrome, enable Developer mode in the top-right corner, click Load unpacked, and select the K-Apply repository root folder. The extension appears immediately in your toolbar.',
  },
];

const TESTIMONIALS = [
  {
    quote: 'K-Apply cut my application time from 40 minutes per company down to 60 seconds. The React input bypass works on complex forms that broke every other extension.',
    name: 'Alexandre L.',
    role: 'Staff Frontend Engineer',
    company: 'Figma',
    initials: 'AL',
  },
  {
    quote: 'Having the autonomous Hunter crawl target career boards and pre-compute my answers to company screening questions felt like having a dedicated recruiting agent.',
    name: 'Maya S.',
    role: 'Backend Infrastructure',
    company: 'Stripe',
    initials: 'MS',
  },
  {
    quote: 'The local Ollama integration is genius. My salary requirements and past incidents stay 100% on my machine without sending data to any external service.',
    name: 'Rohan K.',
    role: 'AI Engineer',
    company: 'Series A Startup',
    initials: 'RK',
  },
];

/* -------------------------------------------------------------------------
   REVEAL STAGGER - MOTION_INTENSITY 4 (scroll-in only, no pinning)
-------------------------------------------------------------------------- */
function RevealStagger({ children, className, delay = 0 }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.25 }}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* -------------------------------------------------------------------------
   NAV
-------------------------------------------------------------------------- */
function SiteNav({ onInstallOpen }: { onInstallOpen: () => void }) {
  return (
    <header className="sticky top-0 z-[40] h-16 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 no-underline group">
          <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="text-sm font-semibold text-zinc-50 tracking-tight">K-Apply</span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-6">
          {[
            { href: '#pillars', label: 'Pillars' },
            { href: '#preview', label: 'Test Drive' },
            { href: '#roi', label: 'ROI' },
            { href: '#pricing', label: 'Pricing' },
            { href: '#faq', label: 'FAQ' },
          ].map(({ href, label }) => (
            <a
              key={href}
              href={href}
              className="text-sm text-zinc-400 hover:text-zinc-50 transition-colors duration-150"
            >
              {label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onInstallOpen}
            className="hidden sm:inline-flex text-zinc-400 hover:text-zinc-50 gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            Extension
          </Button>
          <Button asChild size="sm" variant="accent">
            <Link href="/dashboard">
              Command Center
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------
   HERO
-------------------------------------------------------------------------- */
function Hero({ onInstallOpen }: { onInstallOpen: () => void }) {
  const reduce = useReducedMotion();

  return (
    <section className="relative min-h-[100dvh] flex items-center justify-center overflow-hidden">
      {/* Restrained background - single blue glow, no purple, no mesh madness */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden
      >
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-blue-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
        {/* Eyebrow - one per three sections, hero counts as 1 */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="inline-flex items-center gap-2 mb-6 px-3 py-1 rounded-full border border-blue-500/30 bg-blue-500/10"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-medium text-blue-300 tracking-wide">Autonomous Job Search Suite</span>
        </motion.div>

        {/* Headline - max 2 lines, left-weight layout */}
        <motion.h1
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tighter leading-none text-zinc-50 mb-6"
        >
          Apply 10x Faster.{' '}
          <span className="text-gradient-blue">Automate the Rest.</span>
        </motion.h1>

        {/* Subtext - max 20 words */}
        <motion.p
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="text-base md:text-lg text-zinc-400 leading-relaxed max-w-[52ch] mx-auto mb-10"
        >
          The all-in-one AI career engine uniting 1-click ATS autofill, autonomous board crawling, and pipeline intelligence.
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center justify-center gap-3 flex-wrap"
        >
          <Button asChild size="lg" variant="accent" className="gap-2 text-sm font-semibold">
            <Link href="/dashboard">
              Launch Command Center
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            onClick={onInstallOpen}
            className="gap-2 text-sm font-semibold border-zinc-700 text-zinc-300 hover:text-zinc-50 hover:border-zinc-500 hover:bg-zinc-800/50"
          >
            <Download className="w-4 h-4" />
            Install Extension
          </Button>
        </motion.div>

        {/* Metrics strip - below CTAs, not inside hero text stack */}
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.36 }}
          className="mt-14 grid grid-cols-3 gap-px border border-zinc-800 rounded-xl overflow-hidden max-w-lg mx-auto"
        >
          {[
            { val: '100%', lbl: 'Private Local AI' },
            { val: '1-Click', lbl: 'ATS Autofill' },
            { val: '5 ATS', lbl: 'Auto-Detected' },
          ].map(({ val, lbl }) => (
            <div key={lbl} className="bg-zinc-900 px-4 py-3 text-center">
              <div className="text-lg font-bold text-zinc-50 tracking-tight">{val}</div>
              <div className="text-[11px] text-zinc-500 mt-0.5">{lbl}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   ATS STRIP - under hero, layout family 2
-------------------------------------------------------------------------- */
function AtsStrip() {
  return (
    <section className="border-y border-zinc-800 bg-zinc-900/50 py-10">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-zinc-500 text-center mb-6">
          Universal compatibility across major ATS platforms
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ATS_PLATFORMS.map((ats) => (
            <RevealStagger key={ats.name} delay={0.04}>
              <div className="flex flex-col gap-1 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-3 hover:border-zinc-700 transition-colors">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="text-sm font-medium text-zinc-200">{ats.name}</span>
                </div>
                <span className="text-[11px] text-zinc-500">{ats.tag}</span>
              </div>
            </RevealStagger>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   THREE PILLARS - layout family 3: asymmetric bento grid, NOT 3 equal cards
-------------------------------------------------------------------------- */
function ThreePillars() {
  const pillars = [
    {
      icon: <Zap className="w-5 h-5 text-blue-400" strokeWidth={2} />,
      title: 'Browser Extension',
      desc: 'Manifest V3 in-browser companion with multi-signal input discovery, React synthetic event simulation, and dynamic placeholder interpolation.',
      features: [
        'React 16+ _valueTracker DOM bypass',
        'Dynamic {{company_name}} interpolation',
        'Slide-out Q&A Drawer for instant copy',
      ],
      accent: 'border-blue-500/20',
      span: 'lg:col-span-1',
    },
    {
      icon: <Target className="w-5 h-5 text-blue-400" strokeWidth={2} />,
      title: 'K-Apply Hunter',
      desc: 'Autonomous discovery engine crawling target company boards directly, predicting screening questions, and computing candidate compatibility scores.',
      features: [
        'Direct Greenhouse, Lever & Ashby board crawling',
        'Predicts top 15+ company interview questions',
        'Playwright worker with Human-in-the-Loop review',
      ],
      accent: 'border-blue-500/40 bg-blue-500/5',
      span: 'lg:col-span-1',
      featured: true,
    },
    {
      icon: <LayoutGrid className="w-5 h-5 text-blue-400" strokeWidth={2} />,
      title: 'Command Center',
      desc: 'The mission dashboard: Kanban pipeline, Ollama local AI cover letter generator, candidate master profile, and MongoDB sync.',
      features: [
        'Kanban & Table views with live metrics',
        'Ollama Llama 3.1 AI tailored pitch generator',
        'Q&A Vault pre-loaded with high-impact answers',
      ],
      accent: 'border-zinc-800',
      span: 'lg:col-span-1',
    },
  ];

  return (
    <section id="pillars" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger>
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
              Three pillars of K-Apply
            </h2>
            <p className="text-zinc-400 leading-relaxed">
              Most job tools solve one piece. K-Apply delivers discovery, autofill, and pipeline management in one unified ecosystem.
            </p>
          </div>
        </RevealStagger>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {pillars.map((p, i) => (
            <RevealStagger key={p.title} delay={i * 0.08} className={p.span}>
              <Card className={cn(
                'h-full rounded-xl border bg-zinc-900 transition-colors hover:border-zinc-700',
                p.accent,
                p.featured && 'ring-1 ring-blue-500/30'
              )}>
                <CardHeader className="pb-3">
                  <div className="w-9 h-9 rounded-md border border-zinc-800 bg-zinc-800/60 flex items-center justify-center mb-3">
                    {p.icon}
                  </div>
                  {p.featured && (
                    <Badge variant="ai" className="w-fit mb-1 text-[10px]">Automation Module</Badge>
                  )}
                  <CardTitle className="text-zinc-50">{p.title}</CardTitle>
                  <CardDescription className="text-zinc-400 leading-relaxed text-sm">{p.desc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {p.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                        <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </RevealStagger>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   INTERACTIVE TEST DRIVE - layout family 4: tabs playground
-------------------------------------------------------------------------- */
function TestDrivePlayground() {
  const [extensionFilled, setExtensionFilled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [autofillRunning, setAutofillRunning] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState('stripe');
  const [hunterRole, setHunterRole] = useState('Senior Full Stack Engineer');
  const [isHunting, setIsHunting] = useState(false);
  const [demoApps, setDemoApps] = useState([
    { id: 1, company: 'Stripe', role: 'Staff Infrastructure', stage: 'interviewing', score: 98 },
    { id: 2, company: 'Figma', role: 'Senior Frontend', stage: 'offer', score: 95 },
    { id: 3, company: 'Vercel', role: 'AI Platform Eng.', stage: 'applied', score: 92 },
    { id: 4, company: 'Notion', role: 'Full Stack Systems', stage: 'applied', score: 89 },
  ]);

  const handleAutofill = () => {
    setAutofillRunning(true);
    setTimeout(() => { setExtensionFilled(true); setAutofillRunning(false); }, 700);
  };

  const handleHunter = () => {
    setIsHunting(true);
    setTimeout(() => setIsHunting(false), 900);
  };

  const advanceStage = (id: number) => {
    const stages = ['applied', 'interviewing', 'offer'] as const;
    setDemoApps(prev => prev.map(a => {
      if (a.id !== id) return a;
      const next = stages[(stages.indexOf(a.stage as typeof stages[number]) + 1) % stages.length];
      return { ...a, stage: next };
    }));
  };

  const stageColor: Record<string, string> = {
    applied: 'bg-zinc-700 text-zinc-200',
    interviewing: 'bg-blue-900/60 text-blue-300 border border-blue-700/40',
    offer: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/40',
  };

  return (
    <section id="preview" className="py-24 bg-zinc-900/40 border-y border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger className="mb-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
              Experience K-Apply in action
            </h2>
            <p className="text-zinc-400">Switch between the three pillars to test real workflows before installing.</p>
          </div>
        </RevealStagger>

        <Tabs defaultValue="extension">
          <TabsList className="bg-zinc-800 border border-zinc-700 mb-8 h-10">
            <TabsTrigger value="extension" className="gap-1.5 text-xs data-[state=active]:bg-zinc-700">
              <Zap className="w-3.5 h-3.5" /> In-Browser Autofill
            </TabsTrigger>
            <TabsTrigger value="hunter" className="gap-1.5 text-xs data-[state=active]:bg-zinc-700">
              <Target className="w-3.5 h-3.5" /> Hunter Radar
            </TabsTrigger>
            <TabsTrigger value="pipeline" className="gap-1.5 text-xs data-[state=active]:bg-zinc-700">
              <LayoutGrid className="w-3.5 h-3.5" /> Pipeline
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Autofill demo */}
          <TabsContent value="extension">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              {/* Browser chrome */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-amber-400/70" />
                  <span className="w-3 h-3 rounded-full bg-emerald-500/70" />
                </div>
                <div className="flex-1 flex items-center gap-2 bg-zinc-800 rounded px-3 py-1.5 max-w-xs">
                  <Shield className="w-3 h-3 text-zinc-500" />
                  <span className="text-[11px] text-zinc-400 truncate">boards.greenhouse.io/stripe/jobs/5910244</span>
                </div>
                <Badge variant="success" className="text-[10px]">ATS: Greenhouse</Badge>
              </div>

              <div className="grid md:grid-cols-5 gap-0">
                {/* Form area */}
                <div className="md:col-span-3 p-6 border-r border-zinc-800">
                  <div className="mb-4">
                    <Badge variant="secondary" className="text-[10px] mb-2">Stripe</Badge>
                    <h3 className="text-base font-semibold text-zinc-100">Senior Full Stack Infrastructure Engineer</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Remote (US) • Engineering • Full-Time</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Full Name', val: 'Alex Morgan', placeholder: 'First & Last Name' },
                      { label: 'Email Address', val: 'you@example.com', placeholder: 'email@domain.com' },
                      { label: 'LinkedIn Profile', val: 'linkedin.com/in/your-handle', placeholder: 'linkedin.com/in/...' },
                      { label: 'Availability', val: 'Immediate / Negotiable', placeholder: 'e.g. 2 weeks' },
                    ].map(({ label, val, placeholder }) => (
                      <div key={label} className="flex flex-col gap-1">
                        <label className="text-[11px] font-medium text-zinc-400">{label}</label>
                        <input
                          readOnly
                          value={extensionFilled ? val : ''}
                          placeholder={!extensionFilled ? placeholder : ''}
                          className={cn(
                            'h-8 w-full rounded-md border px-2.5 text-xs bg-zinc-800 transition-all',
                            extensionFilled
                              ? 'border-blue-500/50 text-blue-300 bg-blue-950/30'
                              : 'border-zinc-700 text-zinc-400 placeholder:text-zinc-600'
                          )}
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Widget panel */}
                <div className="md:col-span-2 p-5 flex flex-col gap-4">
                  <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-blue-400" />
                        <span className="text-xs font-semibold text-zinc-200">K-Apply Copilot</span>
                      </div>
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    </div>
                    <Button
                      size="sm"
                      variant="accent"
                      onClick={handleAutofill}
                      disabled={autofillRunning}
                      className="w-full mb-2 text-xs gap-1.5 active:scale-[0.98] transition-transform"
                    >
                      {autofillRunning ? (
                        <span className="animate-pulse">Simulating DOM Fill...</span>
                      ) : extensionFilled ? (
                        <><Check className="w-3.5 h-3.5" /> Filled 5 Fields!</>
                      ) : (
                        <><Zap className="w-3.5 h-3.5" /> 1-Click Autofill Form</>
                      )}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDrawerOpen(!drawerOpen)}
                        className="flex-1 text-xs border-zinc-600 hover:bg-zinc-700"
                      >
                        {drawerOpen ? 'Close Drawer' : 'Q&A Vault'}
                      </Button>
                      {extensionFilled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setExtensionFilled(false)}
                          className="text-xs text-zinc-500"
                        >
                          Reset
                        </Button>
                      )}
                    </div>
                  </div>

                  {drawerOpen && (
                    <div className="rounded-lg border border-zinc-700 bg-zinc-800 p-4 space-y-3">
                      <h4 className="text-xs font-semibold text-zinc-200">Q&A Knowledge Vault</h4>
                      {[
                        { title: 'Production Incident Fixed', snippet: 'Diagnosed React synthetic event bubbling and memory leaks...' },
                        { title: 'What Makes Me Exceptional', snippet: 'Bridging deep backend systems architecture with polished UI...' },
                      ].map(({ title, snippet }) => (
                        <div key={title} className="rounded border border-zinc-700 bg-zinc-900 p-3">
                          <p className="text-[11px] font-medium text-zinc-200 mb-1">{title}</p>
                          <p className="text-[10px] text-zinc-500 mb-2 line-clamp-2">"{snippet}"</p>
                          <Button size="sm" variant="secondary" className="h-6 text-[10px] gap-1">
                            <Copy className="w-3 h-3" /> Copy
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Tab 2: Hunter radar */}
          <TabsContent value="hunter">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
              <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-radar-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
                  </span>
                  <span className="text-sm font-semibold text-zinc-200">K-Apply Hunter Engine</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <select
                    value={selectedCompany}
                    onChange={(e) => setSelectedCompany(e.target.value)}
                    className="h-8 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-300 px-2 focus:ring-1 focus:ring-blue-500 focus:outline-none"
                  >
                    {HUNTER_COMPANIES.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                  <input
                    value={hunterRole}
                    onChange={(e) => setHunterRole(e.target.value)}
                    className="h-8 rounded-md border border-zinc-700 bg-zinc-800 text-xs text-zinc-300 px-2 focus:ring-1 focus:ring-blue-500 focus:outline-none w-48"
                  />
                  <Button size="sm" variant="accent" onClick={handleHunter} disabled={isHunting} className="text-xs gap-1.5">
                    <Target className="w-3.5 h-3.5" />
                    {isHunting ? 'Scanning...' : 'Run Radar'}
                  </Button>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">
                          {selectedCompany.toUpperCase()}
                        </span>
                        <CardTitle className="text-zinc-100 text-sm mt-0.5">{hunterRole}</CardTitle>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-400">96%</div>
                        <div className="text-[10px] text-zinc-500">Match Score</div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-zinc-400 mb-3">Matched: Next.js, Node.js, TypeScript, PostgreSQL, distributed queues.</p>
                    <div className="flex gap-2">
                      <Button asChild size="sm" variant="accent" className="text-xs gap-1 flex-1">
                        <Link href="/dashboard"><ExternalLink className="w-3 h-3" /> Open & Autofill</Link>
                      </Button>
                      <Badge variant="success" className="text-[10px]">Board Verified</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-800 border-zinc-700">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-zinc-100 text-sm">Predicted Screening Questions</CardTitle>
                    <Badge variant="ai" className="w-fit text-[10px]">Pre-Computed Answers Ready</Badge>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2.5">
                      {[
                        { q: 'Describe a complex production outage you resolved under pressure?', item: '7' },
                        { q: `Why are you interested in joining ${selectedCompany.toUpperCase()} right now?`, item: 'auto' },
                        { q: 'Describe your experience with LLMs and agentic workflows?', item: '8' },
                      ].map(({ q, item }) => (
                        <div key={q} className="flex items-start gap-2">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs text-zinc-300">{q}</p>
                            <p className="text-[10px] text-zinc-500 mt-0.5">
                              {item === 'auto' ? 'Auto-Tailored Template Ready' : `Linked to Q&A Vault #${item}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Tab 3: Pipeline kanban */}
          <TabsContent value="pipeline">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-200">K-Apply</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-sm text-zinc-400">Command Center</span>
                  <span className="text-zinc-600">/</span>
                  <span className="text-sm text-zinc-400">Live Pipeline</span>
                </div>
                <Button asChild size="sm" variant="outline" className="text-xs border-zinc-700 hover:bg-zinc-800">
                  <Link href="/dashboard">Open full workspace <ChevronRight className="w-3 h-3 ml-1" /></Link>
                </Button>
              </div>

              <div className="grid grid-cols-3 gap-0 divide-x divide-zinc-800 p-4 gap-3">
                {(['applied', 'interviewing', 'offer'] as const).map((stage) => {
                  const stageApps = demoApps.filter(a => a.stage === stage);
                  const stageLabels: Record<string, string> = { applied: 'Applied', interviewing: 'Interviewing', offer: 'Offer' };
                  return (
                    <div key={stage} className="flex flex-col gap-2 min-h-32">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-mono uppercase tracking-wider text-zinc-500">{stageLabels[stage]}</span>
                        <span className="text-[11px] w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">{stageApps.length}</span>
                      </div>
                      {stageApps.map((app) => (
                        <button
                          key={app.id}
                          onClick={() => advanceStage(app.id)}
                          className="rounded-lg border border-zinc-700 bg-zinc-800 hover:border-zinc-600 hover:bg-zinc-750 p-3 text-left transition-colors active:scale-[0.98] group"
                          title="Click to advance stage"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-zinc-200">{app.company}</span>
                            <span className="text-[11px] font-mono text-blue-400">{app.score}%</span>
                          </div>
                          <p className="text-[11px] text-zinc-500 truncate">{app.role}</p>
                          <p className="text-[10px] text-zinc-600 mt-1.5 group-hover:text-zinc-500 transition-colors">Tap to advance</p>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   ROI CALCULATOR - layout family 5
-------------------------------------------------------------------------- */
function RoiCalculator() {
  const [weeklyApps, setWeeklyApps] = useState(25);
  const appsPerMonth = useMemo(() => Math.round(weeklyApps * 4.33), [weeklyApps]);
  const hoursSaved = useMemo(() => Math.round((weeklyApps * 4.33 * 32) / 60), [weeklyApps]);

  return (
    <section id="roi" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
            The math behind K-Apply
          </h2>
          <p className="text-zinc-400 leading-relaxed">Calculate how many hours of repetitive form-filling K-Apply eliminates every month.</p>
        </RevealStagger>

        <RevealStagger delay={0.1}>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl">
            {/* Slider column */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-zinc-300">Applications per week</label>
                  <span className="text-sm font-mono font-bold text-blue-400">{weeklyApps} roles/week</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={weeklyApps}
                  onChange={(e) => setWeeklyApps(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
                <div className="flex justify-between mt-2 text-[11px] text-zinc-600">
                  <span>5 (Casual)</span>
                  <span>50 (High Velocity)</span>
                  <span>100 (Sprint)</span>
                </div>
              </div>

              <div className="space-y-2 rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                {[
                  { label: 'Monthly applications submitted', val: `${appsPerMonth} jobs` },
                  { label: 'Manual time saved per role', val: '~32 minutes' },
                  { label: 'AI cover letters generated', val: `${appsPerMonth} drafts` },
                ].map(({ label, val }) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-xs text-zinc-500">{label}</span>
                    <span className="text-xs font-mono font-medium text-zinc-300">{val}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Output column */}
            <div className="space-y-4">
              <div className="rounded-xl border border-blue-500/30 bg-blue-500/5 p-8 text-center">
                <div className="text-5xl font-bold tracking-tighter text-blue-400 mb-1">
                  {hoursSaved} hrs
                </div>
                <div className="text-sm font-medium text-zinc-300 mb-3">Saved every single month</div>
                <p className="text-xs text-zinc-500 max-w-[28ch] mx-auto">
                  Equivalent to getting back nearly a full work week to focus on interviews and coding rounds.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {[
                  { num: '8x', lbl: 'Faster discovery to submission' },
                  { num: '100%', lbl: 'Private local LLMs' },
                ].map(({ num, lbl }) => (
                  <div key={lbl} className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 text-center">
                    <div className="text-2xl font-bold tracking-tight text-zinc-50 mb-1">{num}</div>
                    <div className="text-[11px] text-zinc-500">{lbl}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </RevealStagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   TECHNICAL BENTO - layout family 6: asymmetric bento with real visual variety
-------------------------------------------------------------------------- */
function TechnicalBento() {
  return (
    <section className="py-24 bg-zinc-900/40 border-y border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger className="max-w-2xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
            Engineered for reliability
          </h2>
          <p className="text-zinc-400">Under the hood, K-Apply solves real DOM event quirks, API throttling, and candidate privacy.</p>
        </RevealStagger>

        {/* Bento: 3 cells for 3 items, mixed sizing, at least 2-3 with visual variation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Cell 1 - code snippet cell (blue tinted bg) */}
          <RevealStagger delay={0} className="md:col-span-2">
            <div className="rounded-xl border border-blue-500/20 bg-blue-950/20 p-6 h-full">
              <Badge variant="ai" className="text-[10px] mb-3">Core Engine</Badge>
              <h3 className="text-base font-semibold text-zinc-100 mb-2">Native Prototype Value Setter</h3>
              <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
                Modern ATS forms built with React 16+ wipe programmatically injected values on submit. K-Apply bypasses React's internal{' '}
                <code className="text-blue-400 font-mono text-xs">_valueTracker</code>{' '}
                by acquiring the prototype descriptor and dispatching synthetic bubbles.
              </p>
              <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-4 overflow-x-auto">
                <pre className="text-[11px] font-mono text-zinc-300 leading-relaxed whitespace-pre-wrap">
{`const nativeSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype, 'value'
).set;
nativeSetter.call(element, interpolatedValue);
element.dispatchEvent(new Event('input', { bubbles: true }));`}
                </pre>
              </div>
            </div>
          </RevealStagger>

          {/* Cell 2 - privacy (emerald tinted) */}
          <RevealStagger delay={0.08}>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-6 h-full">
              <Badge variant="success" className="text-[10px] mb-3">Privacy First</Badge>
              <h3 className="text-base font-semibold text-zinc-100 mb-2">100% Local Ollama AI</h3>
              <p className="text-sm text-zinc-400 mb-5 leading-relaxed">
                Your compensation history and internal achievements never leave your machine. K-Apply talks to your local Ollama instance with zero third-party telemetry.
              </p>
              <div className="flex items-center gap-2 rounded-lg border border-emerald-700/30 bg-emerald-900/20 px-3 py-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                <span className="text-xs text-emerald-400 font-mono">localhost:11434 - Zero Cloud</span>
              </div>
            </div>
          </RevealStagger>

          {/* Cell 3 - HITL (full width, darker bg for contrast) */}
          <RevealStagger delay={0.12} className="md:col-span-3">
            <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex-1">
                  <Badge variant="secondary" className="text-[10px] mb-3">Autonomous Worker</Badge>
                  <h3 className="text-base font-semibold text-zinc-100 mb-2">Playwright Human-in-the-Loop Review</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed max-w-[55ch]">
                    Never worry about a bot submitting incorrect information. K-Apply Hunter supports toggleable HITL mode that opens the browser, pre-fills every field, and waits for your confirmation click before submitting.
                  </p>
                </div>
                <div className="flex-shrink-0 grid grid-cols-2 gap-3 md:w-64">
                  {[
                    { icon: <Shield className="w-4 h-4 text-blue-400" />, label: 'HITL review mode' },
                    { icon: <Layers className="w-4 h-4 text-blue-400" />, label: 'Auto-fill on detect' },
                    { icon: <Code2 className="w-4 h-4 text-blue-400" />, label: 'Dynamic variables' },
                    { icon: <Target className="w-4 h-4 text-blue-400" />, label: 'Multi-ATS support' },
                  ].map(({ icon, label }) => (
                    <div key={label} className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-800/60 px-3 py-2">
                      {icon}
                      <span className="text-[11px] text-zinc-300">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </RevealStagger>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   PRICING - layout family 7
-------------------------------------------------------------------------- */
function Pricing() {
  const [cycle, setCycle] = useState<'monthly' | 'yearly'>('monthly');

  const plans = [
    {
      name: 'Solo Starter',
      desc: 'For developers applying to a handful of select companies.',
      price: { monthly: '0', yearly: '0' },
      period: 'forever',
      features: [
        'Manifest V3 Chrome Extension',
        'Up to 50 autofills / month',
        'Local Q&A Answers Vault',
        'Basic Application Table Tracker',
        'React Synthetic Event Engine',
      ],
      cta: { label: 'Get Started Free', variant: 'outline' as const, action: 'install' },
    },
    {
      name: 'Pro Copilot',
      desc: 'For active job seekers who want AI-tailored applications and full tracking.',
      price: { monthly: '19', yearly: '15' },
      period: '/ month',
      featured: true,
      features: [
        'Unlimited 1-Click Form Autofills',
        'Full Command Center & Kanban Board',
        'Ollama Local AI Pitch Studio',
        'Dynamic Template Variable Engine',
        'MongoDB Atlas & Local Database Sync',
        'Resilient In-Memory Fallback',
      ],
      cta: { label: 'Launch Pro Experience', variant: 'accent' as const, action: 'dashboard' },
    },
    {
      name: 'Autonomous Hunter',
      desc: 'For power applicants who want automated discovery and background workers.',
      price: { monthly: '49', yearly: '39' },
      period: '/ month',
      features: [
        'All Pro Copilot Features',
        'K-Apply Hunter Automation Module',
        'Multi-ATS Board Crawlers (Greenhouse, Lever, Ashby)',
        'Predictive Interview Question Generator',
        'Playwright HITL Review & Background Worker',
        'Resume Match Scoring Algorithm',
      ],
      cta: { label: 'Start Hunter Trial', variant: 'outline' as const, action: 'dashboard' },
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger className="max-w-xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
            Transparent, high-ROI pricing
          </h2>
          <p className="text-zinc-400">One job offer pays for a lifetime of K-Apply. Start free and upgrade when ready.</p>
        </RevealStagger>

        {/* Billing toggle */}
        <RevealStagger delay={0.08} className="mb-10">
          <div className="inline-flex rounded-lg border border-zinc-800 bg-zinc-900 p-1 gap-1">
            {(['monthly', 'yearly'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  'px-4 py-1.5 rounded-md text-sm font-medium transition-all',
                  cycle === c
                    ? 'bg-zinc-700 text-zinc-50 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200'
                )}
              >
                {c === 'monthly' ? 'Monthly' : 'Annual'}
                {c === 'yearly' && (
                  <Badge variant="success" className="ml-2 text-[10px] py-0">Save 20%</Badge>
                )}
              </button>
            ))}
          </div>
        </RevealStagger>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan, i) => (
            <RevealStagger key={plan.name} delay={i * 0.07}>
              <Card className={cn(
                'h-full rounded-xl bg-zinc-900 border-zinc-800 flex flex-col',
                plan.featured && 'ring-1 ring-blue-500/40 border-blue-500/20'
              )}>
                {plan.featured && (
                  <div className="px-6 pt-4">
                    <Badge variant="ai" className="text-[10px]">Most Popular</Badge>
                  </div>
                )}
                <CardHeader className={cn('pb-4', !plan.featured && 'pt-6')}>
                  <CardTitle className="text-zinc-50">{plan.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{plan.desc}</CardDescription>
                  <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-zinc-400 text-base">$</span>
                    <span className="text-4xl font-bold tracking-tighter text-zinc-50">{plan.price[cycle]}</span>
                    <span className="text-zinc-500 text-sm">{plan.period}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2.5 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-zinc-400">
                        <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0 mt-0.5" strokeWidth={2.5} />
                        <span dangerouslySetInnerHTML={{ __html: f.replace('Unlimited', '<strong class="text-zinc-200">Unlimited</strong>').replace('All Pro Copilot Features', '<strong class="text-zinc-200">All Pro Copilot Features</strong>') }} />
                      </li>
                    ))}
                  </ul>
                  {plan.cta.action === 'dashboard' ? (
                    <Button asChild variant={plan.cta.variant} className="w-full">
                      <Link href="/dashboard">{plan.cta.label}</Link>
                    </Button>
                  ) : (
                    <Button variant={plan.cta.variant} className="w-full border-zinc-700 hover:bg-zinc-800">
                      {plan.cta.label}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </RevealStagger>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   TESTIMONIALS - layout family 8: horizontal scroll-snap on mobile
-------------------------------------------------------------------------- */
function Testimonials() {
  return (
    <section className="py-24 bg-zinc-900/40 border-y border-zinc-800">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger className="max-w-xl mb-14">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
            Built for engineers, loved by job seekers
          </h2>
        </RevealStagger>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <RevealStagger key={t.name} delay={i * 0.07}>
              <Card className="bg-zinc-900 border-zinc-800 h-full">
                <CardContent className="p-6">
                  <p className="text-sm text-zinc-300 leading-relaxed mb-6 italic">
                    "{t.quote}"
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs font-bold text-zinc-300 flex-shrink-0">
                      {t.initials}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-200">{t.name}</p>
                      <p className="text-xs text-zinc-500">{t.role} - {t.company}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </RevealStagger>
          ))}
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FAQ - layout family 9: accordion
-------------------------------------------------------------------------- */
function Faq() {
  return (
    <section id="faq" className="py-24">
      <div className="max-w-3xl mx-auto px-6">
        <RevealStagger className="mb-12">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
            Frequently asked questions
          </h2>
        </RevealStagger>

        <RevealStagger delay={0.08}>
          <Accordion type="single" collapsible className="divide-y divide-zinc-800">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`item-${i}`} className="border-zinc-800">
                <AccordionTrigger className="text-zinc-200 hover:text-zinc-50 hover:no-underline py-5 text-sm text-left">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-zinc-400 text-sm pb-5">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </RevealStagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FINAL CTA - layout family 10
-------------------------------------------------------------------------- */
function FinalCta({ onInstallOpen }: { onInstallOpen: () => void }) {
  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <RevealStagger>
          <div className="rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-zinc-900 p-12 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tighter text-zinc-50 mb-4">
              Ready to transform your job hunt?
            </h2>
            <p className="text-zinc-400 mb-8 max-w-[40ch] mx-auto">
              Set up in less than 2 minutes. No account required to get started.
            </p>
            <div className="flex items-center justify-center gap-3 flex-wrap">
              <Button asChild size="lg" variant="accent" className="gap-2 font-semibold">
                <Link href="/dashboard">
                  Launch Command Center
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onInstallOpen}
                className="gap-2 font-semibold border-zinc-700 text-zinc-300 hover:text-zinc-50 hover:bg-zinc-800"
              >
                <Download className="w-4 h-4" />
                Install Extension
              </Button>
            </div>
          </div>
        </RevealStagger>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------
   FOOTER
-------------------------------------------------------------------------- */
function Footer() {
  return (
    <footer className="border-t border-zinc-800 bg-zinc-950 py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 no-underline mb-3">
              <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center">
                <Zap className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
              </div>
              <span className="text-sm font-semibold text-zinc-50">K-Apply</span>
            </Link>
            <p className="text-xs text-zinc-500 leading-relaxed max-w-[24ch]">
              The all-in-one autonomous job application platform and AI career engine.
            </p>
          </div>

          {[
            {
              heading: 'Product',
              links: [
                { label: 'Command Center', href: '/dashboard' },
                { label: 'Browser Extension', href: '#pillars' },
                { label: 'K-Apply Hunter', href: '#pillars' },
                { label: 'Pricing', href: '#pricing' },
              ],
            },
            {
              heading: 'Ecosystem',
              links: [
                { label: 'Interactive Demo', href: '#preview' },
                { label: 'ROI Calculator', href: '#roi' },
                { label: 'FAQ', href: '#faq' },
                { label: 'GitHub Repository', href: 'https://github.com' },
              ],
            },
            {
              heading: 'System',
              links: [],
              custom: (
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-zinc-500">All ATS Connectors Operational</span>
                </div>
              ),
            },
          ].map(({ heading, links, custom }) => (
            <div key={heading}>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block mb-3">{heading}</span>
              <div className="flex flex-col gap-2">
                {links.map(({ label, href }) => (
                  <a
                    key={label}
                    href={href}
                    className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    {...(href.startsWith('http') ? { target: '_blank', rel: 'noreferrer' } : {})}
                  >
                    {label}
                  </a>
                ))}
                {custom}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-zinc-800 pt-6 flex items-center justify-between flex-wrap gap-4">
          <p className="text-xs text-zinc-600">
            &copy; {new Date().getFullYear()} K-Apply Suite. All rights reserved.
          </p>
          <p className="text-xs text-zinc-700 font-mono">
            React 19 + Next.js 15 + Tailwind v4 + shadcn/ui
          </p>
        </div>
      </div>
    </footer>
  );
}

/* -------------------------------------------------------------------------
   INSTALL MODAL
-------------------------------------------------------------------------- */
function InstallModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const path = '<path-to-your-cloned-repo>/K-Apply';

  const handleCopy = () => {
    navigator.clipboard.writeText(path);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-9 h-9 rounded-md bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Zap className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <DialogTitle>Install K-Apply Extension</DialogTitle>
              <DialogDescription>30-second load unpacked setup for Chrome & Edge</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 pb-2 space-y-5">
          {[
            {
              step: '1',
              title: 'Open Chrome Extensions',
              content: (
                <code className="text-xs font-mono bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded px-2 py-1 text-zinc-800 dark:text-zinc-200">
                  chrome://extensions
                </code>
              ),
            },
            {
              step: '2',
              title: 'Enable Developer Mode',
              content: (
                <p className="text-xs text-zinc-500">Turn on the Developer mode toggle in the top-right corner.</p>
              ),
            },
            {
              step: '3',
              title: 'Load Unpacked & Select Folder',
              content: (
                <div className="flex items-center gap-2 rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 p-2">
                  <Input readOnly value={path} className="border-0 bg-transparent text-xs h-6 p-0 font-mono" />
                  <Button size="sm" variant="outline" onClick={handleCopy} className="shrink-0 h-6 text-xs gap-1">
                    {copied ? <><Check className="w-3 h-3 text-emerald-500" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                  </Button>
                </div>
              ),
            },
          ].map(({ step, title, content }) => (
            <div key={step} className="flex gap-4">
              <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                {step}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">{title}</p>
                {content}
              </div>
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button asChild variant="accent" className="flex-1">
            <Link href="/dashboard" onClick={onClose}>
              Go to Command Center
            </Link>
          </Button>
          <Button variant="outline" onClick={onClose} className="border-zinc-700">Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------
   PAGE ROOT
-------------------------------------------------------------------------- */
export default function LandingPage() {
  const [installOpen, setInstallOpen] = useState(false);

  return (
    <div className="bg-zinc-950 text-zinc-50 min-h-screen">
      <SiteNav onInstallOpen={() => setInstallOpen(true)} />
      <main>
        <Hero onInstallOpen={() => setInstallOpen(true)} />
        <AtsStrip />
        <ThreePillars />
        <TestDrivePlayground />
        <RoiCalculator />
        <TechnicalBento />
        <Pricing />
        <Testimonials />
        <Faq />
        <FinalCta onInstallOpen={() => setInstallOpen(true)} />
      </main>
      <Footer />
      <InstallModal open={installOpen} onClose={() => setInstallOpen(false)} />
    </div>
  );
}
