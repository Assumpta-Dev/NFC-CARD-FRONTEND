export function getPublicCardPath(cardId: string): string {
  return `/c/${encodeURIComponent(cardId)}`;
}

export function getPublicCardUrl(cardId: string): string {
  if (typeof window === "undefined") {
    return getPublicCardPath(cardId);
  }

  return new URL(getPublicCardPath(cardId), window.location.origin).toString();
}
