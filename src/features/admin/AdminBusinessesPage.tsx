import { useEffect, useState } from "react";
import { adminApi, getErrorMessage } from "../../services/api";
import { AdminBusinessSummary } from "../../types";
import { Alert, PageSpinner } from "../../components/ui";
import {
  HiOutlineChevronLeft,
  HiOutlineChevronRight,
  HiOutlineOfficeBuilding,
} from "react-icons/hi";

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

      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">All Businesses</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {total} business{total === 1 ? "" : "es"} registered
          </p>
        </div>

        {businesses.length === 0 ? (
          <div className="p-10 text-center">
            <HiOutlineOfficeBuilding className="text-gray-300 text-6xl mx-auto mb-4" />
            <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-2">No businesses yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              Business profiles appear here when users register as a business.
            </p>
          </div>
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
                        className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {businesses.map((business) => (
                    <tr
                      key={business.id}
                      className="hover:bg-gray-50 dark:bg-gray-950/50 transition-colors"
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
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium text-center">
                        {business.cards.length}
                      </td>
                      <td className="px-4 py-3 text-gray-700 dark:text-gray-300 font-medium text-center">
                        {business._count.menus}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(business.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {(page - 1) * ITEMS_PER_PAGE + 1}–
                  {Math.min(page * ITEMS_PER_PAGE, total)} of {total}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    aria-label="Previous page"
                  >
                    <HiOutlineChevronLeft className="text-gray-600 dark:text-gray-400 text-base" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-30 transition-colors"
                    aria-label="Next page"
                  >
                    <HiOutlineChevronRight className="text-gray-600 dark:text-gray-400 text-base" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
