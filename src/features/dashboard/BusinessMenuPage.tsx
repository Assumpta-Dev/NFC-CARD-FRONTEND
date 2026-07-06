import axios from "axios";
import { useEffect, useState } from "react";
import {
  HiOutlineLink,
  HiOutlinePhotograph,
  HiOutlinePlus,
  HiOutlineTrash,
} from "react-icons/hi";
import { Alert, Button, Input, PageSpinner, Select, Textarea } from "../../components/ui";
import {
  BUSINESS_TYPES,
  BusinessType,
  BUSINESS_TYPE_LABELS,
} from "../../constants/businessTypes";
import { businessApi, getErrorMessage, menuApi } from "../../services/api";
import { BusinessCardLink, BusinessMenu, BusinessProfile, BusinessSettings } from "../../types";
import { getPublicCardUrl } from "../card/publicCardUrl";

type BusinessFormState = {
  name: string;
  businessType: BusinessType;
  description: string;
  location: string;
  phone: string;
  email: string;
  website: string;
  paymentCode: string;
  wifiPassword: string;
  checkInTime: string;
  checkOutTime: string;
  operatingHours: string;
  emergencyPhone: string;
};

type ItemFormState = {
  name: string;
  price: string;
  description: string;
};

const EMPTY_BUSINESS_FORM: BusinessFormState = {
  name: "",
  businessType: "RESTAURANT",
  description: "",
  location: "",
  phone: "",
  email: "",
  website: "",
  paymentCode: "",
  wifiPassword: "",
  checkInTime: "",
  checkOutTime: "",
  operatingHours: "",
  emergencyPhone: "",
};

function settingsFromProfile(settings?: BusinessSettings | null): Pick<
  BusinessFormState,
  "wifiPassword" | "checkInTime" | "checkOutTime" | "operatingHours" | "emergencyPhone"
> {
  return {
    wifiPassword: settings?.wifiPassword ?? "",
    checkInTime: settings?.checkInTime ?? "",
    checkOutTime: settings?.checkOutTime ?? "",
    operatingHours: settings?.operatingHours ?? "",
    emergencyPhone: settings?.emergencyPhone ?? "",
  };
}

function buildSettingsPayload(form: BusinessFormState): BusinessSettings | null {
  const settings: BusinessSettings = {};
  if (form.wifiPassword.trim()) settings.wifiPassword = form.wifiPassword.trim();
  if (form.checkInTime.trim()) settings.checkInTime = form.checkInTime.trim();
  if (form.checkOutTime.trim()) settings.checkOutTime = form.checkOutTime.trim();
  if (form.operatingHours.trim()) settings.operatingHours = form.operatingHours.trim();
  if (form.emergencyPhone.trim()) settings.emergencyPhone = form.emergencyPhone.trim();
  return Object.keys(settings).length ? settings : null;
}

const EMPTY_ITEM_FORM: ItemFormState = {
  name: "",
  price: "",
  description: "",
};

export function BusinessMenuPage() {
  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [menus, setMenus] = useState<BusinessMenu[]>([]);
  const [linkedCards, setLinkedCards] = useState<BusinessCardLink[]>([]);
  const [selectedMenuId, setSelectedMenuId] = useState("");

  const [businessForm, setBusinessForm] =
    useState<BusinessFormState>(EMPTY_BUSINESS_FORM);
  const [businessPhoto, setBusinessPhoto] = useState<File | null>(null);
  const [linkCardId, setLinkCardId] = useState("");
  const [newMenuTitle, setNewMenuTitle] = useState("");
  const [itemForm, setItemForm] = useState<ItemFormState>(EMPTY_ITEM_FORM);
  const [itemPhoto, setItemPhoto] = useState<File | null>(null);
  const [showMenuForm, setShowMenuForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBusiness, setIsSavingBusiness] = useState(false);
  const [isLinkingCard, setIsLinkingCard] = useState(false);
  const [isCreatingMenu, setIsCreatingMenu] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Pagination — menu items
  const ITEMS_PER_PAGE = 5;
  const [itemPage, setItemPage] = useState(1);

  const selectedMenu = menus.find((menu) => menu.id === selectedMenuId) || null;

  useEffect(() => {
    void initializePage();
  }, []);

  useEffect(() => {
    if (!menus.length) {
      setSelectedMenuId("");
      return;
    }
    if (!menus.some((menu) => menu.id === selectedMenuId)) {
      setSelectedMenuId(menus[0].id);
    }
    setItemPage(1); // reset to first page when menu changes
  }, [menus, selectedMenuId]);

  const initializePage = async () => {
    setIsLoading(true);
    setError("");

    try {
      const profile = await businessApi.getMyBusiness();
      hydrateBusinessProfile(profile);

      const [cards, menuData] = await Promise.all([
        loadBusinessCardsSafe(),
        loadMenusSafe(),
      ]);

      setLinkedCards(cards);
      setMenus(menuData);
    } catch (err) {
      if (isNotFoundError(err)) {
        setBusiness(null);
        setBusinessForm(EMPTY_BUSINESS_FORM);
        setLinkedCards([]);
        setMenus([]);
      } else {
        setError(getErrorMessage(err));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const hydrateBusinessProfile = (profile: BusinessProfile) => {
    setBusiness(profile);
    setBusinessForm({
      name: profile.name || "",
      businessType: profile.businessType ?? "RESTAURANT",
      description: profile.description || "",
      location: profile.location || "",
      phone: profile.phone || "",
      email: profile.email || "",
      website: profile.website || "",
      paymentCode: profile.paymentCode || "",
      ...settingsFromProfile(profile.settings),
    });
  };

  const loadBusinessCardsSafe = async () => {
    try {
      return await businessApi.getMyBusinessCards();
    } catch (err) {
      if (isNotFoundError(err)) return [];
      throw err;
    }
  };

  const loadMenusSafe = async () => {
    try {
      const { menus } = await menuApi.getMenus();
      return menus;
    } catch (err) {
      if (isNotFoundError(err)) return [];
      throw err;
    }
  };

  const refreshAfterBusinessChange = async () => {
    const profile = await businessApi.getMyBusiness();
    hydrateBusinessProfile(profile);

    const [cards, menuData] = await Promise.all([
      loadBusinessCardsSafe(),
      loadMenusSafe(),
    ]);

    setLinkedCards(cards);
    setMenus(menuData);
  };

  const updateBusinessField = (
    field: keyof BusinessFormState,
    value: string,
  ) => {
    setBusinessForm((current) => ({ ...current, [field]: value }));
  };

  const updateItemField = (field: keyof ItemFormState, value: string) => {
    setItemForm((current) => ({ ...current, [field]: value }));
  };

  const handleSaveBusiness = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!businessForm.name.trim()) {
      setError("Business name is required.");
      return;
    }

    setIsSavingBusiness(true);

    try {
      await businessApi.upsertBusinessProfile(
        {
          name: businessForm.name.trim(),
          businessType: businessForm.businessType,
          category: BUSINESS_TYPE_LABELS[businessForm.businessType].toLowerCase(),
          description: businessForm.description.trim(),
          location: businessForm.location.trim(),
          phone: businessForm.phone.trim(),
          email: businessForm.email.trim(),
          website: businessForm.website.trim(),
          paymentCode: businessForm.paymentCode.trim(),
          settings: buildSettingsPayload(businessForm),
        },
        businessPhoto,
      );

      setBusinessPhoto(null);
      await refreshAfterBusinessChange();
      setSuccess("Business profile saved successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSavingBusiness(false);
    }
  };

  const handleLinkCard = async () => {
    if (!linkCardId.trim()) {
      setError("Enter a card ID before linking it to your business.");
      return;
    }

    setError("");
    setSuccess("");
    setIsLinkingCard(true);

    try {
      await businessApi.linkCardToBusiness(linkCardId.trim().toUpperCase());
      setLinkCardId("");
      setLinkedCards(await loadBusinessCardsSafe());
      setSuccess("Card linked to your business successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLinkingCard(false);
    }
  };

  const handleCreateMenu = async () => {
    if (!newMenuTitle.trim()) {
      setError("Menu title is required.");
      return;
    }

    setError("");
    setSuccess("");
    setIsCreatingMenu(true);

    try {
      await menuApi.createMenu(newMenuTitle.trim());
      const updatedMenus = await loadMenusSafe();
      setMenus(updatedMenus);
      setNewMenuTitle("");
      setShowMenuForm(false);
      setSuccess("Menu created successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsCreatingMenu(false);
    }
  };

  const handleAddItem = async () => {
    if (!selectedMenuId) {
      setError("Select a menu before adding an item.");
      return;
    }

    if (!itemForm.name.trim() || !itemForm.price.trim()) {
      setError("Item name and price are required.");
      return;
    }

    const parsedPrice = Number(itemForm.price);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      setError("Enter a valid item price.");
      return;
    }

    setError("");
    setSuccess("");
    setIsAddingItem(true);

    try {
      await menuApi.addMenuItem(
        selectedMenuId,
        {
          name: itemForm.name.trim(),
          price: parsedPrice,
          description: itemForm.description.trim(),
        },
        itemPhoto,
      );

      const updatedMenus = await loadMenusSafe();
      setMenus(updatedMenus);
      setItemForm(EMPTY_ITEM_FORM);
      setItemPhoto(null);
      setShowItemForm(false);
      setSuccess("Menu item added successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsAddingItem(false);
    }
  };

  const handleDeleteItem = async (menuId: string, itemId: string) => {
    const confirmed = window.confirm(
      "Delete this menu item? This action cannot be undone.",
    );

    if (!confirmed) return;

    setError("");
    setSuccess("");

    try {
      await menuApi.deleteMenuItem(menuId, itemId);
      setMenus(await loadMenusSafe());
      setSuccess("Menu item deleted successfully.");
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Manage your business profile, link cards, and publish menus to your
        public business card.
      </p>

      <div className="space-y-6">
        {error && <Alert message={error} />}
        {success && <Alert message={success} type="success" />}

        <form
          onSubmit={handleSaveBusiness}
          className="card-soft rounded-2xl bg-white dark:bg-gray-900 p-6"
        >
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Business Profile
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Save this first to unlock linked cards and menus.
              </p>
            </div>
            <Button type="submit" isLoading={isSavingBusiness}>
              Save Profile
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Business Name"
              value={businessForm.name}
              onChange={(event) =>
                updateBusinessField("name", event.target.value)
              }
              placeholder="Mama Restaurant"
              required
            />
            <Select
              label="Business Type"
              value={businessForm.businessType}
              onChange={(event) =>
                updateBusinessField(
                  "businessType",
                  event.target.value as BusinessType,
                )
              }
              options={BUSINESS_TYPES}
              required
            />
            <Input
              label="Phone"
              value={businessForm.phone}
              onChange={(event) =>
                updateBusinessField("phone", event.target.value)
              }
              placeholder="0788123456"
            />
            <Input
              label="MoMo Payment Code"
              value={businessForm.paymentCode}
              onChange={(event) =>
                updateBusinessField("paymentCode", event.target.value)
              }
              placeholder="e.g. 182839"
            />
            <Input
              label="Email"
              value={businessForm.email}
              onChange={(event) =>
                updateBusinessField("email", event.target.value)
              }
              placeholder="info@example.com"
              type="email"
            />
            <Input
              label="Location"
              value={businessForm.location}
              onChange={(event) =>
                updateBusinessField("location", event.target.value)
              }
              placeholder="Kigali, Rwanda"
            />
            <Input
              label="Website"
              value={businessForm.website}
              onChange={(event) =>
                updateBusinessField("website", event.target.value)
              }
              placeholder="https://example.com"
              type="url"
            />
            <div className="md:col-span-2">
              <Textarea
                label="Description"
                value={businessForm.description}
                onChange={(event) =>
                  updateBusinessField("description", event.target.value)
                }
                placeholder="Tell visitors about your business"
                rows={4}
              />
            </div>

            <div className="md:col-span-2 rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/80 p-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                Guest &amp; operating info
              </h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Shown on your public card. WiFi and check-in details are especially useful for hotels and motels.
              </p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Input
                  label="Operating hours"
                  value={businessForm.operatingHours}
                  onChange={(event) =>
                    updateBusinessField("operatingHours", event.target.value)
                  }
                  placeholder="Mon–Sun 8am–10pm"
                />
                <Input
                  label="Emergency phone"
                  value={businessForm.emergencyPhone}
                  onChange={(event) =>
                    updateBusinessField("emergencyPhone", event.target.value)
                  }
                  placeholder="0788000000"
                />
                {(businessForm.businessType === "HOTEL" ||
                  businessForm.businessType === "MOTEL") && (
                  <>
                    <Input
                      label="WiFi password"
                      value={businessForm.wifiPassword}
                      onChange={(event) =>
                        updateBusinessField("wifiPassword", event.target.value)
                      }
                      placeholder="guest-wifi-2024"
                    />
                    <Input
                      label="Check-in time"
                      value={businessForm.checkInTime}
                      onChange={(event) =>
                        updateBusinessField("checkInTime", event.target.value)
                      }
                      placeholder="2:00 PM"
                    />
                    <Input
                      label="Check-out time"
                      value={businessForm.checkOutTime}
                      onChange={(event) =>
                        updateBusinessField("checkOutTime", event.target.value)
                      }
                      placeholder="11:00 AM"
                    />
                  </>
                )}
              </div>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Business Photo
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 dark:bg-gray-950 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:border-[#DE3A16] hover:bg-white dark:bg-gray-900">
                <HiOutlinePhotograph className="text-lg text-[#DE3A16]" />
                <span>{businessPhoto?.name || "Choose an image to upload"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) =>
                    setBusinessPhoto(event.target.files?.[0] || null)
                  }
                />
              </label>
            </div>
          </div>
        </form>

        <div className="grid gap-6 lg:grid-cols-[1.15fr,0.85fr]">
          <div className="card-soft rounded-2xl bg-white dark:bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Linked Cards
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Connect physical cards to this business profile.
                </p>
              </div>
            </div>

            <div className="mb-5 flex flex-col gap-3 md:flex-row">
              <div className="flex-1">
                <Input
                  label="Card ID"
                  value={linkCardId}
                  onChange={(event) => setLinkCardId(event.target.value)}
                  placeholder="CARD_XXXXXX"
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleLinkCard}
                  isLoading={isLinkingCard}
                  disabled={!business}
                >
                  Link Card
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {linkedCards.map((card) => (
                <div
                  key={card.id}
                  className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 px-4 py-3"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {card.cardId}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {card._count?.scans ?? 0} scans
                    </p>
                  </div>
                  <a
                    href={getPublicCardUrl(card.cardId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#DE3A16] transition-colors hover:text-brand-700"
                  >
                    <HiOutlineLink className="text-base" />
                    Open
                  </a>
                </div>
              ))}

              {linkedCards.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No business cards linked yet.
                </div>
              )}
            </div>
          </div>

          <div className="card-soft rounded-2xl bg-white dark:bg-gray-900 p-6">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Menus
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Create menu sections such as Breakfast, Drinks, or Desserts.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMenuForm((current) => !current)}
                disabled={!business}
                className="rounded-lg bg-brand-100 p-2 text-brand-700 transition-colors hover:bg-brand-200"
              >
                <HiOutlinePlus />
              </button>
            </div>

            {showMenuForm && (
              <div className="mb-4 flex flex-col gap-3 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950 p-4">
                <Input
                  label="Menu Title"
                  value={newMenuTitle}
                  onChange={(event) => setNewMenuTitle(event.target.value)}
                  placeholder="Breakfast Menu"
                />
                <div className="flex justify-end">
                  <Button onClick={handleCreateMenu} isLoading={isCreatingMenu}>
                    Create Menu
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              {menus.map((menu) => (
                <button
                  key={menu.id}
                  type="button"
                  onClick={() => setSelectedMenuId(menu.id)}
                  className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition-all ${
                    selectedMenuId === menu.id
                      ? "bg-[#DE3A16] text-white shadow-md"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                >
                  {menu.title}
                </button>
              ))}

              {menus.length === 0 && (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  No menus created yet.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="card-soft rounded-2xl bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 p-5">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {selectedMenu ? `${selectedMenu.title} Items` : "Menu Items"}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Add food, drinks, and services that should appear on the public
                business card.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowItemForm((current) => !current)}
              disabled={!business || !selectedMenu}
              className="btn-primary px-4 py-2 text-sm disabled:opacity-50"
            >
              <HiOutlinePlus className="mr-2" />
              Add Item
            </button>
          </div>

          {showItemForm && selectedMenu && (
            <div className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/60 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Item Name"
                  value={itemForm.name}
                  onChange={(event) => updateItemField("name", event.target.value)}
                  placeholder="African Tea"
                />
                <Input
                  label="Price"
                  value={itemForm.price}
                  onChange={(event) => updateItemField("price", event.target.value)}
                  placeholder="2500"
                  type="number"
                  min="0"
                  step="0.01"
                />
                <div className="md:col-span-2">
                  <Textarea
                    label="Description"
                    value={itemForm.description}
                    onChange={(event) =>
                      updateItemField("description", event.target.value)
                    }
                    placeholder="Spiced ginger and milk tea"
                    rows={3}
                  />
                </div>
                <div className="space-y-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Item Photo
                  </label>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-white dark:bg-gray-900 px-4 py-3 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:border-[#DE3A16]">
                    <HiOutlinePhotograph className="text-lg text-[#DE3A16]" />
                    <span>{itemPhoto?.name || "Choose an image to upload"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(event) =>
                        setItemPhoto(event.target.files?.[0] || null)
                      }
                    />
                  </label>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button onClick={handleAddItem} isLoading={isAddingItem}>
                  Add Item
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-4 p-5">
            {(() => {
              const allItems = selectedMenu?.items ?? [];
              const totalItemPages = Math.ceil(allItems.length / ITEMS_PER_PAGE);
              const pagedItems = allItems.slice((itemPage - 1) * ITEMS_PER_PAGE, itemPage * ITEMS_PER_PAGE);
              return (
                <>
                  {pagedItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-950/30 p-4 transition-shadow hover:shadow-md"
                    >
                      {/* Image — larger, zoom on hover, clipped */}
                      <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="h-full w-full object-cover transition-transform duration-300 ease-out hover:scale-110"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gray-100 dark:bg-gray-800">
                            <HiOutlinePhotograph className="text-2xl text-gray-400" />
                          </div>
                        )}
                      </div>
                      {/* Content column */}
                      <div className="flex-grow min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="truncate font-bold text-gray-900 dark:text-gray-100">{item.name}</h3>
                          <span className="flex-shrink-0 font-semibold text-[#DE3A16]">RWF {item.price.toLocaleString()}</span>
                        </div>
                        {item.description && (
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.description}</p>
                        )}
                      </div>
                      {/* Delete button aligned with image */}
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(selectedMenu!.id, item.id)}
                        className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-2 text-gray-400 shadow-sm dark:shadow-none transition-colors hover:border-red-300 hover:text-red-600"
                      >
                        <HiOutlineTrash />
                      </button>
                    </div>
                  ))}

                  {!selectedMenu && (
                    <div className="py-10 text-center text-gray-500 dark:text-gray-400">Create or select a menu to manage its items.</div>
                  )}

                  {selectedMenu && allItems.length === 0 && (
                    <div className="py-10 text-center text-gray-500 dark:text-gray-400">No items found for this menu.</div>
                  )}

                  {totalItemPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Page {itemPage} of {totalItemPages}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setItemPage((p) => Math.max(1, p - 1))}
                          disabled={itemPage === 1}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:bg-gray-950 disabled:opacity-40"
                        >
                          Previous
                        </button>
                        <button
                          onClick={() => setItemPage((p) => Math.min(totalItemPages, p + 1))}
                          disabled={itemPage === totalItemPages}
                          className="rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:bg-gray-950 disabled:opacity-40"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>

      </div>
    </div>
  );
}

function isNotFoundError(error: unknown) {
  return axios.isAxiosError(error) && error.response?.status === 404;
}
