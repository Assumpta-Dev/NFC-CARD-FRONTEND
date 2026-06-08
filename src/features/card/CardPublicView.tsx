// ===========================================================
// PUBLIC CARD VIEW PAGE
// ===========================================================
// Renders when someone taps an E-Card or scans a QR code.
// Supports the backend's current public card payload:
//   - unassigned card
//   - personal card
//   - business card
// ===========================================================

import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import QRCode from "qrcode";
import {
  FaFacebook,
  FaGithub,
  FaInstagram,
  FaLinkedin,
  FaTiktok,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
  FaGlobe,
  FaSnapchatGhost,
  FaTelegram,
  FaPinterest,
  FaReddit,
  FaMedium,
  FaSpotify,
} from "react-icons/fa";
import {
  HiOutlineChevronRight,
  HiOutlineGlobe,
  HiOutlineMail,
  HiOutlineMinus,
  HiOutlinePhone,
  HiOutlinePlus,
  HiOutlineQrcode,
  HiOutlineSearch,
  HiOutlineShoppingCart,
  HiOutlineUserAdd,
  HiOutlineX,
} from "react-icons/hi";
import { PageSpinner } from "../../components/ui";
import { cardApi, getErrorMessage, orderApi } from "../../services/api";
import {
  OrderItem,
  PublicBusinessProfile,
  PublicCardResponse,
  PublicProfile,
} from "../../types";

const LINK_ICONS: Record<string, { icon: JSX.Element; bg: string }> = {
  linkedin:  { icon: <FaLinkedin        className="text-2xl" style={{ color: "#fff" }} />, bg: "#0A66C2" },
  twitter:   { icon: <FaTwitter         className="text-2xl" style={{ color: "#fff" }} />, bg: "#1DA1F2" },
  instagram: { icon: <FaInstagram       className="text-2xl" style={{ color: "#fff" }} />, bg: "#E1306C" },
  github:    { icon: <FaGithub          className="text-2xl" style={{ color: "#fff" }} />, bg: "#24292e" },
  youtube:   { icon: <FaYoutube         className="text-2xl" style={{ color: "#fff" }} />, bg: "#FF0000" },
  tiktok:    { icon: <FaTiktok          className="text-2xl" style={{ color: "#fff" }} />, bg: "#010101" },
  facebook:  { icon: <FaFacebook        className="text-2xl" style={{ color: "#fff" }} />, bg: "#1877F2" },
  whatsapp:  { icon: <FaWhatsapp        className="text-2xl" style={{ color: "#fff" }} />, bg: "#25D366" },
  snapchat:  { icon: <FaSnapchatGhost   className="text-2xl" style={{ color: "#000" }} />, bg: "#FFFC00" },
  telegram:  { icon: <FaTelegram        className="text-2xl" style={{ color: "#fff" }} />, bg: "#2AABEE" },
  pinterest: { icon: <FaPinterest       className="text-2xl" style={{ color: "#fff" }} />, bg: "#E60023" },
  reddit:    { icon: <FaReddit          className="text-2xl" style={{ color: "#fff" }} />, bg: "#FF4500" },
  medium:    { icon: <FaMedium          className="text-2xl" style={{ color: "#fff" }} />, bg: "#000000" },
  spotify:   { icon: <FaSpotify         className="text-2xl" style={{ color: "#fff" }} />, bg: "#1DB954" },
};

// Detect platform from URL when type is "custom"
function getLinkDisplay(type: string, url: string): { icon: JSX.Element; bg: string } {
  const key = type?.toLowerCase();
  if (LINK_ICONS[key]) return LINK_ICONS[key];
  // Try to detect from URL
  const u = url?.toLowerCase() ?? "";
  if (u.includes("linkedin"))  return LINK_ICONS.linkedin;
  if (u.includes("instagram")) return LINK_ICONS.instagram;
  if (u.includes("github"))    return LINK_ICONS.github;
  if (u.includes("twitter") || u.includes("x.com")) return LINK_ICONS.twitter;
  if (u.includes("facebook"))  return LINK_ICONS.facebook;
  if (u.includes("youtube"))   return LINK_ICONS.youtube;
  if (u.includes("tiktok"))    return LINK_ICONS.tiktok;
  if (u.includes("whatsapp"))  return LINK_ICONS.whatsapp;
  if (u.includes("snapchat"))  return LINK_ICONS.snapchat;
  if (u.includes("telegram"))  return LINK_ICONS.telegram;
  if (u.includes("pinterest")) return LINK_ICONS.pinterest;
  if (u.includes("reddit"))    return LINK_ICONS.reddit;
  if (u.includes("medium"))    return LINK_ICONS.medium;
  if (u.includes("spotify"))   return LINK_ICONS.spotify;
  // Final fallback — globe icon
  return { icon: <FaGlobe className="text-2xl" style={{ color: "#fff" }} />, bg: "#9ca3af" };
}

// Normalize any stored URL/handle into a proper absolute URL that
// opens the correct app (mobile deep-link) or website (desktop).
function resolveLink(type: string, url: string): string {
  const raw = url.trim();

  // Already a full URL — just ensure it has a protocol
  if (/^https?:\/\//i.test(raw)) return raw;

  // Handle plain usernames / partial paths per platform
  const handle = raw.replace(/^\/+/, ""); // strip leading slashes

  switch (type) {
    case "linkedin":
      return `https://www.linkedin.com/in/${handle}`;
    case "twitter":
      return `https://twitter.com/${handle}`;
    case "instagram":
      return `https://www.instagram.com/${handle}`;
    case "facebook":
      return `https://www.facebook.com/${handle}`;
    case "github":
      return `https://github.com/${handle}`;
    case "youtube":
      // Could be a channel name or full path
      return `https://www.youtube.com/@${handle}`;
    case "tiktok":
      return `https://www.tiktok.com/@${handle}`;
    default:
      // Custom link — add https:// if no protocol
      return `https://${raw}`;
  }
}

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

  // ===========================================================
  // CART & ORDER STATE — only active for business cards
  // ===========================================================
  // ===========================================================
  // PERSIST checkout state in sessionStorage so page reload
  // (e.g. card re-scan) doesn't lose an in-progress order.
  // Key is scoped to the cardId so different cards don't clash.
  // ===========================================================
  const SESSION_KEY = `checkout_${cardId ?? ""}`;

  const loadSession = () => {
    try {
      return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
    } catch {
      return null;
    }
  };

  const saved = loadSession();

  const [cart, setCart] = useState<OrderItem[]>(saved?.cart ?? []);
  const [showCart, setShowCart] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState<
    "form" | "payment" | "txid" | "waiting" | "done"
  >(saved?.checkoutStep ?? "form");
  const [customerName, setCustomerName] = useState(saved?.customerName ?? "");
  const [customerPhone, setCustomerPhone] = useState(
    saved?.customerPhone ?? "",
  );
  const [txId, setTxId] = useState(saved?.txId ?? "");
  const [orderId, setOrderId] = useState(saved?.orderId ?? "");
  const [orderStatus, setOrderStatus] = useState(saved?.orderStatus ?? "");
  const [orderError, setOrderError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderType, setOrderType] = useState<"table" | "room">(
    saved?.orderType ?? "table",
  );
  const [tableRoom, setTableRoom] = useState<string>(saved?.tableRoom ?? "");

  // Sync state to sessionStorage whenever key fields change
  useEffect(() => {
    if (!cardId) return;
    const state = {
      cart,
      checkoutStep,
      customerName,
      customerPhone,
      txId,
      orderId,
      orderStatus,
      orderType,
      tableRoom,
    };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
  }, [
    cart,
    checkoutStep,
    customerName,
    customerPhone,
    txId,
    orderId,
    orderStatus,
  ]);

  // Re-open modal after card data loads if there was an in-progress order
  useEffect(() => {
    if (cardData && saved?.checkoutStep && saved.checkoutStep !== "form") {
      setShowCart(true);
    }
  }, [cardData]);

  const cartTotal = cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const cartCount = cart.reduce((sum, i) => sum + i.qty, 0);

  const addToCart = useCallback(
    (item: {
      id: string;
      name: string;
      price: number;
      imageUrl: string | null;
    }) => {
      setCart((prev) => {
        const existing = prev.find((i) => i.id === item.id);
        if (existing)
          return prev.map((i) =>
            i.id === item.id ? { ...i, qty: i.qty + 1 } : i,
          );
        return [...prev, { ...item, qty: 1 }];
      });
    },
    [],
  );

  const updateQty = useCallback((id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) => (i.id === id ? { ...i, qty: i.qty + delta } : i))
        .filter((i) => i.qty > 0),
    );
  }, []);

  // Poll order status every 4s while waiting for business to confirm
  useEffect(() => {
    if (checkoutStep !== "waiting" || !orderId) return;
    const interval = setInterval(async () => {
      try {
        const result = await orderApi.getOrderStatus(orderId);
        if (result.status === "PAID" || result.status === "REJECTED") {
          setOrderStatus(result.status);
          setCheckoutStep("done");
        }
      } catch {
        /* silent */
      }
    }, 4000);
    return () => clearInterval(interval);
  }, [checkoutStep, orderId]);

  const handlePlaceOrder = async (businessId: string) => {
    if (!customerName.trim() || !customerPhone.trim()) {
      setOrderError("Name and phone are required");
      return;
    }
    if (!tableRoom.trim()) {
      setOrderError(
        orderType === "table"
          ? "Table number is required"
          : "Room number is required",
      );
      return;
    }
    setOrderError("");
    setIsSubmitting(true);
    const locationTag =
      orderType === "table"
        ? `Table ${tableRoom.trim()}`
        : `Room ${tableRoom.trim()}`;
    const nameWithLocation = `${customerName.trim()} (${locationTag})`;
    try {
      const order = await orderApi.placeOrder({
        businessId,
        customerName: nameWithLocation,
        phone: customerPhone.trim(),
        items: cart,
      });
      setOrderId(order.id);
      setCheckoutStep("payment");
      sessionStorage.setItem("lastOrderId", order.id);
    } catch (err) {
      setOrderError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaidNoCode = () => {
    // No payment code — name & phone already captured in step 1.
    // Business owner sees them in the orders panel and confirms manually.
    setCheckoutStep("waiting");
  };

  const handleSubmitTxId = async () => {
    if (!txId.trim()) {
      setOrderError("Please enter your transaction ID");
      return;
    }
    setOrderError("");
    setIsSubmitting(true);
    try {
      await orderApi.submitTxId(orderId, txId.trim());
      setCheckoutStep("waiting");
    } catch (err) {
      setOrderError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetOrder = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setShowCart(false);
    setCheckoutStep("form");
    setCustomerName("");
    setCustomerPhone("");
    setTxId("");
    setOrderId("");
    setOrderStatus("");
    setOrderError("");
    setTableRoom("");
    setOrderType("table");
  };

  const resetAll = () => {
    setCart([]);
    resetOrder();
  };

  useEffect(() => {
    if (!cardId) return;
    const publicUrl = `${window.location.origin}/c/${cardId}`;
    QRCode.toDataURL(publicUrl)
      .then(setQrUrl)
      .catch(() => setQrUrl(""));
  }, [cardId]);

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
        <div className="card-soft w-full max-w-sm animate-slide-up rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-8 text-center">
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

  if (cardData.type === "business" && !businessProfile) {
    return (
      <CenteredMessage
        title="Business Profile Not Ready"
        message="This card is active, but the business profile has not been completed yet."
      />
    );
  }

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
    : businessProfile?.phone ||
      businessProfile?.email ||
      businessProfile?.whatsapp ||
      businessProfile?.website;

  // Cover image only for personal cards
  const coverImage = cardData.type === "personal" ? profile?.coverImageUrl ?? null : null;
  // Fullscreen bg only for business cards
  const bgImage = cardData.type === "business" ? businessProfile?.imageUrl ?? null : null;

  return (
    <div
      className="relative min-h-screen pb-10"
      style={{ backgroundColor: "#ffffff" }}
    >
      {/* Full-screen background image — only rendered when profile has a photo */}
      {bgImage && (
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: `url('${bgImage}')`,
            backgroundSize: "cover",
            backgroundPosition: "center center",
            backgroundRepeat: "no-repeat",
            backgroundAttachment: "fixed",
          }}
        />
      )}

      {/* Scrollable content */}
      <div className="relative z-10 mx-auto w-full max-w-sm px-4 pt-8">
        {/* Profile card */}
        <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] overflow-hidden animate-pop-in hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] transition-all duration-300">
          {/* Cover photo banner — personal cards only */}
          {coverImage ? (
            <div className="w-full h-44 overflow-hidden">
              <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
            </div>
          ) : cardData.type === "personal" ? (
            <div className="w-full h-24 bg-gradient-to-r from-brand-500/20 to-brand-400/10" />
          ) : null}

          <div className={`p-6 text-center ${coverImage || cardData.type === "personal" ? "-mt-10" : ""}`}>
          <div className="relative mx-auto mb-4 h-24 w-24 animate-pop-in">
            {profile?.imageUrl || businessProfile?.imageUrl ? (
              <img
                src={profile ? profile.imageUrl! : businessProfile!.imageUrl!}
                alt={profile ? profile.fullName : businessProfile!.name}
                className="h-24 w-24 rounded-full object-cover shadow-[0_0_0_3px_rgba(222,58,22,0.3),0_2px_12px_rgba(0,0,0,0.15)] border-4 border-white"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-white shadow-[0_2px_12px_rgba(0,0,0,0.10)] border-4 border-white">
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

          {/* Download QR — available for all card types */}
          {qrUrl && (profile || businessProfile) && (
            <a
              href={qrUrl}
              download={`${cardData.cardId}-qr.png`}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand-500 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/25 transition-all duration-200 hover:bg-brand-600"
            >
              <HiOutlineQrcode className="text-lg" />
              Save Contact
            </a>
          )}
          </div>
        </div>

        {(profile?.bio || businessProfile?.description) && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 animate-slide-up-1 hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300">
            <p className="section-label mb-3">About</p>
            <p className="text-sm leading-relaxed text-gray-700">
              {profile ? profile.bio : businessProfile?.description}
            </p>
          </div>
        )}

        {businessProfile?.menus?.length ? (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 animate-slide-up-2 hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300">
            <p className="section-label mb-3">Menu</p>
            {businessProfile.menus.map((menu) => (
              <div key={menu.id} className="mb-4 last:mb-0">
                <h3 className="border-b border-gray-100 pb-1 font-bold text-gray-900">
                  {menu.title}
                </h3>
                <div className="mt-3 space-y-3">
                  {menu.items?.map((item) => {
                    const cartItem = cart.find((c) => c.id === item.id);
                    return (
                      <div
                        key={item.id}
                        className="flex gap-3 rounded-2xl border border-gray-100 bg-white p-3 text-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                      >
                        {/* Image — larger, left-anchored, zoom on hover */}
                        {item.imageUrl && (
                          <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl">
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-110"
                            />
                          </div>
                        )}
                        {/* Content + cart controls in same column */}
                        <div className="flex min-w-0 flex-1 flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-gray-900 leading-snug">
                                {item.name}
                              </span>
                              <span className="flex-shrink-0 font-bold text-[#DE3A16]">
                                RWF {item.price.toLocaleString()}
                              </span>
                            </div>
                            {item.description && (
                              <p className="mt-0.5 text-xs leading-relaxed text-gray-500">
                                {item.description}
                              </p>
                            )}
                          </div>
                          {/* Cart controls — pinned to bottom of content column */}
                          <div className="mt-2">
                            {cartItem ? (
                              <div className="inline-flex items-center gap-2 rounded-xl border border-[#DE3A16] px-2 py-1">
                                <button
                                  onClick={() => updateQty(item.id, -1)}
                                  className="text-[#DE3A16] transition-opacity hover:opacity-70"
                                >
                                  <HiOutlineMinus className="text-sm" />
                                </button>
                                <span className="min-w-[18px] text-center text-sm font-bold text-gray-900">
                                  {cartItem.qty}
                                </span>
                                <button
                                  onClick={() => updateQty(item.id, 1)}
                                  className="text-[#DE3A16] transition-opacity hover:opacity-70"
                                >
                                  <HiOutlinePlus className="text-sm" />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() =>
                                  addToCart({
                                    id: item.id,
                                    name: item.name,
                                    price: item.price,
                                    imageUrl: item.imageUrl,
                                  })
                                }
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[#DE3A16] px-3 py-1.5 text-xs font-semibold text-white shadow-sm shadow-[#DE3A16]/20 transition-all hover:bg-brand-700"
                              >
                                <HiOutlinePlus className="text-xs" /> Add to
                                cart
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {hasContacts && (
          <div className="card-soft mb-4 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] px-2 py-3 animate-slide-up-3">
            <p className="section-label mb-2 px-2">Contact</p>

            {(profile?.phone || businessProfile?.phone) && (
              <ContactRow
                href={`tel:${(profile ? profile.phone : businessProfile?.phone)!.replace(/\s+/g, "")}`}
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
            {(profile?.whatsapp || businessProfile?.whatsapp) && (
              <ContactRow
                href={`https://wa.me/${(profile ? profile.whatsapp! : businessProfile!.whatsapp!).replace(/[^0-9]/g, "")}`}
                icon={<FaWhatsapp className="text-lg text-emerald-400" />}
                label="WhatsApp"
                value={`+${profile ? profile.whatsapp! : businessProfile!.whatsapp!}`}
                target="_blank"
              />
            )}
            {(profile?.website || businessProfile?.website) && (
              <ContactRow
                href={(() => {
                  const w = profile
                    ? profile.website!
                    : businessProfile!.website!;
                  return /^https?:\/\//i.test(w) ? w : `https://${w}`;
                })()}
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

        {(() => {
          const links = profile?.links?.length ? profile.links : businessProfile?.links?.length ? businessProfile.links : null;
          if (!links) return null;
          return (
            <div className="card-soft mb-5 rounded-3xl shadow-[0_4px_24px_rgba(0,0,0,0.08)] p-5 animate-slide-up-4 hover:shadow-[0_12px_40px_rgba(0,0,0,0.13)] hover:-translate-y-1.5 transition-all duration-300">
              <p className="section-label mb-4">Social Network</p>
              <div className="flex flex-wrap gap-3">
                {links.map((link, index) => (
                  <a
                    key={index}
                    href={resolveLink(link.type, link.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col items-center gap-2"
                    aria-label={link.label}
                  >
                    <div
                      style={{ backgroundColor: getLinkDisplay(link.type, link.url).bg }}
                      className="flex h-[52px] w-[52px] items-center justify-center rounded-2xl transition-all duration-200 group-hover:scale-110 group-hover:shadow-lg"
                    >
                      {getLinkDisplay(link.type, link.url).icon}
                    </div>
                    <span className="max-w-[56px] truncate text-center text-xs text-gray-600 transition-colors group-hover:text-gray-800">
                      {link.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          );
        })()}

        <p className="text-center text-xs text-gray-500">
          Powered by Icumu Tech Ltd
        </p>
      </div>

      {/* Floating cart button — only for business cards with items in cart */}
      {businessProfile && cartCount > 0 && checkoutStep === "form" && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-[#DE3A16] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-[#DE3A16]/40"
        >
          <HiOutlineShoppingCart className="text-lg" />
          {cartCount} item{cartCount > 1 ? "s" : ""} &middot; RWF{" "}
          {cartTotal.toLocaleString()}
        </button>
      )}

      {/* Resume in-progress order — shown when modal is closed but order is active */}
      {businessProfile && !showCart && checkoutStep !== "form" && (
        <button
          onClick={() => setShowCart(true)}
          className="fixed bottom-6 left-1/2 z-40 -translate-x-1/2 flex items-center gap-2 rounded-2xl bg-gray-900 px-5 py-3 text-sm font-bold text-white shadow-lg"
        >
          <HiOutlineShoppingCart className="text-lg" />
          {checkoutStep === "waiting"
            ? "Order pending confirmation..."
            : checkoutStep === "done"
              ? "View order result"
              : "Resume your order"}
        </button>
      )}

      {/* Checkout modal — slides up from bottom */}
      {showCart && businessProfile && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl">
            {/* STEP 1 — cart review + customer details */}
            {checkoutStep === "form" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Your Order
                  </h2>
                  <button onClick={resetAll}>
                    <HiOutlineX className="text-xl text-gray-400" />
                  </button>
                </div>

                {/* Cart items */}
                <div className="mb-4 max-h-40 space-y-3 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.imageUrl && (
                        <img
                          src={item.imageUrl}
                          alt={item.name}
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      )}
                      <div className="flex-grow">
                        <p className="text-sm font-semibold text-gray-900">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          RWF {item.price.toLocaleString()} &times; {item.qty}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateQty(item.id, -1)}
                          className="rounded-lg border p-1 text-gray-500"
                        >
                          <HiOutlineMinus className="text-xs" />
                        </button>
                        <span className="w-5 text-center text-sm font-bold">
                          {item.qty}
                        </span>
                        <button
                          onClick={() => updateQty(item.id, 1)}
                          className="rounded-lg border p-1 text-gray-500"
                        >
                          <HiOutlinePlus className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-4 flex justify-between border-t pt-3 text-sm font-bold">
                  <span>Total</span>
                  <span className="text-[#DE3A16]">
                    RWF {cartTotal.toLocaleString()}
                  </span>
                </div>

                {/* Table / Room tabs */}
                <div className="mb-3 flex rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setOrderType("table")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      orderType === "table"
                        ? "bg-[#DE3A16] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    🍽 Dine In
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderType("room")}
                    className={`flex-1 rounded-lg py-2 text-sm font-semibold transition-all ${
                      orderType === "room"
                        ? "bg-[#DE3A16] text-white shadow-sm"
                        : "text-gray-500 hover:text-gray-800"
                    }`}
                  >
                    🛏 Room Service
                  </button>
                </div>

                {/* Customer details */}
                <div className="mb-3 space-y-3">
                  <input
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Your name"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#DE3A16] focus:outline-none"
                  />
                  <input
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Your MTN/Airtel number"
                    type="tel"
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#DE3A16] focus:outline-none"
                  />
                  <input
                    value={tableRoom}
                    onChange={(e) => setTableRoom(e.target.value)}
                    placeholder={
                      orderType === "table"
                        ? "Table number (e.g. 5)"
                        : "Room number (e.g. 204)"
                    }
                    className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#DE3A16] focus:outline-none"
                  />
                </div>

                {orderError && (
                  <p className="mb-3 text-xs text-red-500">{orderError}</p>
                )}
                <button
                  onClick={() => handlePlaceOrder(businessProfile.id)}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Placing order..." : "Place Order"}
                </button>
              </>
            )}

            {/* STEP 2 — MoMo payment instruction */}
            {checkoutStep === "payment" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Pay Now</h2>
                  <button onClick={resetAll}>
                    <HiOutlineX className="text-xl text-gray-400" />
                  </button>
                </div>
                <div className="mb-4 rounded-2xl bg-[#fdf3f0] p-4 text-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Dial this USSD code on your phone
                  </p>
                  {businessProfile.paymentCode ? (
                    <p className="mt-2 break-all text-lg font-bold text-[#DE3A16]">
                      *182*8*1*{businessProfile.paymentCode}*{cartTotal}#
                    </p>
                  ) : (
                    <p className="mt-2 break-all text-lg font-bold text-[#DE3A16]">
                      *182*1*1*{(businessProfile.phone ?? "").replace(/^0/, "")}
                      *{cartTotal}#
                    </p>
                  )}
                  <button
                    onClick={() =>
                      navigator.clipboard?.writeText(
                        businessProfile.paymentCode
                          ? `*182*8*1*${businessProfile.paymentCode}*${cartTotal}#`
                          : `*182*1*1*${(businessProfile.phone ?? "").replace(/^0/, "")}*${cartTotal}#`,
                      )
                    }
                    className="mt-2 text-xs font-semibold text-[#DE3A16] underline"
                  >
                    Copy Code
                  </button>
                </div>
                <p className="mb-4 text-center text-sm text-gray-600">
                  Pay{" "}
                  <span className="font-bold text-gray-900">
                    RWF {cartTotal.toLocaleString()}
                  </span>{" "}
                  via MTN MoMo,{" "}
                  {businessProfile.paymentCode
                    ? "then enter the TxId from your confirmation SMS."
                    : "then tap the button below."}
                </p>
                {businessProfile.paymentCode ? (
                  <button
                    onClick={() => setCheckoutStep("txid")}
                    className="w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white"
                  >
                    I Have Paid &rarr; Enter TxId
                  </button>
                ) : (
                  <button
                    onClick={handlePaidNoCode}
                    disabled={isSubmitting}
                    className="w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white disabled:opacity-60"
                  >
                    {isSubmitting ? "Please wait..." : "I Have Paid →"}
                  </button>
                )}
              </>
            )}

            {/* STEP 3 — enter TxId from SMS (only when business has paymentCode) */}
            {checkoutStep === "txid" && (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">
                    Enter Transaction ID
                  </h2>
                  <button onClick={resetAll}>
                    <HiOutlineX className="text-xl text-gray-400" />
                  </button>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  Enter the TxId from the MoMo SMS you received after paying.
                </p>
                <input
                  value={txId}
                  onChange={(e) => setTxId(e.target.value)}
                  placeholder="e.g. 2345567889"
                  className="mb-3 w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:border-[#DE3A16] focus:outline-none"
                />
                {orderError && (
                  <p className="mb-3 text-xs text-red-500">{orderError}</p>
                )}
                <button
                  onClick={handleSubmitTxId}
                  disabled={isSubmitting}
                  className="w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {isSubmitting ? "Submitting..." : "Submit TxId"}
                </button>
              </>
            )}

            {/* STEP 4 — waiting for business to verify */}
            {checkoutStep === "waiting" && (
              <div className="py-8 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[#DE3A16] border-t-transparent" />
                <h2 className="text-lg font-bold text-gray-900">
                  Waiting for confirmation...
                </h2>
                <p className="mt-2 text-sm text-gray-500">
                  We are verifying your payment. Please wait as this usually
                  takes a moment!
                </p>
                <button
                  onClick={() => navigate(`/order/${orderId}`)}
                  className="mt-5 w-full rounded-2xl border border-[#DE3A16] py-3 text-sm font-semibold text-[#DE3A16]"
                >
                  Track My Order
                </button>
              </div>
            )}

            {/* STEP 5 — done (paid or rejected) */}
            {checkoutStep === "done" && (
              <div className="py-6 text-center">
                {orderStatus === "PAID" ? (
                  <>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl">
                      ✅
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Payment Confirmed!
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      Your order has been confirmed. Enjoy your meal!
                    </p>
                    <button
                      onClick={() => navigate(`/order/${orderId}`)}
                      className="mt-4 w-full rounded-2xl bg-[#DE3A16] py-3 text-sm font-bold text-white"
                    >
                      View Receipt &amp; Download
                    </button>
                  </>
                ) : (
                  <>
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                      ❌
                    </div>
                    <h2 className="text-lg font-bold text-gray-900">
                      Payment Rejected
                    </h2>
                    <p className="mt-2 text-sm text-gray-500">
                      The business could not verify your payment. Please contact
                      them directly.
                    </p>
                  </>
                )}
                <button
                  onClick={resetAll}
                  className="mt-3 w-full rounded-2xl border border-gray-200 py-3 text-sm font-semibold text-gray-600"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
