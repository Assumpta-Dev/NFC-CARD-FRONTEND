/** Public-folder marketing assets (served from site root). */
export const marketingImages = {
  tapToConnect: "/tap to connect.jpg",
  connectUnlimited: "/connect unlimitedless.jpg",
  tapOrScanOrder: "/tap or scan to order.png",
  orderInSeconds: "/order in seconds.jpg",
  orderInClicks: "/order in clicks.jpg",
  viewMenuOrder: "/view menu to order.jpg",
} as const;

export interface HeroSlide {
  image: string;
  eyebrow: string;
  title: string;
  subtitle: string;
}

export const heroSlides: HeroSlide[] = [
  {
    image: marketingImages.tapToConnect,
    eyebrow: "NFC & QR",
    title: "Tap to connect instantly",
    subtitle: "Share your profile with a single tap — no app download required.",
  },
  {
    image: marketingImages.connectUnlimited,
    eyebrow: "Networking",
    title: "Connect without limits",
    subtitle: "One smart card, unlimited introductions. Your network grows with every scan.",
  },
  {
    image: marketingImages.tapOrScanOrder,
    eyebrow: "For business",
    title: "Tap or scan to order",
    subtitle: "Customers browse your menu and place orders straight from your card.",
  },
  {
    image: marketingImages.orderInSeconds,
    eyebrow: "Speed",
    title: "Orders in seconds",
    subtitle: "From menu view to checkout — a frictionless experience for your guests.",
  },
  {
    image: marketingImages.orderInClicks,
    eyebrow: "Simplicity",
    title: "Order in a few clicks",
    subtitle: "Beautiful, fast ordering that keeps customers coming back.",
  },
  {
    image: marketingImages.viewMenuOrder,
    eyebrow: "Hospitality",
    title: "View menu & order",
    subtitle: "Showcase your full menu and accept table or room orders effortlessly.",
  },
];

export interface StoryBlock {
  image: string;
  tag: string;
  title: string;
  description: string;
  points: string[];
}

export const storyBlocks: StoryBlock[] = [
  {
    image: marketingImages.tapToConnect,
    tag: "Digital identity",
    title: "Replace paper cards with something people actually keep",
    description:
      "Hand someone your E-Card and they tap or scan to save your contact, links, and brand — instantly on their phone.",
    points: ["NFC tap or QR scan", "Live profile you can update anytime", "Works on any smartphone"],
  },
  {
    image: marketingImages.viewMenuOrder,
    tag: "Restaurants & cafes",
    title: "Turn every table into a point of sale",
    description:
      "Guests scan your card, browse the menu, pick items, and submit orders — you confirm payment from your dashboard.",
    points: ["Digital menu on the card", "Table & room context", "Real-time order alerts"],
  },
  {
    image: marketingImages.orderInSeconds,
    tag: "Hotels & motels",
    title: "Room service without the phone call",
    description:
      "Share WiFi, check-in times, and let guests order to their room number — all from one smart card in the lobby or room.",
    points: ["Guest info panel", "Room service ordering", "Business analytics built in"],
  },
];
