import { FormEvent, useEffect, useState } from "react";
import {
  Alert,
  Button,
  PageSpinner,
  PanelCard,
  SectionHeader,
  formControlClass,
} from "../../components/ui";
import { IconUsers } from "../../components/icons/DashboardIcons";
import { getErrorMessage, staffApi } from "../../services/api";
import type { BusinessStaffMember } from "../../types";

export function BusinessStaffPage() {
  const [staff, setStaff] = useState<BusinessStaffMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    const data = await staffApi.list();
    setStaff(data);
  };

  useEffect(() => {
    setIsLoading(true);
    load()
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, []);

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSubmitting(true);
    try {
      await staffApi.create({
        name,
        email,
        password,
        staffRole: "ORDERS",
        station: "ALL",
      });
      setName("");
      setEmail("");
      setPassword("");
      setSuccess("Staff account created. They can log in and open the orders portal.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (member: BusinessStaffMember) => {
    setError("");
    try {
      await staffApi.setActive(member.id, !member.isActive);
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (member: BusinessStaffMember) => {
    if (!window.confirm(`Remove ${member.user.name}? They will lose portal access.`)) return;
    setError("");
    try {
      await staffApi.remove(member.id);
      setSuccess("Staff removed.");
      await load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="space-y-6">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Create logins for people who take or prepare orders — kitchen, front desk, or
        whoever handles guests. They use the live orders portal without owning the business
        account.
      </p>

      {error && <Alert message={error} />}
      {success && <Alert message={success} type="success" />}

      <PanelCard>
        <SectionHeader
          title="Add staff"
          description="They sign in with this email and land on the orders portal."
          icon={<IconUsers size={18} />}
          accent="brand"
        />
        <form onSubmit={handleCreate} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            className={formControlClass()}
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <input
            className={formControlClass()}
            placeholder="Staff email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            className={formControlClass()}
            placeholder="Temporary password (min 8)"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div className="flex items-end sm:col-span-2">
            <Button type="submit" disabled={submitting} className="w-full sm:w-auto">
              {submitting ? "Creating…" : "Create staff login"}
            </Button>
          </div>
        </form>
      </PanelCard>

      <PanelCard>
        <SectionHeader
          title="Team"
          description="Active staff receive live order updates."
          icon={<IconUsers size={18} />}
          accent="brand"
        />
        <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-800">
          {staff.length === 0 && (
            <p className="py-10 text-center text-sm text-gray-500">No staff yet.</p>
          )}
          {staff.map((member) => (
            <div
              key={member.id}
              className="flex flex-wrap items-center justify-between gap-3 py-4"
            >
              <div>
                <p className="font-semibold text-gray-900 dark:text-gray-100">
                  {member.user.name}
                </p>
                <p className="text-xs text-gray-500">{member.user.email}</p>
                <p className="mt-1 text-[11px] font-medium uppercase tracking-wide text-gray-400">
                  {member.isActive ? "Active" : "Disabled"}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => toggleActive(member)}>
                  {member.isActive ? "Disable" : "Enable"}
                </Button>
                <Button
                  variant="ghost"
                  className="text-red-500"
                  onClick={() => remove(member)}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
