// ===========================================================
// PUBLIC CARD VIEW PAGE — OVOU-inspired dark profile card
// ===========================================================
// Renders when someone taps an NFC card or scans a QR code.
// Design: deep dark background, clean profile header, contact
// action rows, social icon grid — matching the OVOU aesthetic.
// ===========================================================

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cardApi, getErrorMessage } from '../../services/api';
import { PublicProfile } from '../../types';
import { PageSpinner } from '../../components/ui';
import {
  HiOutlinePhone,
  HiOutlineMail,
  HiOutlineGlobe,
  HiOutlineSearch,
  HiOutlineUserAdd,
  HiOutlineChevronRight,
} from 'react-icons/hi';
import {
  FaLinkedin, FaTwitter, FaInstagram, FaGithub,
  FaYoutube, FaTiktok, FaFacebook, FaLink, FaWhatsapp,
} from 'react-icons/fa';

// ── Icon map: link type → branded React icon ────────────────
const LINK_ICONS: Record<string, JSX.Element> = {
  linkedin:  <FaLinkedin  className="text-[#0A66C2] text-xl" />,
  twitter:   <FaTwitter   className="text-[#1DA1F2] text-xl" />,
  instagram: <FaInstagram className="text-[#E1306C] text-xl" />,
  github:    <FaGithub   className="text-gray-200  text-xl" />,
  youtube:   <FaYoutube  className="text-[#FF0000] text-xl" />,
  tiktok:    <FaTiktok   className="text-gray-100  text-xl" />,
  facebook:  <FaFacebook className="text-[#1877F2] text-xl" />,
  custom:    <FaLink     className="text-gray-400  text-xl" />,
};

// ── Contact row ─────────────────────────────────────────────
function ContactRow({
  href, icon, label, value, target,
}: {
  href: string; icon: React.ReactNode; label: string; value: string; target?: string;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl hover:bg-surface-700 transition-colors group"
    >
      <div className="w-10 h-10 rounded-xl bg-surface-700 group-hover:bg-surface-600 flex items-center justify-center flex-shrink-0 transition-colors">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value}</p>
      </div>
      <HiOutlineChevronRight className="text-gray-600 group-hover:text-gray-400 flex-shrink-0 transition-colors" />
    </a>
  );
}

// ── Main component ───────────────────────────────────────────
export function CardPublicView() {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();

  const [profile, setProfile]       = useState<PublicProfile | null>(null);
  const [cardStatus, setCardStatus] = useState<'active' | 'unassigned' | 'notfound' | 'loading'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [publicCardId, setPublicCardId] = useState('');

  useEffect(() => {
    if (!cardId) { setCardStatus('notfound'); return; }
    cardApi.getPublicCard(cardId)
      .then((data) => {
        setPublicCardId(data.cardId);
        if (data.status === 'active' && data.profile) {
          setProfile(data.profile);
          setCardStatus('active');
        } else {
          setCardStatus('unassigned');
        }
      })
      .catch((err) => {
        setErrorMessage(getErrorMessage(err));
        setCardStatus('notfound');
      });
  }, [cardId]);

  // ── Loading ──────────────────────────────────────────────
  if (cardStatus === 'loading') return <PageSpinner />;

  // ── Card Not Found ───────────────────────────────────────
  if (cardStatus === 'notfound') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm animate-fade-in">
          <div className="w-20 h-20 bg-surface-800 border border-surface-600 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineSearch className="text-gray-500 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Card Not Found</h2>
          <p className="text-gray-500 text-sm">{errorMessage || 'This card ID does not exist in our system.'}</p>
        </div>
      </div>
    );
  }

  // ── Unassigned — Activation Flow ─────────────────────────
  if (cardStatus === 'unassigned') {
    return (
      <div className="min-h-screen bg-surface-900 flex items-center justify-center p-6">
        {/* Glow */}
        <div
          className="pointer-events-none fixed inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
        />
        <div className="relative bg-surface-800 border border-surface-600 rounded-3xl w-full max-w-sm p-8 text-center animate-slide-up shadow-2xl shadow-black/40">
          <div className="w-16 h-16 bg-brand-500/10 border border-brand-500/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
            <HiOutlineUserAdd className="text-brand-400 text-3xl" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Activate Your Card</h2>
          <p className="text-gray-500 text-sm mb-7 leading-relaxed">
            This NFC card hasn't been set up yet. Create your free account to make it yours!
          </p>
          <button
            onClick={() => navigate(`/register?cardId=${publicCardId}`)}
            className="w-full py-3.5 bg-brand-500 hover:bg-brand-600 text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-brand-500/25"
          >
            Claim This Card
          </button>
          <p className="text-xs text-gray-600 mt-5">
            Already have an account?{' '}
            <button onClick={() => navigate('/login')} className="text-brand-400 hover:text-brand-300 transition-colors">
              Sign in
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Active Card — OVOU-style dark profile ────────────────
  if (!profile) return null;

  const hasContacts = profile.phone || profile.email || profile.whatsapp || profile.website;

  return (
    <div className="min-h-screen bg-surface-900 pb-10">
      {/* Top glow accent */}
      <div
        className="pointer-events-none fixed top-0 left-0 right-0 h-64"
        style={{ background: 'radial-gradient(ellipse 80% 100% at 50% -20%, rgba(99,102,241,0.18) 0%, transparent 70%)' }}
      />

      <div className="relative w-full max-w-sm mx-auto px-4 pt-8 animate-slide-up">

        {/* ── Profile Header Card ─────────────────────────── */}
        <div className="bg-surface-800 border border-surface-600 rounded-3xl p-6 text-center mb-4 shadow-xl shadow-black/30">

          {/* Avatar */}
          <div className="relative w-24 h-24 mx-auto mb-4">
            {profile.imageUrl ? (
              <img
                src={profile.imageUrl}
                alt={profile.fullName}
                className="w-24 h-24 rounded-full object-cover ring-2 ring-brand-500/40 ring-offset-2 ring-offset-surface-800"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-surface-700 border border-surface-500 flex items-center justify-center">
                <span className="text-3xl font-bold text-brand-400">
                  {profile.fullName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            {/* Online dot */}
            <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-surface-800 shadow" />
          </div>

          {/* Identity */}
          <h1 className="text-xl font-bold text-white">{profile.fullName}</h1>
          {profile.jobTitle && (
            <p className="text-brand-400 font-medium text-sm mt-1">{profile.jobTitle}</p>
          )}
          {profile.company && (
            <p className="text-gray-500 text-sm mt-0.5">{profile.company}</p>
          )}

          {/* Save Contact CTA — primary action */}
          <a
            href={`/api/c/${cardId}/vcard`}
            download
            className="mt-5 flex items-center justify-center gap-2 w-full py-3.5 bg-brand-500 hover:bg-brand-600
              text-white font-semibold rounded-2xl transition-all duration-200 shadow-lg shadow-brand-500/25 text-sm"
          >
            <HiOutlineUserAdd className="text-lg" />
            Save Contact
          </a>
        </div>

        {/* ── About Section ─────────────────────────────── */}
        {profile.bio && (
          <div className="bg-surface-800 border border-surface-600 rounded-3xl p-5 mb-4">
            <p className="section-label mb-3">About</p>
            <p className="text-gray-300 text-sm leading-relaxed">{profile.bio}</p>
          </div>
        )}

        {/* ── Contact Section ───────────────────────────── */}
        {hasContacts && (
          <div className="bg-surface-800 border border-surface-600 rounded-3xl px-2 py-3 mb-4">
            <p className="section-label mb-2 px-2">Contact</p>

            {profile.phone && (
              <ContactRow
                href={`tel:${profile.phone}`}
                icon={<HiOutlinePhone className="text-green-400 text-lg" />}
                label="Phone" value={profile.phone}
              />
            )}
            {profile.email && (
              <ContactRow
                href={`mailto:${profile.email}`}
                icon={<HiOutlineMail className="text-blue-400 text-lg" />}
                label="Email" value={profile.email}
              />
            )}
            {profile.whatsapp && (
              <ContactRow
                href={`https://wa.me/${profile.whatsapp}`}
                icon={<FaWhatsapp className="text-emerald-400 text-lg" />}
                label="WhatsApp" value={`+${profile.whatsapp}`}
                target="_blank"
              />
            )}
            {profile.website && (
              <ContactRow
                href={profile.website}
                icon={<HiOutlineGlobe className="text-purple-400 text-lg" />}
                label="Website" value={profile.website.replace(/^https?:\/\//, '')}
                target="_blank"
              />
            )}
          </div>
        )}

        {/* ── Social Network Icon Grid (OVOU-style) ─────── */}
        {profile.links.length > 0 && (
          <div className="bg-surface-800 border border-surface-600 rounded-3xl p-5 mb-5">
            <p className="section-label mb-4">Social Network</p>
            <div className="flex flex-wrap gap-3">
              {profile.links.map((link, i) => (
                <a
                  key={i}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center gap-2 group"
                  aria-label={link.label}
                >
                  <div className="w-13 h-13 w-[52px] h-[52px] bg-surface-700 border border-surface-600
                    rounded-2xl flex items-center justify-center
                    group-hover:border-brand-500/40 group-hover:bg-surface-600 transition-all duration-200">
                    {LINK_ICONS[link.type] ?? LINK_ICONS.custom}
                  </div>
                  <span className="text-xs text-gray-500 group-hover:text-gray-400 transition-colors max-w-[56px] truncate text-center">
                    {link.label}
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-gray-700 text-xs">
          Powered by NFC Card Platform
        </p>
      </div>
    </div>
  );
}
