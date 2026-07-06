import { useEffect, useState } from "react";
import { adminApi, getErrorMessage } from "../../services/api";
import { AdminBusinessSummary } from "../../types";
import {
  Alert,
  EmptyState,
  PageSpinner,
  Pagination,
  PanelCard,
  SectionHeader,
} from "../../components/ui";
import { IconStorefront } from "../../components/icons/DashboardIcons";

const ITEMS_PER_PAGE = 10;

export function AdminBusinessesPage() {
  const [businesses, setBusinesses] = useState<AdminBusinessSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setIsLoading(true);
    adminApi
      .getAllBusinesses(page, ITEMS_PER_PAGE)
      .then((data) => {
        setBusinesses(data.businesses);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [page]);

  const totalPages = Math.max(1, Math.ceil(total / ITEMS_PER_PAGE));

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-4">
      {error && <Alert message={error} />}

      <PanelCard>
        <SectionHeader
          title="All Businesses"
          description={`${total} business${total === 1 ? "" : "es"} registered`}
          icon={<IconStorefront size={18} />}
          accent="brand"
        />

        {businesses.length === 0 ? (
          <EmptyState
            icon={<IconStorefront size={22} />}
            title="No businesses yet"
            description="Business profiles appear here when users register as a business."
            accent="slate"
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-950">
                  <tr>
                    {[
                      "Business",
                      "Category",
                      "Owner",
                      "Cards",
                      "Menu Items",
                      "Joined",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                  {businesses.map((business) => (
                    <tr
                      key={business.id}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 dark:text-gray-100">
                          {business.name}
                        </p>
                        {business.location && (
                          <p className="text-xs text-gray-400">
                            {business.location}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {business.category}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 dark:text-gray-200">
                          {business.user.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {business.user.email}
                        </p>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                        {business.cards.length}
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-gray-700 dark:text-gray-300">
                        {business._count.menus}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400">
                        {new Date(business.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                <Pagination
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </PanelCard>
    </div>
  );
}
