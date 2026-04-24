import { useState } from "react";
import Navbar from "../components/layout/navbar";
import { HiOutlineMail, HiOutlineUser, HiOutlinePhone } from "react-icons/hi";

export default function ContactSalesPage() {
  const [formData, setFormData] = useState({ name: "", email: "", phone: "" });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate submission
    setTimeout(() => {
        setIsSubmitted(true);
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />

      <div className="flex-grow flex items-center justify-center px-4 py-20 pt-32">
        <div className="card-soft w-full max-w-lg p-8 rounded-3xl bg-white border-[#DE3A16] shadow-xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Contact Sales</h1>
            <p className="text-sm text-gray-600 mt-2">
              Interested in our Business plan? Fill out the form below and our team will get back to you shortly.
            </p>
          </div>

          {isSubmitted ? (
            <div className="text-center p-6 bg-green-50 rounded-2xl border border-green-100">
              <h2 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h2>
              <p className="text-sm text-green-700">Thank you for reaching out. A sales representative will contact you soon.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="name" className="text-xs font-semibold text-gray-700 uppercase tracking-widest ml-1">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiOutlineUser className="text-lg" />
                  </span>
                  <input
                    id="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#DE3A16] focus:border-[#DE3A16] pl-10 pr-4 py-3 outline-none transition-all"
                    placeholder="Your name"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-gray-700 uppercase tracking-widest ml-1">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiOutlineMail className="text-lg" />
                  </span>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#DE3A16] focus:border-[#DE3A16] pl-10 pr-4 py-3 outline-none transition-all"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-semibold text-gray-700 uppercase tracking-widest ml-1">
                  Phone Number
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                    <HiOutlinePhone className="text-lg" />
                  </span>
                  <input
                    id="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-gray-50 border border-gray-200 text-gray-900 text-sm rounded-xl focus:ring-[#DE3A16] focus:border-[#DE3A16] pl-10 pr-4 py-3 outline-none transition-all"
                    placeholder="(555) 000-0000"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-[#DE3A16] hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-md shadow-[#DE3A16]/20 mt-6"
              >
                Submit Request
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
