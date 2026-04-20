import { Link } from "react-router-dom";
import { HiOutlineCreditCard } from "react-icons/hi";
import Navbar from "../components/layout/navbar";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Navbar */}
        <Navbar />

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 pt-20 bg-white">
        <div className="mb-6">
          <div className="icon-badge w-24 h-24 rounded-3xl mx-auto">
            <HiOutlineCreditCard className="text-5xl" />
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          One card for all your links
        </h1>

        <p className="text-gray-700 max-w-xl mb-6">
          Create your digital card, share your profile, and connect instantly
          with one simple tap or scan.
        </p>

        <p className="text-[#DE3A16] font-medium mb-8">ecard.app/your-name</p>

        <div className="flex gap-4">
          <Link
            to="/register"
            className="bg-[#DE3A16] text-white px-6 py-3 rounded-lg hover:bg-brand-700 transition-colors"
          >
            Sign Up
          </Link>

          <Link
            to="/login"
            className="border border-[#DE3A16] text-[#DE3A16] px-6 py-3 rounded-lg hover:bg-[#DE3A16] hover:text-white transition-colors"
          >
            Sign In
          </Link>
        </div>
      </main>
    </div>
  );
}
