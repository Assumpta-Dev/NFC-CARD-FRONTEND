// ===========================================================
// PUBLIC CARD VIEW PAGE
// ===========================================================
// Renders when someone taps an E-Card or scans a QR code.
// Supports the backend's current public card payload:
//   - unassigned card
//   - personal card
//   - business card
// ===========================================================

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";
import {
  HiOutlineChevronRight,
  HiOutlineGlobe,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineQrcode,
  HiOutlineSearch,
  HiOutlineUserAdd,
} from "react-icons/hi";
import { PageSpinner } from "../../components/ui";
import { cardApi, getErrorMessage } from "../../services/api";
import {
  PublicBusinessProfile,
  PublicCardResponse,
  PublicProfile,
} from "../../types";

const LINK_ICONS: Record<string, JSX.Element> = {
  linkedin: <FaLinkedin className="text-xl text-[#0A66C2]" />,
  twitter: <FaTwitter className="text-xl text-[#1DA1F2]" />,
  instagram: <FaInstagram className="text-xl text-[#E1306C]" />,
  github: <FaGithub className="text-xl text-gray-800" />,
  youtube: <FaYoutube className="text-xl text-[#FF0000]" />,
  tiktok: <FaTiktok className="text-xl text-gray-900" />,
  facebook: <FaFacebook className="text-xl text-[#1877F2]" />,
  custom: <FaLink className="text-xl text-gray-400" />,
};

function ContactRow({
  href,
  icon,
  label,
  value,
  target,
}: {
  href: string;
  icon: JSX.Element;
  label: string;
  value: string;
  target?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-3.5 rounded-2xl px-4 py-3.5 transition-colors hover:bg-[#DE3A16]/5"
    >
      <div className="icon-badge h-10 w-10 flex-shrink-0 rounded-xl group-hover:scale-105">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="truncate text-sm font-medium text-gray-900">{value}</p>
      </div>
      <HiOutlineChevronRight className="flex-shrink-0 text-gray-500 transition-colors group-hover:text-gray-700" />
    </a>
  );
}

function CenteredMessage({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white p-6">
      <div className="max-w-sm text-center animate-fade-in">
        <div className="icon-badge mx-auto mb-5 h-20 w-20 rounded-3xl">
          <HiOutlineSearch className="text-3xl" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export function CardPublicView() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();

  const [cardData, setCardData] = useState<PublicCardResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    if (!cardId) {
      setErrorMessage("This card ID is missing.");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    cardApi
      .getPublicCard(cardId)
      .then(setCardData)
      .catch((err) => {
        setCardData(null);
        setErrorMessage(getErrorMessage(err));
      })
      .finally(() => setIsLoading(false));
  }, [cardId]);

  useEffect(() => {
    if (!cardId) return;

    const publicUrl = `${window.location.origin}/c/${cardId}`;
    QRCode.toDataURL(publicUrl)
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [cardId]);

  if (isLoading) return <PageSpinner />;

  if (!cardData) {
    return (
      <CenteredMessage
        title="Card Not Found"
        message={errorMessage || "This card ID does not exist in our system."}
      />
    );
  }

  if (cardData.type === "unassigned") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white p-6">
        <div className="card-soft w-full max-w-sm animate-slide-up rounded-3xl border-[#DE3A16] p-8 text-center">
          <div className="icon-badge mx-auto mb-5 h-16 w-16 rounded-3xl">
            <HiOutlineUserAdd className="text-3xl" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900">
            Activate Your Card
          </h2>
          <p className="mb-7 text-sm leading-relaxed text-gray-600">
            {cardData.message ||
              "This E-Card has not been set up yet. Create your free account to make it yours."}
          </p>
          <button
            onClick={() => navigate(`/register?cardId=${cardData.cardId}`)}
            className="w-full rounded-2xl bg-brand-500 py-3.5 font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600"
          >
            Claim This Card
          </button>
          <p className="mt-5 text-xs text-gray-600">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-brand-600 transition-colors hover:text-brand-700"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  const profile: PublicProfile | null =
    cardData.type === "personal" ? cardData.profile : null;
  const businessProfile: PublicBusinessProfile | null =
    cardData.type === "business" ? cardData.business : null;

  if (cardData.type === "personal" && !profile) {
    return (
      <CenteredMessage
        title="Profile Not Ready"
        message={
          cardData.message ||
          "This card is active, but the profile has not been completed yet."
        }
      />
    );
  }

  const hasContacts = profile
    ? profile.phone || profile.email || profile.whatsapp || profile.website
    : businessProfile?.phone || businessProfile?.email || businessProfile?.website;

  const primaryAction = profile
    ? {
        href: cardApi.getVCardDownloadUrl(cardData.cardId),
        download: undefined,
        label: "Save Contact",
        icon: <HiOutlineUserAdd className="text-lg" />,
      }
    : qrUrl
      ? {
          href: qrUrl,
          download: `${cardData.cardId}-qr.png`,
          label: "Download QR",
          icon: <HiOutlineQrcode className="text-lg" />,
        }
      : null;

  return (
    <div className="min-h-screen bg-white pb-10">
      <div className="relative mx-auto w-full max-w-sm animate-slide-up px-4 pt-8">
        <div className="card-soft mb-4 rounded-3xl border-[#DE3A16] p-6 text-center">
          <div className="relative mx-auto mb-4 h-24 w-24">
            {profile?.imageUrl || businessProfile?.imageUrl ? (
              <img
                src={profile ? profile.imageUrl! : businessProfile!.imageUrl!}
                alt={profile ? profile.fullName : businessProfile!.name}
                className="h-24 w-24 rounded-full object-cover ring-2 ring-brand-500/40 ring-offset-2 ring-offset-white"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-[#DE3A16] bg-white">
                <span className="text-3xl font-bold text-[#DE3A16]">
                  {profile
                    ? profile.fullName.charAt(0).toUpperCase()
                    : businessProfile?.name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <span className="absolute bottom-1 right-1 h-4 w-4 rounded-full border-2 border-white bg-green-400 shadow" />
          </div>

          <h1 className="text-xl font-bold text-gray-900">
            {profile ? profile.fullName : businessProfile?.name}
          </h1>
          {(profile?.jobTitle || businessProfile?.category) && (
            <p className="mt-1 text-sm font-medium text-brand-400">
              {profile ? profile.jobTitle : businessProfile?.category}
            </p>
          )}
          {(profile?.company || businessProfile?.location) && (
            <p className="mt-0.5 text-sm text-gray-600">
              {profile ? profile.company : businessProfile?.location}
            </p>
          )}

          {primaryAction && (
            <a
              href={primaryAction.href}
              download={primaryAction.download}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600"
            >
              {primaryAction.icon}
              {primaryAction.label}
            </a>
          )}
        </div>

        {(profile?.bio || businessProfile?.description) && (
          <div className="card-soft mb-4 rounded-3xl border-[#DE3A16] p-5">
            <p className="section-label mb-3">About</p>
            <p className="text-sm leading-relaxed text-gray-700">
              {profile ? profile.bio : businessProfile?.description}
            </p>
          </div>
        )}

        {businessProfile?.menus?.length ? (
          <div className="card-soft mb-4 rounded-3xl border-[#DE3A16] p-5">
            <p className="section-label mb-3">Menu</p>
            {businessProfile.menus.map((menu) => (
              <div key={menu.id} className="mb-4 last:mb-0">
                <h3 className="border-b border-gray-100 pb-1 font-bold text-gray-900">
                  {menu.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {menu.items?.map((item) => (
                    <div key={item.id} className="flex gap-3 text-sm">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-12 w-12 flex-shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-grow">
                        <div className="flex justify-between gap-3">
                          <span className="font-semibold text-gray-900">
                            {item.name}
                          </span>
                          <span className="font-bold text-[#DE3A16]">
                            RWF {item.price.toLocaleString()}
                          </span>
                        </div>
                        {item.description && (
                          <p className="mt-0.5 text-xs leading-tight text-gray-500">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {hasContacts && (
          <div className="card-soft mb-4 rounded-3xl border-[#DE3A16] px-2 py-3">
            <p className="section-label mb-2 px-2">Contact</p>

            {(profile?.phone || businessProfile?.phone) && (
              <ContactRow
                href={`tel:${profile ? profile.phone : businessProfile?.phone}`}
                icon={<HiOutlinePhone className="text-lg text-green-400" />}
                label="Phone"
                value={profile ? profile.phone! : businessProfile!.phone!}
              />
            )}
            {(profile?.email || businessProfile?.email) && (
              <ContactRow
                href={`mailto:${profile ? profile.email : businessProfile?.email}`}
                icon={<HiOutlineMail className="text-lg text-blue-400" />}
                label="Email"
                value={profile ? profile.email! : businessProfile!.email!}
              />
            )}
            {profile?.whatsapp && (
              <ContactRow
                href={`https://wa.me/${profile.whatsapp}`}
                icon={<FaWhatsapp className="text-lg text-emerald-400" />}
                label="WhatsApp"
                value={`+${profile.whatsapp}`}
                target="_blank"
              />
            )}
            {(profile?.website || businessProfile?.website) && (
              <ContactRow
                href={profile ? profile.website! : businessProfile!.website!}
                icon={<HiOutlineGlobe className="text-lg text-purple-400" />}
                label="Website"
                value={(profile
                  ? profile.website!
                  : businessProfile!.website!
                ).replace(/^https?:\/\//, "")}
                target="_blank"
              />
            )}
          </div>
        )}

        {profile?.links?.length ? (
          <div className="card-soft mb-5 rounded-3xl border-[#DE3A16] p-5">
            <p className="section-label mb-4">Social Network</p>
            <div className="flex flex-wrap gap-3">
              {profile.links.map((link, index) => (
                <a
                  key={index}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2"
                  aria-label={link.label}
                >
                  <div className="icon-badge flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-105">
                    {LINK_ICONS[link.type] ?? LINK_ICONS.custom}
                  </div>
                  <span className="max-w-[56px] truncate text-center text-xs text-gray-600 transition-colors group-hover:text-gray-800">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : null}

        <p className="text-center text-xs text-gray-500">
          Powered by E-Card Platform
        </p>
      </div>
    </div>
  );
}
