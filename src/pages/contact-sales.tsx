import { useState } from "react";
import { PublicLayout } from "../components/layout/PublicLayout";
import { Alert, Button, formControlClass, formLabelCompactClass } from "../components/ui";
import { IconMail, IconPhone, IconStorefront, IconUser } from "../components/icons/DashboardIcons";

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
  };

  return (
    <PublicLayout>
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid items-start gap-12 lg:grid-cols-2">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Contact sales
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Let&apos;s talk about your business
            </h1>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Interested in the Business plan, bulk cards, or a custom hospitality
              setup? Tell us about your needs and we&apos;ll get back to you within
              one business day.
            </p>

            <div className="mt-8 space-y-4">
              {[
                "Dedicated onboarding for hotels & restaurants",
                "Bulk NFC card provisioning",
                "Custom branding and multi-location setup",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                  {item}
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-gray-100/80 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-900/50">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Prefer email?
              </p>
              <a
                href="mailto:icumutechltd@gmail.com"
                className="mt-1 text-sm text-brand-600 dark:text-brand-400"
              >
                icumutechltd@gmail.com
              </a>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100/80 bg-white p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-[0_8px_30px_rgba(0,0,0,0.2)] sm:p-8">
            {isSubmitted ? (
              <Alert
                type="success"
                message="Thank you! Our team will contact you shortly."
                className="text-center"
              />
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-brand-500/15 bg-gradient-to-br from-brand-500/[0.08] to-transparent text-brand-600 dark:text-brand-400">
                    <IconStorefront size={20} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Request a callback
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      All fields required
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="name" className={formLabelCompactClass}>
                    Full name
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <IconUser size={18} />
                    </span>
                    <input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className={formControlClass(false, "pl-11")}
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="email" className={formLabelCompactClass}>
                    Work email
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <IconMail size={18} />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={formControlClass(false, "pl-11")}
                      placeholder="you@company.com"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="phone" className={formLabelCompactClass}>
                    Phone number
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                      <IconPhone size={18} />
                    </span>
                    <input
                      id="phone"
                      type="tel"
                      required
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={formControlClass(false, "pl-11")}
                      placeholder="0788123456"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="message" className={formLabelCompactClass}>
                    How can we help?
                  </label>
                  <textarea
                    id="message"
                    rows={3}
                    value={formData.message}
                    onChange={(e) =>
                      setFormData({ ...formData, message: e.target.value })
                    }
                    className={formControlClass(false, "resize-none")}
                    placeholder="Tell us about your business and what you're looking for..."
                  />
                </div>

                <Button type="submit" fullWidth className="mt-2 py-3">
                  Submit request
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
