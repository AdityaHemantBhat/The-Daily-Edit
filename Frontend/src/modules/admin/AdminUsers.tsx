import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../infrastructure/api/repositories';
import { Alert, Badge, Button, ConfirmDialog, Field, Input, Pagination, Select } from '../../presentation/primitives';
import { formatDate } from '../../domain/value-objects/format';
import { SkeletonTable } from '../../presentation/components/skeletons';
import { useAuth } from '../../application/state/authContext';

interface UserRow {
  id: string; email: string; username: string; name: string; isActive: boolean; createdAt: string;
  role: { id: string; name: string };
  sessions: { id: string; expiresAt: string }[];
}

interface RoleRow { id: string; name: string; description: string | null; permissions: string[] }

const EMPTY_NEW = { email: '', username: '', name: '', password: '', roleId: '' };
const USERS_PER_PAGE = 10;

export default function AdminUsers() {
  const [viewPage, setViewPage] = useState(1);
  const qc = useQueryClient();
  const { user: me } = useAuth();
  const { data: users, isLoading } = useQuery({ queryKey: ['admin-users'], queryFn: adminApi.users });
  const { data: roles } = useQuery({ queryKey: ['admin-roles'], queryFn: adminApi.roles });
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState(EMPTY_NEW);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const invalidate = () => void qc.invalidateQueries({ queryKey: ['admin-users'] });

  const create = useMutation({
    mutationFn: () => adminApi.createUser(newUser),
    onSuccess: () => { setCreating(false); setNewUser(EMPTY_NEW); setError(null); invalidate(); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Create failed'),
  });

  const update = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => adminApi.updateUser(id, patch),
    onSuccess: () => { setError(null); invalidate(); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Update failed'),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminApi.deleteUser(id),
    onSuccess: () => { setDeleting(null); invalidate(); },
    onError: (err) => setError(err instanceof Error ? err.message : 'Delete failed'),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Users & roles</h1>
        <Button onClick={() => setCreating(true)}>+ New user</Button>
      </div>
      {error && <Alert>{error}</Alert>}

      <section>
        <h2 className="mb-3 text-[0.65rem] font-bold uppercase tracking-widest text-ink-500">Roles</h2>
        <div className="flex flex-wrap gap-3">
          {((roles?.items ?? []) as RoleRow[]).map((r) => (
            <div key={r.id} className="min-w-72 flex-1 border border-rule-dark bg-white p-4">
              <p className="font-semibold">{r.name}</p>
              {r.description && <p className="text-xs text-ink-500">{r.description}</p>}
              <p className="mt-2 font-mono text-[0.65rem] text-ink-400">{r.permissions.join(', ')}</p>
            </div>
          ))}
        </div>
      </section>

      {isLoading ? (
        <SkeletonTable rows={3} cols={5} />
      ) : (
        <>
          {(users?.items ?? []).length > USERS_PER_PAGE && (
            <Pagination
              page={viewPage}
              pages={Math.ceil((users?.items.length ?? 0) / USERS_PER_PAGE)}
              onPage={setViewPage}
              label="Users"
            />
          )}
          <div className="overflow-x-auto border border-rule-dark bg-white">
          <table className="w-full table-fixed text-left text-sm">
            <thead><tr className="border-b border-rule-dark text-[0.65rem] uppercase tracking-widest text-ink-500">
              <th className="px-4 py-3">User</th><th className="w-44 px-4 py-3">Role</th><th className="w-28 px-4 py-3">Status</th><th className="w-24 px-4 py-3">Sessions</th><th className="w-36 px-4 py-3 text-right">Actions</th>
            </tr></thead>
            <tbody className="divide-y divide-rule">
              {((users?.items ?? []) as UserRow[]).slice((viewPage - 1) * USERS_PER_PAGE, viewPage * USERS_PER_PAGE).map((u) => (
                <tr key={u.id}>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{u.name} {u.id === me?.id && <span className="text-xs text-ink-400">(you)</span>}</p>
                    <p className="text-xs text-ink-500">{u.username} · {u.email} · joined {formatDate(u.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Select
                      value={u.role.id}
                      className="!py-1.5 !text-xs"
                      onChange={(e) => update.mutate({ id: u.id, patch: { roleId: e.target.value } })}
                      aria-label={`Role for ${u.username}`}
                    >
                      {((roles?.items ?? []) as RoleRow[]).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Select>
                  </td>
                  <td className="px-4 py-3">
                    {u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="red">Deactivated</Badge>}
                  </td>
                  <td className="px-4 py-3 text-ink-500">{u.sessions.length}</td>
                  <td className="px-4 py-3 text-right">
                    {u.id !== me?.id && (
                      <>
                        <button
                          onClick={() => update.mutate({ id: u.id, patch: { isActive: !u.isActive } })}
                          className="text-xs font-semibold text-ink-700 hover:text-gold-700"
                        >
                          {u.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                        <button onClick={() => setDeleting(u.id)} className="ml-3 text-xs font-semibold text-red-700 hover:underline">Delete</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}

      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/50 p-4" onClick={() => setCreating(false)}>
          <form className="w-full max-w-md space-y-4 bg-white p-6" onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => { e.preventDefault(); create.mutate(); }}>
            <h2 className="font-serif text-2xl font-semibold">New admin user</h2>
            <Field label="Name"><Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} required /></Field>
            <Field label="Email"><Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} required /></Field>
            <Field label="Username"><Input value={newUser.username} onChange={(e) => setNewUser({ ...newUser, username: e.target.value })} required /></Field>
            <Field label="Temporary password" hint="Min 10 chars, upper + lower + digit. The user should change it after first login.">
              <Input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} required />
            </Field>
            <Field label="Role">
              <Select value={newUser.roleId} onChange={(e) => setNewUser({ ...newUser, roleId: e.target.value })} required>
                <option value="">Select…</option>
                {((roles?.items ?? []) as RoleRow[]).map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </Select>
            </Field>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setCreating(false)}>Cancel</Button>
              <Button type="submit" disabled={create.isPending}>{create.isPending ? 'Creating…' : 'Create user'}</Button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        body="Their sessions are revoked immediately and the account is removed."
        busy={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting)}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
