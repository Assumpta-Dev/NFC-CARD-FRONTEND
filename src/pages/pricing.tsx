// ===========================================================
// PRICING PAGE — Subscription Plans with Monthly/Annual Toggle
// ===========================================================

import { useState } from "react";
import Navbar from "../components/layout/navbar";

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
     <div className="min-h-screen bg-white flex flex-col">
          {/* Navbar */}
            <Navbar />
    <div className="min-h-screen bg-white text-gray-900 px-6 py-12 pt-20">
       
      <div className="max-w-6xl mx-auto">
        {/* Heading */}
        <h1 className="text-3xl font-bold text-center mb-2">
          Subscription Prices
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Choose the plan that fits your needs
        </p>

        {/* Toggle */}
        <div className="flex justify-center mb-12">
          <div className="card-soft p-1 rounded-full flex border-[#DE3A16]">
            <button
              onClick={() => setIsAnnual(false)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                !isAnnual ? "bg-[#DE3A16] text-white" : "text-gray-600"
              }`}
            >
              Monthly
            </button>

            <button
              onClick={() => setIsAnnual(true)}
              className={`px-6 py-2 rounded-full text-sm font-medium transition ${
                isAnnual ? "bg-[#DE3A16] text-white" : "text-gray-600"
              }`}
            >
              Annual
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-3 gap-8">
          {/* FREE PLAN */}
          <div className="card-soft-hover p-6 border-[#DE3A16]">
            <h2 className="text-xl font-semibold mb-2">Free</h2>
            <p className="text-gray-600 mb-4">Basic features</p>

            <div className="text-3xl font-bold mb-4">$0</div>

            <ul className="text-sm text-gray-700 space-y-2 mb-6">
              <li>✔ 1 Digital Card</li>
              <li>✔ Basic Profile</li>
              <li>✔ QR Code</li>

              {isAnnual && (
                <li className="text-green-400">
                  ✔ +1 Free Card (Annual Bonus)
                </li>
              )}
            </ul>

            <button className="w-full py-2 bg-[#DE3A16] text-white rounded-lg hover:bg-brand-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* PLUS PLAN */}
          <div className="card-soft-hover p-6 border-[#DE3A16] scale-105">
            <h2 className="text-xl font-semibold mb-2">Plus</h2>
            <p className="text-gray-600 mb-4">For professionals</p>

            <div className="text-3xl font-bold mb-4">
              {isAnnual ? "$50/yr" : "$5/mo"}
            </div>

            <ul className="text-sm text-gray-700 space-y-2 mb-6">
              <li>✔ Unlimited Cards</li>
              <li>✔ Analytics</li>
              <li>✔ Custom Links</li>

              {isAnnual && <li className="text-green-400">✔ +3 Bonus Cards</li>}
            </ul>

            <button className="w-full py-2 bg-[#DE3A16] text-white rounded-lg hover:bg-brand-700 transition-colors">
              Upgrade
            </button>
          </div>

          {/* BUSINESS PLAN */}
          <div className="card-soft-hover p-6 border-[#DE3A16]">
            <h2 className="text-xl font-semibold mb-2">Business</h2>
            <p className="text-gray-600 mb-4">For teams</p>

            <div className="text-3xl font-bold mb-4">
              {isAnnual ? "$120/yr" : "$12/mo"}
            </div>

            <ul className="text-sm text-gray-700 space-y-2 mb-6">
              <li>✔ Team Management</li>
              <li>✔ Admin Dashboard</li>
              <li>✔ Priority Support</li>

              {isAnnual && (
                <li className="text-green-400">✔ +10 Extra Cards</li>
              )}
            </ul>

            <button className="w-full py-2 bg-[#DE3A16] text-white rounded-lg hover:bg-brand-700 transition-colors">
              Contact Sales
            </button>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
