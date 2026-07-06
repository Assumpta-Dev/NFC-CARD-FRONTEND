import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Button, IconShell } from "../components/ui";
import {
  heroSlides,
  marketingImages,
  storyBlocks,
} from "../constants/marketingImages";
import {
  IconChevronLeft,
  IconChevronRight,
  IconNfcTap,
  IconOrders,
  IconQrCode,
  IconRadar,
  IconSparkline,
} from "../components/icons/DashboardIcons";

const GALLERY = [
  { src: marketingImages.tapToConnect, label: "Tap to connect" },
  { src: marketingImages.connectUnlimited, label: "Unlimited reach" },
  { src: marketingImages.tapOrScanOrder, label: "Scan to order" },
  { src: marketingImages.viewMenuOrder, label: "Digital menu" },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [fading, setFading] = useState(false);

  const goTo = useCallback((index: number) => {
    if (fading || index === current) return;
    setFading(true);
    window.setTimeout(() => {
      setCurrent(index);
      setFading(false);
    }, 350);
  }, [current, fading]);

  const next = useCallback(() => {
    goTo((current + 1) % heroSlides.length);
  }, [current, goTo]);

  const prev = useCallback(() => {
    goTo((current - 1 + heroSlides.length) % heroSlides.length);
  }, [current, goTo]);

  useEffect(() => {
    const timer = window.setInterval(next, 6000);
    return () => window.clearInterval(timer);
  }, [next]);

  const slide = heroSlides[current];

  return (
    <section className="relative mx-6 mt-2 overflow-hidden rounded-[1.75rem] border border-gray-200/60 shadow-[0_32px_80px_rgba(15,23,42,0.14)] dark:border-gray-800 dark:shadow-[0_32px_80px_rgba(0,0,0,0.45)] sm:mx-auto sm:max-w-6xl">
      <div className="relative aspect-[4/5] max-h-[min(88vh,780px)] w-full sm:aspect-[16/9] sm:max-h-[720px]">
        {heroSlides.map((s, i) => (
          <img
            key={s.image}
            src={s.image}
            alt=""
            aria-hidden={i !== current}
            className={`absolute inset-0 h-full w-full object-cover object-center transition-all duration-700 ease-out ${
              i === current
                ? fading
                  ? "scale-105 opacity-0"
                  : "scale-100 opacity-100"
                : "scale-100 opacity-0"
            }`}
          />
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/55 to-gray-950/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950/40 via-transparent to-transparent" />

        <div
          className={`absolute inset-0 z-10 flex flex-col justify-end px-6 pb-24 pt-16 sm:px-12 sm:pb-14 lg:max-w-2xl lg:justify-center lg:pb-16 transition-opacity duration-300 ${
            fading ? "opacity-0" : "opacity-100"
          }`}
        >
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-400">
            {slide.eyebrow}
          </p>
          <h1 className="text-3xl font-bold leading-[1.08] tracking-tight text-white sm:text-4xl lg:text-5xl">
            {slide.title}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-white/75 sm:text-lg">
            {slide.subtitle}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/register">
              <Button className="px-7 py-3 shadow-lg shadow-brand-500/25">
                Get started free
              </Button>
            </Link>
            <Link to="/pricing">
              <Button
                variant="secondary"
                className="border-white/20 bg-white/10 px-7 py-3 text-white backdrop-blur-sm hover:bg-white/20"
              >
                View pricing
              </Button>
            </Link>
          </div>
        </div>

        <button
          type="button"
          onClick={prev}
          className="absolute left-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/45"
          aria-label="Previous slide"
        >
          <IconChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={next}
          className="absolute right-4 top-1/2 z-20 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/25 text-white backdrop-blur-md transition hover:bg-black/45"
          aria-label="Next slide"
        >
          <IconChevronRight size={20} />
        </button>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === current ? "w-8 bg-brand-500" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function ImageGallery() {
  return (
    <section className="py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              See it in action
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
              One card. Many ways to connect.
            </h2>
          </div>
          <p className="max-w-md text-sm text-gray-500 dark:text-gray-400">
            Tap, scan, share, and order — E-Card adapts to how your customers already use their phones.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {GALLERY.map((item, index) => (
            <div
              key={item.src}
              className={`group relative overflow-hidden rounded-2xl border border-gray-100/80 dark:border-gray-800 ${
                index === 0 ? "col-span-2 row-span-2 aspect-[4/3]" : "aspect-square"
              }`}
            >
              <img
                src={item.src}
                alt={item.label}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-950/80 via-gray-950/10 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-sm font-semibold text-white">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StorySection({
  block,
  reversed,
}: {
  block: (typeof storyBlocks)[number];
  reversed?: boolean;
}) {
  return (
    <div
      className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-14 ${
        reversed ? "lg:[&>*:first-child]:order-2" : ""
      }`}
    >
      <div className="relative overflow-hidden rounded-2xl border border-gray-100/80 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:border-gray-800 dark:shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-gray-900">
          <img
            src={block.image}
            alt={block.title}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        <div className="absolute left-4 top-4 rounded-full border border-white/20 bg-black/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">
          {block.tag}
        </div>
      </div>

      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-600 dark:text-brand-400">
          {block.tag}
        </p>
        <h3 className="mt-2 text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-3xl">
          {block.title}
        </h3>
        <p className="mt-4 text-base leading-7 text-gray-600 dark:text-gray-400">
          {block.description}
        </p>
        <ul className="mt-6 space-y-3">
          {block.points.map((point) => (
            <li
              key={point}
              className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300"
            >
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <PublicLayout>
      <HeroCarousel />

      <ImageGallery />

      <section className="border-y border-gray-100 bg-gray-50/60 py-16 dark:border-gray-800 dark:bg-gray-900/40 sm:py-24">
        <div className="mx-auto max-w-6xl space-y-20 px-6 sm:space-y-28">
          {storyBlocks.map((block, i) => (
            <StorySection key={block.title} block={block} reversed={i % 2 === 1} />
          ))}
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-3xl border border-gray-100/80 dark:border-gray-800">
            <div className="grid lg:grid-cols-2">
              <div className="relative min-h-[280px] lg:min-h-full">
                <img
                  src={marketingImages.orderInClicks}
                  alt="Fast mobile ordering"
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-gray-950/20 lg:bg-gradient-to-l lg:from-gray-950/30 lg:to-transparent" />
              </div>
              <div className="flex flex-col justify-center bg-gray-950 p-8 text-white sm:p-12">
                <IconShell
                  icon={<IconSparkline size={20} />}
                  accent="brand"
                  size="sm"
                  className="mb-5"
                />
                <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Analytics that prove your card works
                </h2>
                <p className="mt-4 text-gray-400">
                  Track scans, devices, orders, and earnings from one dashboard —
                  so every tap becomes measurable growth.
                </p>
                <div className="mt-8 grid grid-cols-2 gap-3">
                  {[
                    { icon: <IconRadar size={18} />, label: "Scan analytics" },
                    { icon: <IconOrders size={18} />, label: "Order pipeline" },
                    { icon: <IconNfcTap size={18} />, label: "Per-card stats" },
                    { icon: <IconQrCode size={18} />, label: "QR & NFC ready" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-2.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm"
                    >
                      <span className="text-brand-400">{item.icon}</span>
                      {item.label}
                    </div>
                  ))}
                </div>
                <Link to="/register" className="mt-8 inline-block w-fit">
                  <Button
                    variant="ghost"
                    className="!bg-white !text-gray-900 shadow-sm hover:!bg-gray-100 dark:!bg-white dark:!text-gray-900 dark:hover:!bg-gray-100"
                  >
                    Open your dashboard
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-6xl px-6">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 to-brand-700 px-8 py-14 text-center text-white sm:px-16">
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-black/10 blur-2xl" />
            <h2 className="relative text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to make every tap count?
            </h2>
            <p className="relative mx-auto mt-4 max-w-lg text-white/80">
              Join professionals and businesses across Rwanda using E-Card to
              connect smarter and sell faster.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link to="/register">
                <Button
                  variant="ghost"
                  className="!bg-white !text-brand-700 shadow-sm hover:!bg-gray-100 dark:!bg-white dark:!text-brand-700 dark:hover:!bg-gray-100 px-8 py-3"
                >
                  Create free account
                </Button>
              </Link>
              <Link to="/contact-sales">
                <Button
                  variant="ghost"
                  className="!border !border-white/30 !bg-white/10 px-8 py-3 !text-white hover:!bg-white/20"
                >
                  Talk to sales
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
