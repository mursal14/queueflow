'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, Zap, BarChart3, Bell, Monitor, Globe, Clock,
  CheckCircle2, ArrowRight, Star, Check, X, Menu, Sparkles,
  ChevronRight, TrendingUp, Smartphone, Lock, Play
} from 'lucide-react'

// ── NO module-level loadStripe() — pricing just redirects to /signup?plan=X
// ── Stripe is only loaded on the checkout API route (server-side)

const PLANS = [
  {
    id: 'free', name: 'Free', price: 0, annualPrice: 0,
    description: 'Perfect to get started',
    gradient: 'from-gray-500 to-gray-600',
    features: ['2 Queues', '1 Location', '2 Team members', 'Basic analytics', 'Email support'],
    notIncluded: ['Custom branding', 'SMS notifications', 'API access'],
    cta: 'Start Free',
  },
  {
    id: 'starter', name: 'Starter', price: 29, annualPrice: 23,
    description: 'For small businesses',
    gradient: 'from-blue-500 to-cyan-500',
    features: ['10 Queues', '3 Locations', '5 Team members', 'QR codes', 'Email notifications', 'Custom branding', 'Priority support'],
    notIncluded: [],
    cta: 'Start 14-Day Trial',
  },
  {
    id: 'professional', name: 'Professional', price: 79, annualPrice: 63,
    description: 'For growing teams',
    gradient: 'from-indigo-500 to-purple-600',
    popular: true,
    features: ['50 Queues', '10 Locations', '25 Team members', 'SMS notifications', 'Advanced analytics', 'API access', 'White-label', 'Display screens', 'Dedicated support'],
    notIncluded: [],
    cta: 'Start 14-Day Trial',
  },
  {
    id: 'enterprise', name: 'Enterprise', price: 199, annualPrice: 159,
    description: 'Unlimited scale',
    gradient: 'from-amber-500 to-orange-500',
    features: ['Unlimited everything', 'Custom integrations', 'SSO / SAML', 'SLA guarantee', 'Custom domain', '24/7 phone support', 'Dedicated manager'],
    notIncluded: [],
    cta: 'Start 14-Day Trial',
  },
]

const FEATURES = [
  { icon: Zap,        title: 'Real-Time Updates',      desc: 'WebSocket-powered live queue sync across every device instantly — no page refresh ever needed.',           color: 'from-yellow-400 to-orange-500' },
  { icon: BarChart3,  title: 'AI Wait Predictions',    desc: 'Machine learning predicts wait times with 95% accuracy based on historical service patterns.',              color: 'from-blue-400 to-cyan-500' },
  { icon: Bell,       title: 'Smart Notifications',    desc: 'Auto SMS and email alerts the moment a customer is called. Reduce no-shows by up to 60%.',                 color: 'from-purple-400 to-pink-500' },
  { icon: Monitor,    title: 'Natural Audio Display',  desc: 'Human-sounding voice announcements on any TV screen. Customisable voice, rate and pitch per screen.',       color: 'from-green-400 to-emerald-500' },
  { icon: Users,      title: 'Team Management',        desc: 'Invite staff, assign roles (Admin/Staff/Viewer), manage multiple locations from one dashboard.',            color: 'from-indigo-400 to-blue-500' },
  { icon: Globe,      title: 'Public Queue Links',     desc: 'Every queue gets a unique URL + QR code. Customers join from any device — no app download required.',     color: 'from-rose-400 to-red-500' },
  { icon: Lock,       title: 'Stripe Payments',        desc: 'Industry-standard Stripe integration handles all billing. Accept subscriptions securely from day one.',     color: 'from-teal-400 to-green-500' },
  { icon: TrendingUp, title: 'Analytics Dashboard',    desc: 'Track served count, peak hours, average wait times and staff performance with a 7-day trend chart.',       color: 'from-violet-400 to-purple-500' },
  { icon: Smartphone, title: 'Mobile First',           desc: 'Fully responsive on every screen size. 80% of customers join queues on their mobile phones.',              color: 'from-sky-400 to-blue-500' },
]

const TESTIMONIALS = [
  { name: 'Dr Sarah Kim',  role: 'Clinic Director',      company: 'Metro Medical Centre',    rating: 5, text: 'QueueFlow cut our patient wait complaints by 70%. The natural-sounding audio and real-time board completely transformed our waiting room.' },
  { name: 'Marcus Webb',   role: 'Operations Manager',   company: 'City Hall Services',      rating: 5, text: 'We handle 800 citizens daily across 4 counters. QueueFlow manages it all — multiple queues, SMS alerts, analytics. Setup took 25 minutes.' },
  { name: 'Priya Nair',    role: 'Retail Director',      company: 'Luxe Department Store',   rating: 5, text: 'Customer satisfaction up 45% since launch. The Stripe billing is seamless and the analytics give us exactly the insights we need to improve.' },
]

export default function LandingPage() {
  const [annual,     setAnnual]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  return (
    <div className="min-h-screen bg-white">

      {/* ── NAV ───────────────────────────────────────────────── */}
      <nav className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/90 backdrop-blur-xl shadow-sm border-b border-gray-100' : 'bg-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Queue<span className="text-blue-600">Flow</span></span>
          </Link>

          <div className="hidden md:flex items-center gap-7 text-sm font-medium">
            <a href="#features"     className="text-gray-600 hover:text-blue-600 transition-colors">Features</a>
            <a href="#pricing"      className="text-gray-600 hover:text-blue-600 transition-colors">Pricing</a>
            <a href="#testimonials" className="text-gray-600 hover:text-blue-600 transition-colors">Customers</a>
            <Link href="/docs"      className="text-gray-600 hover:text-blue-600 transition-colors">Docs</Link>
            <Link href="/login"     className="text-gray-600 hover:text-blue-600 transition-colors">Sign In</Link>
            <Link href="/signup"    className="btn-primary btn-sm">Start Free Trial</Link>
          </div>

          <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-3 shadow-lg">
            <a href="#features"  onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 font-medium">Features</a>
            <a href="#pricing"   onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 font-medium">Pricing</a>
            <Link href="/login"  onClick={() => setMobileOpen(false)} className="block py-2 text-gray-700 font-medium">Sign In</Link>
            <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-primary w-full justify-center text-sm">Start Free Trial</Link>
          </div>
        )}
      </nav>

      {/* ── HERO ──────────────────────────────────────────────── */}
      <section className="relative pt-28 pb-24 overflow-hidden bg-gradient-to-b from-slate-50 via-blue-50/30 to-white">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-full px-4 py-1.5 mb-6">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-blue-700 text-sm font-semibold">Stripe-Ready · Real-Time · Deploy in 30 min</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.08] mb-6">
            Queue Management<br />
            <span className="gradient-text">That Just Works</span>
          </h1>

          <p className="text-xl sm:text-2xl text-gray-600 max-w-3xl mx-auto mb-10">
            Virtual queuing with real-time updates, natural audio announcements,
            SMS notifications, team management and Stripe billing — ready in 30 minutes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
            <Link href="/signup" className="btn-primary btn-lg w-full sm:w-auto">
              Start Free 14-Day Trial <ArrowRight className="w-5 h-5" />
            </Link>
            <a href="#features" className="btn-secondary btn-lg w-full sm:w-auto">
              <Play className="w-4 h-4" /> See Features
            </a>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-gray-500">
            {['No credit card required', '14-day free trial', 'Cancel anytime', 'GDPR compliant'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />{t}
              </span>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {[['50K+','Customers served'],['95%','Wait time accuracy'],['10K+','Active businesses'],['4.9★','Average rating']].map(([n, l]) => (
              <div key={l} className="card py-5 px-4">
                <div className="text-2xl font-bold gradient-text">{n}</div>
                <div className="text-xs text-gray-500 mt-1">{l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TRUST LOGOS ───────────────────────────────────────── */}
      <section className="py-10 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-4">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Trusted across industries</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-6 items-center opacity-40">
            {['Healthcare','Government','Retail','Finance','Hospitality','Education'].map(t => (
              <div key={t} className="text-center text-gray-600 font-bold text-sm">{t}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ──────────────────────────────────────────── */}
      <section id="features" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-blue-600 font-semibold mb-3 tracking-wide uppercase text-sm">Everything You Need</p>
            <h2 className="section-title mb-4">Built for Real Businesses</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Every feature you need to manage queues, delight customers and grow revenue — in one platform.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map(f => (
              <div key={f.title} className="card-hover p-7 group">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-600 leading-relaxed text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ──────────────────────────────────────── */}
      <section className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">Live in Under 30 Minutes</h2>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', title: 'Sign Up',      desc: 'Create your account. 14-day free trial starts instantly — no card needed.' },
              { step: '02', title: 'Choose Plan',  desc: 'Select Starter, Professional or Enterprise. Pay securely via Stripe.' },
              { step: '03', title: 'Create Queue', desc: 'Build a queue in seconds. Get a shareable public link and QR code.' },
              { step: '04', title: 'Go Live!',     desc: 'Customers join, staff manage, TV display announces — all real-time.' },
            ].map((s, i) => (
              <div key={s.step} className="relative text-center">
                {i < 3 && <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-blue-200 to-indigo-200" />}
                <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 shadow-lg">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ───────────────────────────────────────────── */}
      <section id="pricing" className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-blue-600 font-semibold mb-3 uppercase text-sm tracking-wide">Transparent Pricing</p>
            <h2 className="section-title mb-4">Simple Plans, Real Revenue</h2>
            <p className="text-xl text-gray-600 max-w-xl mx-auto mb-8">Start free. Upgrade when you grow. Cancel any time.</p>

            {/* Billing toggle */}
            <div className="inline-flex items-center gap-1 bg-gray-100 rounded-xl p-1.5">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${!annual ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${annual ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Annual <span className="ml-1.5 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
            {PLANS.map(plan => (
              <div key={plan.id} className={`relative rounded-2xl p-7 border-2 transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 ${
                plan.popular
                  ? 'border-indigo-500 shadow-xl bg-gradient-to-b from-indigo-50/60 to-white scale-[1.02]'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}>
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-bold px-4 py-1 rounded-full shadow">
                    MOST POPULAR
                  </div>
                )}

                {/* Plan header */}
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${plan.gradient} flex items-center justify-center mb-4`}>
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5 mb-4">{plan.description}</p>

                {/* Price */}
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="text-4xl font-extrabold text-gray-900">
                    ${annual ? plan.annualPrice : plan.price}
                  </span>
                  {plan.price > 0 && <span className="text-gray-400 text-sm">/mo</span>}
                  {annual && plan.price > 0 && (
                    <span className="text-xs text-green-600 font-semibold ml-1">billed annually</span>
                  )}
                </div>

                {/* CTA — simple Link, NO Stripe at this stage */}
                <Link
                  href={plan.id === 'free' ? '/signup' : `/signup?plan=${plan.id}`}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all mb-5 flex items-center justify-center gap-1.5 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-[1.02]'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {plan.cta} {plan.price > 0 && <ChevronRight className="w-4 h-4" />}
                </Link>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{f}</span>
                    </li>
                  ))}
                  {plan.notIncluded.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <X className="w-4 h-4 text-gray-300 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-400">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-center text-sm text-gray-400 mt-10">
            All plans include SSL, automatic backups and 99.9% uptime SLA. Payments processed securely by Stripe.
          </p>
        </div>
      </section>

      {/* ── TESTIMONIALS ──────────────────────────────────────── */}
      <section id="testimonials" className="py-24 px-4 bg-gradient-to-b from-slate-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="section-title mb-4">Loved by Businesses Worldwide</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-7">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="card-hover p-7">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-700 leading-relaxed mb-5 italic">"{t.text}"</p>
                <div>
                  <div className="font-bold text-gray-900">{t.name}</div>
                  <div className="text-sm text-gray-500">{t.role} · {t.company}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────── */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 rounded-3xl p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-5">
              Ready to Transform Your Queue?
            </h2>
            <p className="text-blue-100 text-xl mb-8 max-w-xl mx-auto">
              Join thousands of businesses. Start free — no credit card, no commitment.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup" className="btn bg-white text-blue-700 font-bold btn-lg hover:bg-blue-50 shadow-lg hover:scale-[1.03] transition-all">
                Start Free Trial <ArrowRight className="w-5 h-5" />
              </Link>
              <Link href="/signup?plan=professional" className="btn bg-white/10 text-white border-2 border-white/30 btn-lg hover:bg-white/20 transition-all">
                View Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ────────────────────────────────────────────── */}
      <footer className="bg-gray-900 text-gray-400 pt-16 pb-10 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-5 gap-10 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold text-lg">Queue<span className="text-blue-400">Flow</span></span>
              </div>
              <p className="text-sm leading-relaxed mb-4">
                AI-powered queue management SaaS. Transform your customer experience from day one.
              </p>
              <p className="text-xs">© {new Date().getFullYear()} QueueFlow. All rights reserved.</p>
            </div>
            {[
              { title: 'Product',  links: [['Features','#features'],['Pricing','#pricing'],['Changelog','/changelog'],['Docs','/docs']] },
              { title: 'Company',  links: [['About','#'],['Blog','#'],['Careers','#'],['Press','#']] },
              { title: 'Legal',    links: [['Privacy Policy','/privacy'],['Terms of Service','/terms'],['GDPR','/privacy#gdpr'],['Cookies','/privacy#cookies']] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="text-white font-semibold mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map(([label, href]) => (
                    <li key={label}>
                      <Link href={href} className="text-sm hover:text-white transition-colors">{label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
            <span>Payments secured by Stripe · Hosted on Vercel · Database on Supabase</span>
            <span>SOC 2 · GDPR · PCI-DSS via Stripe</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
