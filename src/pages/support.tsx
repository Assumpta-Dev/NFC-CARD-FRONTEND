import Navbar from "../components/layout/navbar";

export default function SupportPage() {
  return (
     <div className="min-h-screen bg-white flex flex-col">
          {/* Navbar */}
            <Navbar />
    <div className="min-h-screen bg-white px-6 py-12 pt-20 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Support</h1>

      <p className="text-gray-700 mb-6">Need help? We are here for you.</p>

      <div className="space-y-4">
        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">How do I create a card?</h2>
          <p className="text-sm text-gray-600">
            Sign up and follow the dashboard steps to create your card.
          </p>
        </div>

        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">How do E-cards work?</h2>
          <p className="text-sm text-gray-600">
            Tap your phone on the card or scan the QR code to open your profile.
          </p>
        </div>

        <div className="card-soft-hover p-4 rounded-lg border-[#DE3A16]">
          <h2 className="font-semibold">Contact support</h2>
          <p className="text-sm text-gray-600">Email: support@ecard.com</p>
        </div>
      </div>
    </div>
    </div>
  );
}
