"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import MobileMenu from '@/components/MobileMenu';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { fetchFeaturedCars, fetchInventory, createEnquiry } from '@/api/inventoryApi';
import { ClipboardCheck, ShieldCheck, History, Landmark, CarFront, Tag } from 'lucide-react';
import styles from './page.module.css';

function parseSpecs(specs) {
  if (!specs) return {};
  if (typeof specs === 'object') return specs;
  try { return JSON.parse(specs); } catch(e) { return {}; }
}

const reorderForCenter = (arr) => {
  if (!arr || arr.length === 0) return [];
  const result = new Array(arr.length);
  const mid = Math.floor((arr.length - 1) / 2);
  let left = mid - 1;
  let right = mid + 1;
  result[mid] = arr[0];
  
  for (let i = 1; i < arr.length; i++) {
    if (i % 2 !== 0) {
      result[right++] = arr[i];
    } else {
      result[left--] = arr[i];
    }
  }
  return result;
};

function OfferModal({ car, onClose, onSendOtp, onVerifyOtp, onSubmitOffer }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [offer, setOffer] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submitPhone = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSendOtp(phone);
      setStep('otp');
    } catch (err) {
      setError(err.message || 'We could not send the verification code. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitOtp = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onVerifyOtp(phone, otp);
      setStep('offer');
    } catch (err) {
      setError(err.message || 'That code could not be verified. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const submitOffer = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    try {
      await onSubmitOffer({ phone, offer });
      setStep('success');
    } catch (err) {
      setError(err.message || 'We could not submit your offer. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-4 backdrop-blur-sm sm:items-center" role="dialog" aria-modal="true" aria-labelledby="offer-title">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
        <div className="mb-7 flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Best price request</p>
            <h2 id="offer-title" className="font-headline-md text-2xl uppercase leading-none text-secondary">{car.name}</h2>
            <p className="mt-2 text-sm text-secondary/60">Verify your phone before you make an offer.</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 place-items-center rounded-full bg-black/[0.05] text-secondary transition-colors hover:bg-primary hover:text-white">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {step === 'phone' && (
          <form onSubmit={submitPhone} className="space-y-5">
            <label className="block text-sm font-semibold text-secondary">Mobile number<input autoFocus required value={phone} onChange={(event) => setPhone(event.target.value.replace(/\\D/g, '').slice(0, 10))} inputMode="numeric" pattern="[0-9]{10}" className="mt-2 w-full rounded-lg border border-black/10 px-4 py-3 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="10-digit mobile number" /></label>
            <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white transition-transform hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? 'Sending code...' : 'Send verification code'}<span className="material-symbols-outlined text-lg">arrow_forward</span></button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={submitOtp} className="space-y-5">
            <label className="block text-sm font-semibold text-secondary">Verification code<input autoFocus required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\\D/g, '').slice(0, 6))} inputMode="numeric" pattern="[0-9]{6}" className="mt-2 w-full rounded-lg border border-black/10 px-4 py-3 text-center text-lg tracking-[0.35em] outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="000000" /></label>
            <button disabled={busy} className="w-full rounded-lg bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white transition-transform hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? 'Verifying...' : 'Verify phone'}</button>
            <button type="button" onClick={() => setStep('phone')} className="w-full text-sm font-semibold text-secondary/60 hover:text-primary">Use a different number</button>
          </form>
        )}

        {step === 'offer' && (
          <form onSubmit={submitOffer} className="space-y-5">
            <div className="rounded-lg bg-[#f5f6f7] p-4 text-sm text-secondary/70">Your number is verified. Make a fair offer for this vehicle and our dealer team will review it.</div>
            <label className="block text-sm font-semibold text-secondary">Your best price<input autoFocus required value={offer} onChange={(event) => setOffer(event.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" className="mt-2 w-full rounded-lg border border-black/10 px-4 py-3 text-lg outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15" placeholder="Enter amount in ₹" /></label>
            <button disabled={busy} className="w-full rounded-lg bg-primary px-5 py-3.5 text-sm font-bold uppercase tracking-[0.08em] text-white transition-transform hover:brightness-110 disabled:cursor-wait disabled:opacity-60">{busy ? 'Submitting...' : 'Submit my offer'}</button>
          </form>
        )}

        {step === 'success' && (
          <div className="rounded-xl bg-[#f5f6f7] p-5 text-center">
            <span className="material-symbols-outlined mb-3 text-4xl text-primary">check_circle</span>
            <h3 className="font-headline-md text-xl uppercase text-secondary">Offer received</h3>
            <p className="mt-2 text-sm leading-relaxed text-secondary/65">Our dealer team will review your price and contact you soon.</p>
            <button type="button" onClick={onClose} className="mt-5 w-full rounded-lg bg-secondary px-5 py-3 text-sm font-bold uppercase tracking-[0.08em] text-white">Done</button>
          </div>
        )}

        {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}

export default function Home() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [offerCar, setOfferCar] = useState(null);
  
  const [searchModel, setSearchModel] = useState('');
  const [searchBudget, setSearchBudget] = useState('');
  const [searchBodyType, setSearchBodyType] = useState('');
  const [searchLocation, setSearchLocation] = useState('Cochin');
  const router = useRouter();

  // Synchronize model and body type
  useEffect(() => {
    const modelBodyMap = {
      'Fortuner': 'SUV',
      'Corolla': 'Sedan',
      'Camry': 'Sedan',
      'Hilux': 'Pickup',
      'Innova': 'MUV',
      'Supra': 'Sports'
    };
    if (searchModel && modelBodyMap[searchModel]) {
      setSearchBodyType(modelBodyMap[searchModel]);
    }
  }, [searchModel]);

  useEffect(() => {
    const modelBodyMap = {
      'Fortuner': 'SUV',
      'Corolla': 'Sedan',
      'Camry': 'Sedan',
      'Hilux': 'Pickup',
      'Innova': 'MUV',
      'Supra': 'Sports'
    };
    if (searchBodyType && searchModel && modelBodyMap[searchModel] !== searchBodyType) {
      setSearchModel('');
    }
  }, [searchBodyType]);

  const { data: featuredCars = [], isLoading: isLoadingFeatured } = useQuery({
    queryKey: ['featured-cars'],
    queryFn: fetchFeaturedCars
  });

  const { data: inventoryCars = [] } = useQuery({
    queryKey: ['inventory'],
    queryFn: fetchInventory
  });

  const dynamicModels = React.useMemo(() => {
    const models = new Set();
    inventoryCars.forEach(c => {
      if (c.name) {
        // Extract model name (e.g. 'Toyota Fortuner' -> 'Fortuner')
        const parts = c.name.split(' ');
        const modelName = parts.length > 1 ? parts.slice(1).join(' ') : c.name;
        models.add(modelName);
      }
    });
    return Array.from(models).sort();
  }, [inventoryCars]);

  const dynamicBodyTypes = React.useMemo(() => {
    const types = new Set();
    inventoryCars.forEach(c => {
      const specs = parseSpecs(c.specs);
      if (specs.bodyType) types.add(specs.bodyType);
    });
    // Add defaults if empty to avoid empty dropdown
    if (types.size === 0) {
      ['SUV', 'Sedan', 'Hatchback', 'Pickup', 'MUV', 'Sports'].forEach(t => types.add(t));
    }
    return Array.from(types).sort();
  }, [inventoryCars]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchLocation) params.append('location', searchLocation);
    if (searchModel) params.append('model', searchModel);
    if (searchBudget) params.append('budget', searchBudget);
    if (searchBodyType) params.append('bodyType', searchBodyType);
    router.push(`/inventory?${params.toString()}`);
  };

  const handleSendOfferOtp = async (phone) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/api/otp/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
    });
    if (!response.ok) throw new Error('Phone verification is unavailable right now. Please contact the dealer.');
  };

  const handleVerifyOfferOtp = async (phone, otp) => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiBase}/api/otp/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, otp }),
    });
    if (!response.ok) throw new Error('That code could not be verified. Please check it and try again.');
  };

  const handleSubmitOffer = async ({ phone, offer }) => {
    await createEnquiry({
      customer_phone: phone,
      vehicle_interest: offerCar?.name || 'Featured vehicle',
      vehicle_specs: { car_id: offerCar?.id, offer_amount: offer },
      lead_type: 'price_offer',
      notes: `Verified phone offer: ₹${offer}`,
    });
  };

  const handleUseLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => setSearchLocation('Cochin'),
        () => setSearchLocation('Cochin')
      );
    }
  };

  return (
    <div className="bg-surface text-on-surface w-full overflow-x-hidden">
      {/* TopNavBar */}
      <nav className={`fixed top-0 w-full z-50 border-b border-outline-variant transition-all duration-300 ${scrolled ? 'bg-white shadow-xl' : 'bg-white/95 backdrop-blur-sm'}`}>
        <div className="flex justify-between items-center h-20 px-margin-desktop max-w-container-max mx-auto">
          <div className="flex items-center gap-stack-lg">
            <MobileMenu />
            <Link href="/" className="font-headline-md text-headline-md font-semibold text-primary uppercase hover:opacity-80 transition-opacity cursor-pointer">Nippon Used Cars</Link>
            <div className="hidden md:flex items-center gap-8 ml-12">
              <Link href="#" className="nav-link font-label-bold text-label-bold uppercase text-primary relative after:content-[''] after:absolute after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary">Buy</Link>
              <Link href="/sell" className="nav-link font-label-bold text-label-bold uppercase text-on-surface hover:text-primary relative after:content-[''] after:absolute after:w-0 hover:after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300">Sell</Link>
              <Link href="/exchange" className="nav-link font-label-bold text-label-bold uppercase text-on-surface hover:text-primary relative after:content-[''] after:absolute after:w-0 hover:after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300">Exchange</Link>
              <Link href="/inventory" className="nav-link font-label-bold text-label-bold uppercase text-on-surface hover:text-primary relative after:content-[''] after:absolute after:w-0 hover:after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300">Inventory</Link>
              <Link href="/certified" className="nav-link font-label-bold text-label-bold uppercase text-on-surface hover:text-primary relative after:content-[''] after:absolute after:w-0 hover:after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300">Certified</Link>
              <Link href="/about" className="nav-link font-label-bold text-label-bold uppercase text-on-surface hover:text-primary relative after:content-[''] after:absolute after:w-0 hover:after:w-full after:h-[2px] after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:bg-primary after:transition-all after:duration-300">About Us</Link>
            </div>
          </div>
          <div className="flex items-center gap-stack-md">
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-location-first pt-24 pb-12 md:pb-16 lg:pb-20">
        <div className="px-margin-desktop max-w-container-max mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14 xl:gap-16 items-center">
            <div className="flex flex-col gap-6 lg:gap-7">
              <span className="text-primary text-xs font-bold uppercase tracking-[0.2em]">Nippon U Trust</span>

              <h1 className="text-[clamp(2.25rem,4vw+0.5rem,3.5rem)] font-bold leading-[1.1] text-on-surface tracking-tight">
                Find a car you can trust.
              </h1>

              <p className="text-secondary text-lg leading-relaxed max-w-lg">
                Browse inspected pre-owned cars near you, with clear details and local dealer support.
              </p>

              <div className="flex flex-wrap gap-3 pt-1">
                <Link
                  href="/inventory"
                  className="inline-flex items-center gap-2 bg-primary text-white font-semibold text-sm px-6 py-3.5 rounded-lg hover:brightness-110 transition-all shadow-md"
                >
                  Browse cars
                  <span className="material-symbols-outlined text-lg">arrow_forward</span>
                </Link>
                <button
                  type="button"
                  onClick={handleUseLocation}
                  className="inline-flex items-center gap-2 bg-white text-on-surface font-semibold text-sm px-6 py-3.5 rounded-lg border border-outline-variant/40 shadow-sm hover:shadow-md transition-all"
                >
                  <span className="material-symbols-outlined text-lg text-secondary">my_location</span>
                  Use my location
                </button>
              </div>

            </div>

            <div className="relative rounded-2xl overflow-hidden aspect-[4/5] lg:aspect-auto lg:min-h-[520px] shadow-[0_12px_40px_rgba(0,0,0,0.12)]">
              <img
                src="https://res.cloudinary.com/vdofesxh/image/upload/f_auto,q_auto/v1784193326/utrust_assets/hero/hero_main_new.jpg"
                alt="Toyota certified used vehicles showroom"
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 text-white">
                <p className="text-xl md:text-2xl font-bold mb-1">Cars near {searchLocation}</p>
                <p className="text-sm md:text-base text-white/80">Start with the closest available inventory.</p>
              </div>
            </div>
          </div>

          <div className="hero-search-bar mt-8 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl border border-black/[0.08] bg-white p-2 shadow-[0_12px_32px_rgba(0,0,0,0.09)] sm:grid-cols-2 lg:grid-cols-[1.1fr_1.25fr_1.1fr_1.1fr_auto]">
            <div className="hero-search-field min-w-0 border-b border-black/[0.08] px-4 py-3 sm:border-r lg:border-b-0">
              <label className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-secondary/60"><span className="material-symbols-outlined text-sm">location_on</span>Location</label>
              <select value={searchLocation} onChange={(e) => setSearchLocation(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent border-none p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0 cursor-pointer">
                <option value="Cochin">Cochin</option><option value="Trivandrum">Trivandrum</option><option value="Calicut">Calicut</option><option value="Thrissur">Thrissur</option><option value="Kottayam">Kottayam</option>
              </select>
            </div>
            <div className="hero-search-field min-w-0 border-b border-black/[0.08] px-4 py-3 lg:border-b-0 lg:border-r">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary/60">Make / model</label>
              <select value={searchModel} onChange={(e) => setSearchModel(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent border-none p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0 cursor-pointer">
                <option value="">Any make</option>{dynamicModels.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div className="hero-search-field min-w-0 border-b border-black/[0.08] px-4 py-3 sm:border-r lg:border-b-0">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary/60">Body type</label>
              <select value={searchBodyType} onChange={(e) => setSearchBodyType(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent border-none p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0 cursor-pointer">
                <option value="">Any body type</option>{dynamicBodyTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div className="hero-search-field min-w-0 border-b border-black/[0.08] px-4 py-3 sm:border-b-0 lg:border-r">
              <label className="block text-[11px] font-semibold uppercase tracking-wide text-secondary/60">Budget</label>
              <select value={searchBudget} onChange={(e) => setSearchBudget(e.target.value)} className="mt-1 block w-full min-w-0 bg-transparent border-none p-0 text-sm font-semibold text-on-surface outline-none focus:ring-0 cursor-pointer">
                <option value="">Any budget</option><option value="0-10">Under ₹10L</option><option value="10-25">₹10L - ₹25L</option><option value="25-200">Over ₹25L</option>
              </select>
            </div>
            <button type="button" onClick={handleSearch} className="mt-2 flex min-h-14 items-center justify-center gap-2 rounded-xl bg-primary px-7 text-sm font-bold text-white transition-transform hover:brightness-110 active:scale-[0.98] sm:col-span-2 lg:col-span-1 lg:mt-0">
              <span className="material-symbols-outlined text-lg">search</span>Search cars
            </button>
          </div>
        </div>
      </header>

      {/* Infinite Marquee Strip */}
      <div className="w-full overflow-hidden bg-surface border-b border-outline-variant py-6 flex items-center relative">
        <div className="flex animate-marquee whitespace-nowrap" style={{ width: 'max-content' }}>
          {[1, 2, 3, 4].map((_, i) => (
            <div key={i} className="flex items-center space-x-12 px-6">
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">verified</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Certified Pre-Owned</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
              
              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">assignment_turned_in</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">203-Point Inspection</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">sell</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Instant Valuation</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">analytics</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Fair Market Price</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">account_balance</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Easy Financing</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">visibility_off</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">No Hidden Fees</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">local_shipping</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Doorstep Delivery</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">verified_user</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">1-Year Warranty</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">swap_horiz</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Easy Exchange</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>

              <div className="flex items-center gap-4">
                <span className="material-symbols-outlined text-primary bg-primary/5 rounded-full p-2 text-[24px]">directions_car</span>
                <span className="font-bold text-[16px] uppercase tracking-wide text-secondary">Test Drive Anywhere</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-outline-variant"></div>
            </div>
          ))}
        </div>
      </div>
      {/* The Nippon Promise */}
      <section className={`${styles.promiseSection} pt-10 pb-6`}>
        <div className="px-4 md:px-8 max-w-[1440px] mx-auto">
          <div className="max-w-3xl mb-10 md:mb-12">
            <p className="font-label-bold text-label-bold uppercase tracking-[0.22em] text-primary mb-5">Confidence, built in</p>
            <h2 className="font-headline-lg text-headline-md md:text-headline-lg uppercase text-secondary tracking-tight mb-5">
              The Nippon Promise
            </h2>
            <p className="font-body-md text-body-md text-secondary/70 max-w-2xl leading-relaxed">
              Every vehicle comes with the checks, cover and clarity you need to buy or sell with confidence.
            </p>
          </div>

          <div className={`${styles.promiseGrid} grid grid-cols-1 md:grid-cols-12 gap-3 md:gap-4`}>
            {[
              { title: '203-Point Inspection', copy: 'A rigorous check of every vehicle before it reaches you.', Icon: ClipboardCheck, href: '/about#certification-protocol', tone: 'lead' },
              { title: 'Comprehensive Warranty', copy: 'Manufacturer-backed cover for the road ahead.', Icon: ShieldCheck, href: '/about#ucars-promise', tone: 'dark' },
              { title: 'Transparent History', copy: 'Know the story behind every car.', Icon: History, href: '/about#brand-story', tone: 'soft' },
              { title: 'Flexible Financing', copy: 'Simple options that fit your plans.', Icon: Landmark, href: '/about#ucars-promise', tone: 'dark' },
              { title: 'Roadside Assistance', copy: 'Support whenever you need it.', Icon: CarFront, href: '/about#ucars-promise', tone: 'light' },
              { title: 'Instant Valuation', copy: 'See what your current car is worth.', Icon: Tag, href: '/sell', tone: 'soft' },
            ].map((item, index) => (
              <article key={item.title} className={`${styles.promiseCard} ${styles[item.tone]} ${index === 0 ? 'md:col-span-5' : index === 1 ? 'md:col-span-4' : index === 2 ? 'md:col-span-3' : 'md:col-span-4'} group`}>
                <div className={styles.promiseIconRing} aria-hidden="true">
                  <item.Icon className={styles.promiseIcon} strokeWidth={1.5} aria-hidden="true" />
                </div>
                <div className={`${styles.promiseCardBody} relative z-10 flex h-full min-h-[220px] flex-col justify-between p-6 md:p-7`}>
                  <div>
                    <span className={styles.promiseIndex}>0{index + 1}</span>
                    <h3 className="mt-5 max-w-[calc(100%-8.75rem)] font-headline-md text-headline-md uppercase leading-[0.96] tracking-tight">{item.title}</h3>
                  </div>
                  <div className="flex items-end justify-between gap-5">
                    <p className="max-w-[24ch] text-sm leading-relaxed opacity-70">{item.copy}</p>
                    <Link href={item.href} aria-label={`Learn more about ${item.title}`} className={styles.promiseLink}>
                      <span className="material-symbols-outlined" aria-hidden="true">arrow_outward</span>
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Cars Grid */}
      <section className="pt-12 pb-24 bg-white">
        <div className="px-4 md:px-8 w-full max-w-full mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-baseline mb-12 border-b border-outline-variant pb-6">
            <div>
              <span className="text-primary font-label-bold text-label-bold tracking-[0.2em] uppercase">Handpicked Selection</span>
              <h2 className="font-headline-lg text-headline-lg mt-2 uppercase text-secondary">Featured Nippon Certified</h2>
            </div>
            <Link href="/inventory" className="flex items-center gap-2 font-label-bold text-label-bold text-primary group uppercase mt-4 md:mt-0">
              VIEW ALL INVENTORY <span className="material-symbols-outlined group-hover:translate-x-2 transition-transform">arrow_forward</span>
            </Link>
          </div>
          
          <div className="flex flex-wrap justify-center gap-8">
            {isLoadingFeatured ? (
              // Skeletons
              Array.from({ length: 5 }).map((_, i) => (
                <article key={i} className="bg-white rounded-xl overflow-hidden border border-outline-variant animate-pulse h-[450px] w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] xl:w-[calc(20%-1.6rem)]">
                  <div className="w-full h-72 bg-surface-container-high" />
                  <div className="p-8"><div className="h-4 bg-surface-container-high mb-4 w-1/2" /></div>
                </article>
              ))
            ) : featuredCars.length > 0 ? (
              reorderForCenter(featuredCars).map(car => {
                const specs = parseSpecs(car.specs);
                const coverImage = car.frames?.[0] || 'https://res.cloudinary.com/vdofesxh/image/upload/f_auto,q_auto/v1784191696/utrust_assets/utrust_asset_page_0.jpg';
                return (
                  <article key={car.id} className="group bg-white rounded-2xl overflow-hidden border border-black/[0.08] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[0_18px_36px_rgba(32,32,32,0.12)] shadow-[0_5px_14px_rgba(32,32,32,0.05)] w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.333rem)] xl:w-[calc(20%-1.6rem)] flex-shrink-0">
                    <div className="relative h-56 overflow-hidden bg-[#f1f2f3]">
                      <img className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-[1.03]" alt={car.name} src={coverImage} />
                      <div className="absolute inset-x-3 top-3 flex items-center justify-between">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-secondary shadow-sm backdrop-blur-sm">
                          <span className="material-symbols-outlined text-primary text-[15px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                          Certified
                        </span>

                      </div>
                    </div>
                    <div className="p-5">
                      <div className="mb-5 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h4 className="font-headline-md text-[22px] leading-[0.96] uppercase tracking-tight text-secondary">{car.name}</h4>
                          <p className="mt-2 truncate text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary/45">{specs.engine || specs.brand || 'Certified pre-owned'}</p>
                        </div>
                        <p className="shrink-0 text-[22px] font-bold leading-none tracking-tight text-primary">{car.price || 'N/A'}</p>
                      </div>
                      <div className="mb-5 grid grid-cols-3 divide-x divide-black/[0.1] border-y border-black/[0.1] py-3">
                        <div className="px-2 first:pl-0">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Year</span>
                          <span className="block text-sm font-semibold text-secondary">{specs.year || 'N/A'}</span>
                        </div>
                        <div className="px-2">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Mileage</span>
                          <span className="block truncate text-sm font-semibold text-secondary">{specs.km ? `${specs.km} km` : 'N/A'}</span>
                        </div>
                        <div className="px-2 last:pr-0">
                          <span className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-secondary/45">Gearbox</span>
                          <span className="block truncate text-sm font-semibold text-secondary">{specs.transmission || 'Auto'}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <Link href={`/inventory/detail?id=${car.id}`} className="flex items-center justify-center rounded-lg border border-secondary px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.06em] text-secondary transition-colors hover:bg-secondary hover:text-white active:scale-[0.98]">
                          View details
                        </Link>
                        <Link href={`/enquiry?id=${car.id}`} className="flex items-center justify-center rounded-lg bg-primary px-3 py-3 text-center text-xs font-bold uppercase tracking-[0.06em] text-white transition-transform hover:brightness-110 active:scale-[0.98]">
                          Contact dealer
                        </Link>
                      </div>
                      <button type="button" onClick={() => setOfferCar(car)} className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-primary/30 bg-primary/[0.06] px-4 py-3 text-xs font-bold uppercase tracking-[0.08em] text-primary transition-colors hover:bg-primary hover:text-white active:scale-[0.98]">
                        Add your best price
                        <span className="material-symbols-outlined text-[17px]">sell</span>
                      </button>
                    </div>
                  </article>
                );
              })
            ) : (
              <div className="col-span-full py-12 text-center text-secondary/50 font-label-bold uppercase tracking-widest">
                No featured cars available.
              </div>
            )}
          </div>
        </div>
      </section>

      {offerCar && (
        <OfferModal
          car={offerCar}
          onClose={() => setOfferCar(null)}
          onSendOtp={handleSendOfferOtp}
          onVerifyOtp={handleVerifyOfferOtp}
          onSubmitOffer={handleSubmitOffer}
        />
      )}

      {/* Sell/Exchange CTA */}
      <section className="bg-[#f3f4f5] px-4 py-16 md:px-8 md:py-20">
        <div className="mx-auto max-w-[1280px] overflow-hidden rounded-2xl bg-white shadow-[0_16px_42px_rgba(32,32,32,0.08)]">
          <div className="grid items-stretch md:grid-cols-[1.25fr_0.75fr]">
            <div className="flex flex-col justify-center p-8 md:p-12 lg:p-16">
              <span className="mb-5 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">Your next move starts here</span>
              <h2 className="max-w-[12ch] font-headline-xl text-headline-xl uppercase leading-[0.95] tracking-tight text-secondary">
                Sell with confidence. Move forward.
              </h2>
              <p className="mt-6 max-w-xl font-body-lg text-body-lg leading-relaxed text-secondary/70">
                Get a transparent valuation for your current car, then choose your next certified vehicle with less waiting and less uncertainty.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Link href="/sell" className="inline-flex items-center justify-center gap-3 rounded-lg bg-primary px-7 py-4 text-sm font-bold uppercase tracking-[0.1em] text-white shadow-[0_8px_18px_rgba(190,0,24,0.2)] transition-transform hover:brightness-110 active:scale-[0.98]">
                  Get your valuation
                  <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
                </Link>
                <span className="text-sm font-medium text-secondary/50">Clear pricing. No pressure.</span>
              </div>
            </div>
            <div className="relative flex min-h-[250px] items-end overflow-hidden bg-primary p-8 md:min-h-[360px] md:p-10">
              <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full border border-white/20" />
              <div className="absolute -right-2 -top-2 h-40 w-40 rounded-full border border-white/15" />
              <div className="relative z-10 max-w-[14ch] text-3xl font-bold uppercase leading-[0.95] tracking-tight text-white md:text-4xl">
                Trade in. Upgrade. Drive on.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-primary bg-[#17181a] text-white">
        <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-12 px-6 py-16 md:grid-cols-[1.35fr_0.8fr_0.8fr_1.1fr] md:px-10 lg:py-20">
          <div className="max-w-xs">
            <div className="mb-6 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary text-lg font-bold text-white">N</span>
              <span className="font-headline-md text-headline-md font-semibold uppercase tracking-tight text-white">Nippon Used Cars</span>
            </div>
            <p className="font-body-md text-body-md leading-relaxed text-white/70">
              Certified pre-owned cars with a clearer history, careful inspection and support beyond the sale.
            </p>
            <div className="mt-8 flex gap-3">
              <Link href="#" aria-label="Website" className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white/75 transition-colors hover:border-primary hover:bg-primary hover:text-white">
                <span className="material-symbols-outlined text-base">public</span>
              </Link>
              <Link href="#" aria-label="Email" className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white/75 transition-colors hover:border-primary hover:bg-primary hover:text-white">
                <span className="material-symbols-outlined text-base">alternate_email</span>
              </Link>
              <Link href="#" aria-label="Share" className="grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white/75 transition-colors hover:border-primary hover:bg-primary hover:text-white">
                <span className="material-symbols-outlined text-base">share</span>
              </Link>
            </div>
          </div>
          <div>
            <h5 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Services</h5>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="/about" className="transition-colors hover:text-white">About U-CARS</Link></li>
              <li><Link href="/certified" className="transition-colors hover:text-white">203-Point Inspection</Link></li>
              <li><Link href="/warranty" className="transition-colors hover:text-white">Warranty Policy</Link></li>
              <li><Link href="/privacy" className="transition-colors hover:text-white">Privacy Policy</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Support</h5>
            <ul className="space-y-3 text-sm text-white/70">
              <li><Link href="/contact" className="transition-colors hover:text-white">Contact Us</Link></li>
              <li><Link href="/terms" className="transition-colors hover:text-white">Terms of Use</Link></li>
              <li><Link href="/faqs" className="transition-colors hover:text-white">FAQs</Link></li>
              <li><Link href="/locator" className="transition-colors hover:text-white">Store Locator</Link></li>
            </ul>
          </div>
          <div>
            <h5 className="mb-5 text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Stay in the loop</h5>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-white/70">Get new arrivals and helpful ownership updates in your inbox.</p>
            <div className="flex rounded-lg bg-white/[0.06] p-1 ring-1 ring-white/10 focus-within:ring-primary">
              <input type="email" placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-white outline-none placeholder:text-white/45" />
              <button aria-label="Subscribe" className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-primary text-white transition-transform hover:brightness-110 active:scale-[0.97]">
                <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1280px] flex-col items-start justify-between gap-4 px-6 py-6 text-xs text-white/45 md:flex-row md:items-center md:px-10">
            <span>© 2024 Nippon Used Cars. All rights reserved.</span>
            <div className="flex gap-6 font-bold uppercase tracking-[0.16em]">
              <Link href="/terms" className="transition-colors hover:text-white">Legal</Link>
              <Link href="/sitemap" className="transition-colors hover:text-white">Sitemap</Link>
              <Link href="/cookies" className="transition-colors hover:text-white">Cookies</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
