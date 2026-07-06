import { Link } from "react-router-dom";
import { IconNfcTap } from "../icons/DashboardIcons";
import { IconShell } from "../ui";

export function MarketingFooter() {
  return (
    <footer className="border-t border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <div className="grid gap-10 md:grid-cols-[1.4fr_0.8fr_0.8fr]">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <IconShell icon={<IconNfcTap size={18} />} accent="brand" size="sm" />
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-gray-100">
                E-Card
              </span>
            </div>
            <p className="max-w-md text-sm leading-7 text-gray-500 dark:text-gray-400">
              Smart NFC cards for professionals and businesses. Share your profile,
              accept orders, and grow your network with every tap.
            </p>
          </div>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Product
            </p>
            <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Link to="/pricing" className="transition hover:text-brand-600 dark:hover:text-brand-400">
                Pricing
              </Link>
              <Link to="/support" className="transition hover:text-brand-600 dark:hover:text-brand-400">
                Support
              </Link>
              <Link to="/contact-sales" className="transition hover:text-brand-600 dark:hover:text-brand-400">
                Contact Sales
              </Link>
            </div>
          </div>

          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400">
              Account
            </p>
            <div className="flex flex-col gap-3 text-sm text-gray-600 dark:text-gray-400">
              <Link to="/login" className="transition hover:text-brand-600 dark:hover:text-brand-400">
                Sign in
              </Link>
              <Link to="/register" className="transition hover:text-brand-600 dark:hover:text-brand-400">
                Create account
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} E-Card. All rights reserved.</p>
          <p>
            Powered by{" "}
            <span className="font-medium text-brand-600 dark:text-brand-400">
              Icumu Tech Ltd
            </span>
          </p>
        </div>
      </div>
    </footer>
  );
}
