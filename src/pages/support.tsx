import Navbar from "../components/layout/navbar";

export default function SupportPage() {
  return (
     <div className="min-h-screen bg-white dark:bg-gray-900 flex flex-col">
          {/* Navbar */}
            <Navbar />
    <div className="min-h-screen bg-white dark:bg-gray-900 px-6 py-12 pt-20 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Support</h1>

      <p className="text-gray-700 dark:text-gray-300 mb-6">Need help? We are here for you.</p>

      <div className="space-y-4">
        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">How do I create a card?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Sign up and follow the dashboard steps to create your card.
          </p>
        </div>

        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">How do E-cards work?</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Tap your phone on the card or scan the QR code to open your profile.
          </p>
        </div>

        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">Contact support</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">Email: icumutechltd@gmail.com</p>
        </div>
      </div>
    </div>
    </div>
  );
}
