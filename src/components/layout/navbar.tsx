// ===========================================================
// NAVBAR — Top navigation for public pages
// ===========================================================

import { Link } from "react-router-dom";
import { HiOutlineCreditCard } from "react-icons/hi";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-[#DE3A16] px-6 py-4 fixed top-0 z-50">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <div className="icon-badge w-8 h-8 rounded-lg">
            <HiOutlineCreditCard className="text-lg" />
          </div>
          <span className="text-gray-900 font-bold">E-Card</span>
        </Link>

        {/* Links */}
        <div className="hidden md:flex items-center gap-6 text-sm text-gray-600">
          <Link to="/" className="hover:text-gray-900">
            Home
          </Link>
          <Link to="/pricing" className="hover:text-gray-900">
            Pricing
          </Link>
          <Link to="/support" className="hover:text-gray-900">
            Support
          </Link>
        </div>

        {/* Auth buttons */}
        <div className="flex items-center gap-3">
          <Link to="/login" className="text-sm text-gray-700 hover:text-gray-900">
            Login
          </Link>
          <Link
            to="/register"
            className="bg-[#DE3A16] px-4 py-2 rounded-lg text-sm text-white hover:bg-brand-700 transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}
