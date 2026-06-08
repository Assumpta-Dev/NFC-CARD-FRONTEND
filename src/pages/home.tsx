import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/layout/navbar";

const SLIDES = [
  {
    img: "/tap to connect.jpg",
    heading: "Tap to Connect",
    sub: "Share your profile instantly with a single tap — no app needed.",
  },
  {
    img: "/connect unlimitedless.jpg",
    heading: "Connect Without Limits",
    sub: "One card, unlimited connections. Your network grows with every scan.",
  },
  {
    img: "/tap or scan to order.png",
    heading: "Tap or Scan to Order",
    sub: "Customers scan your card and order directly from your digital menu.",
  },
  {
    img: "/order in seconds.jpg",
    heading: "Order in Seconds",
    sub: "A seamless ordering experience — from menu to payment in moments.",
  },
  {
    img: "/order in clicks.jpg",
    heading: "Order in Clicks",
    sub: "Simple, fast, and beautiful. Your business at their fingertips.",
  },
  {
    img: "/view menu to order.jpg",
    heading: "View Menu & Order",
    sub: "Showcase your full menu and let customers order right from the card.",
  },
];

export default function HomePage() {
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (index: number) => {
    if (animating || index === current) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 400);
  };

  // Auto-advance every 5s
  useEffect(() => {
    const timer = setInterval(() => {
      setAnimating(true);
      setTimeout(() => {
        setCurrent((prev) => (prev + 1) % SLIDES.length);
        setAnimating(false);
      }, 400);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />

      <main className="flex-1 bg-white pt-28 pb-16">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-14 px-6">
          <section className="relative overflow-hidden rounded-[2rem] border border-gray-100 bg-slate-950/95 shadow-[0_32px_80px_rgba(15,23,42,0.18)]">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/70 via-slate-950/10 to-slate-950/90" />
            <div className="relative h-[min(72vh,680px)] max-h-[720px] overflow-hidden">
              <img
                src={slide.img}
                alt={slide.heading}
                className="absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500"
                style={{ opacity: animating ? 0 : 1 }}
              />

              <div className="absolute inset-0 bg-slate-950/50" />

              <div
                className="relative z-10 mx-auto flex h-full max-w-6xl flex-col items-center justify-center px-6 text-center text-white"
                style={{
                  opacity: animating ? 0 : 1,
                  transition: "opacity 0.4s ease",
                }}
              >
                <h1 className="mb-5 max-w-3xl text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-5xl">
                  {slide.heading}
                </h1>
                <p className="mb-10 max-w-2xl text-base font-medium text-white/80 sm:text-lg">
                  {slide.sub}
                </p>

                <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                  <Link
                    to="/register"
                    className="btn-primary rounded-full px-8 py-3.5 text-sm shadow-lg shadow-[#DE3A16]/30"
                  >
                    Sign Up
                  </Link>
                  <Link
                    to="/login"
                    className="rounded-full border border-white/20 bg-white/10 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_0_0_2px_rgba(255,255,255,0.18)] backdrop-blur-sm transition duration-200 hover:bg-white hover:text-slate-950"
                  >
                    Sign In
                  </Link>
                </div>
              </div>

              <div className="absolute bottom-6 left-1/2 z-20 flex -translate-x-1/2 gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i === current
                        ? "w-8 bg-[#DE3A16]"
                        : "w-2 bg-white/50 hover:bg-white/80"
                    }`}
                  />
                ))}
              </div>

              <button
                onClick={() =>
                  goTo((current - 1 + SLIDES.length) % SLIDES.length)
                }
                className="absolute left-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white text-2xl backdrop-blur-sm transition hover:bg-black/60"
              >
                ‹
              </button>
              <button
                onClick={() => goTo((current + 1) % SLIDES.length)}
                className="absolute right-4 top-1/2 z-20 -translate-y-1/2 flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white text-2xl backdrop-blur-sm transition hover:bg-black/60"
              >
                ›
              </button>
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-3">
            {[
              {
                title: "Instant share",
                desc: "Let customers tap or scan to connect with your business profile instantly.",
              },
              {
                title: "Order anywhere",
                desc: "Accept menu views, orders, and payments from a single smart card.",
              },
              {
                title: "Built for growth",
                desc: "A modern brand experience that keeps your business looking premium.",
              },
            ].map((item) => (
              <div
                key={item.title}
                className="card-soft p-6 transition-transform duration-300 ease-out hover:-translate-y-2 hover:shadow-[0_16px_40px_rgba(0,0,0,0.12)]"
              >
                <p className="section-label mb-3">Feature</p>
                <h2 className="mb-3 text-xl font-semibold text-gray-900">
                  {item.title}
                </h2>
                <p className="text-sm leading-6 text-gray-600">{item.desc}</p>
              </div>
            ))}
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950 text-slate-200">
        <div className="mx-auto w-full max-w-6xl px-6 py-14">
          <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
            <div className="space-y-4">
              <p className="text-2xl font-semibold text-[#DE3A16]">E-Card</p>
              <p className="max-w-md text-sm leading-7 text-slate-400">
                Smart NFC cards, instant connections, and a modern ordering
                experience designed for growing businesses.
              </p>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Product
              </p>
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <Link to="/pricing" className="transition hover:text-[#DE3A16]">
                  Pricing
                </Link>
                <Link to="/support" className="transition hover:text-[#DE3A16]">
                  Support
                </Link>
                <Link
                  to="/contact-sales"
                  className="transition hover:text-[#DE3A16]"
                >
                  Contact Sales
                </Link>
              </div>
            </div>

            <div>
              <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                Company
              </p>
              <div className="flex flex-col gap-3 text-sm text-slate-300">
                <Link to="/" className="transition hover:text-[#DE3A16]">
                  Home
                </Link>
                <Link to="/login" className="transition hover:text-[#DE3A16]">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="transition hover:text-[#DE3A16]"
                >
                  Get Started
                </Link>
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col gap-4 border-t border-slate-800 pt-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} E-Card. All rights reserved.</p>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span className="text-slate-500">Powered by <span className="text-[#DE3A16] font-medium">Icumu Tech Ltd</span></span>
              <Link to="/" className="transition hover:text-[#DE3A16]">Terms</Link>
              <Link to="/" className="transition hover:text-[#DE3A16]">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
