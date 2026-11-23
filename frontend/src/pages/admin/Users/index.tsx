import { useEffect, useRef, useState, type FormEvent } from "react";
import { Pencil, ShieldCheck, UserPlus, UsersRound } from "lucide-react";
import { apiRequest } from "@/api/client";
import { AdminSidebar, Button, SystemMessage, TextField } from "@/components";
import {
  createEmployee,
  getSession,
  type AuthUser,
} from "@/services/auth.service";
import { PasswordStrength } from "@/components/ui/inputs/PasswordStrength";
import { passwordStrength } from "@/utils/password-strength";
import { roleLabels } from "@/routers/admin-access";
import "../Settings/styles.scss";
import "./styles.scss";

type ManagedUser = AuthUser & { active: boolean };
const listUsers = (signal?: AbortSignal) =>
  apiRequest<ManagedUser[]>("/users", { signal });

export default function Users({
  onNavigate,
}: {
  onNavigate: (id: string) => void;
}) {
  const role = getSession()?.user.role;
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [selected, setSelected] = useState<ManagedUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const formTitle = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (creating || selected) formTitle.current?.focus();
  }, [creating, selected]);

  useEffect(() => {
    const controller = new AbortController();
    listUsers(controller.signal)
      .then(setUsers)
      .catch((reason: unknown) => {
        if (!controller.signal.aborted)
          setError(
            reason instanceof Error
              ? reason.message
              : "Falha ao carregar usuários.",
          );
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const fields = new FormData(event.currentTarget);
    const name = String(fields.get("name") ?? "");
    const email = String(fields.get("email") ?? "");
    const password = String(fields.get("password") ?? "");
    if (creating && !passwordStrength(password).valid) {
      setError("A senha precisa atender aos requisitos de segurança.");
      return;
    }
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (creating) {
        await createEmployee(name, email, password);
      } else if (selected) {
        await apiRequest<ManagedUser>(
          `/users/${encodeURIComponent(selected.id)}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name,
              active: fields.has("active"),
              ...(role === "PLATFORM_ADMIN" && {
                email,
                role: fields.get("role"),
                ...(password && { password }),
              }),
            }),
          },
        );
      }
      setCreating(false);
      setSelected(null);
      setUsers(await listUsers());
      setNotice("Usuário salvo.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Falha ao salvar usuário.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="settings-page">
      <AdminSidebar activeId="users" showAvatar onChange={onNavigate} />
      <main className="settings-content users-content">
        <header className="settings-heading users-heading">
          <div>
            <h1>Usuários</h1>
            <p>Gerencie as contas e os acessos da equipe.</p>
          </div>
          {role === "PLATFORM_ADMIN" && (
            <Button
              onClick={() => {
                setSelected(null);
                setNewPassword("");
                setCreating(true);
              }}
            >
              <UserPlus aria-hidden="true" />
              Adicionar funcionário
            </Button>
          )}
        </header>
        {error && <SystemMessage variant="error">{error}</SystemMessage>}
        {notice && <SystemMessage variant="success">{notice}</SystemMessage>}
        {(creating || selected) && (
          <form
            className="settings-card users-form"
            key={selected?.id ?? "new"}
            onSubmit={submit}
          >
            <header className="settings-card-heading">
              <span className="settings-section-icon">
                {creating ? (
                  <UserPlus aria-hidden="true" />
                ) : (
                  <Pencil aria-hidden="true" />
                )}
              </span>
              <div>
                <h2 ref={formTitle} tabIndex={-1}>
                  {creating ? "Novo funcionário" : "Editar usuário"}
                </h2>
                <p>
                  {creating
                    ? "Preencha os dados para criar a conta."
                    : selected?.email}
                </p>
              </div>
            </header>
            <fieldset className="users-form-fields" disabled={busy}>
              <TextField
                id="managed-user-name"
                name="name"
                label="Nome"
                defaultValue={selected?.name}
                required
                maxLength={120}
              />
              {role === "PLATFORM_ADMIN" && (
                <>
                  <TextField
                    id="managed-user-email"
                    name="email"
                    label="E-mail"
                    type="email"
                    defaultValue={selected?.email}
                    required
                    maxLength={180}
                  />
                  <TextField
                    id="managed-user-password"
                    name="password"
                    label={creating ? "Senha" : "Nova senha (opcional)"}
                    type="password"
                    required={creating}
                    minLength={8}
                    maxLength={128}
                    autoComplete="new-password"
                    onChange={
                      creating
                        ? (event) => setNewPassword(event.target.value)
                        : undefined
                    }
                    aria-describedby={
                      creating ? "managed-user-password-strength" : undefined
                    }
                  />
                  {creating && (
                    <PasswordStrength
                      password={newPassword}
                      id="managed-user-password-strength"
                    />
                  )}
                  {selected && (
                    <label className="users-role-field">
                      Perfil
                      <select name="role" defaultValue={selected.role}>
                        <option value="EMPLOYEE">Funcionário</option>
                        <option value="ADMIN">Administrador</option>
                      </select>
                    </label>
                  )}
                </>
              )}
              {selected && (
                <label className="users-active-field">
                  <input
                    type="checkbox"
                    name="active"
                    defaultChecked={selected.active}
                  />{" "}
                  Conta ativa
                </label>
              )}
            </fieldset>
            <div className="settings-restaurant-actions">
              <Button
                type="button"
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  setCreating(false);
                  setSelected(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" loading={busy}>
                Salvar usuário
              </Button>
            </div>
          </form>
        )}
        <div className="users-layout">
          <section
            className="settings-card users-directory"
            aria-labelledby="users-directory-title"
          >
            <header className="settings-card-heading users-directory-heading">
              <span className="settings-section-icon">
                <UsersRound aria-hidden="true" />
              </span>
              <div>
                <h2 id="users-directory-title">Contas cadastradas</h2>
                {!loading && (
                  <p>
                    {users.length} {users.length === 1 ? "conta" : "contas"}
                  </p>
                )}
              </div>
            </header>
            {loading ? (
              <p className="users-list-message" role="status">
                Carregando contas…
              </p>
            ) : users.length === 0 ? (
              <p className="users-list-message">Nenhuma conta para exibir.</p>
            ) : (
              <ul className="users-list">
                {users.map((user) => (
                  <li key={user.id} className="users-list-row">
                    <div className="users-identity">
                      <span className="users-avatar" aria-hidden="true">
                        {user.name
                          .trim()
                          .split(/\s+/)
                          .slice(0, 2)
                          .map((part) => part[0])
                          .join("")
                          .toUpperCase()}
                      </span>
                      <div>
                        <strong>{user.name}</strong>
                        <span>{user.email}</span>
                      </div>
                    </div>
                    <div className="users-labels">
                      <span className="users-role">
                        {roleLabels[user.role]}
                      </span>
                      <span
                        className={`users-status${user.active ? " is-active" : ""}`}
                      >
                        {user.active ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                    {role === "PLATFORM_ADMIN" &&
                      user.role !== "PLATFORM_ADMIN" && (
                        <Button
                          variant="secondary"
                          disabled={busy}
                          aria-label={`Editar ${user.name}`}
                          onClick={() => {
                            setCreating(false);
                            setSelected(user);
                          }}
                        >
                          <Pencil aria-hidden="true" />
                          Editar
                        </Button>
                      )}
                  </li>
                ))}
              </ul>
            )}
          </section>
          <aside
            className="settings-card users-permissions"
            aria-labelledby="users-permissions-title"
          >
            <header className="settings-card-heading">
              <span className="settings-section-icon">
                <ShieldCheck aria-hidden="true" />
              </span>
              <div>
                <h2 id="users-permissions-title">Permissões dos perfis</h2>
              </div>
            </header>
            <dl>
              <div>
                <dt>{roleLabels.ADMIN}</dt>
                <dd>Gestão do restaurante e relatórios financeiros.</dd>
              </div>
              <div>
                <dt>{roleLabels.EMPLOYEE}</dt>
                <dd>Operação de mesas, pedidos e pagamentos.</dd>
              </div>
              <div>
                <dt>{roleLabels.PLATFORM_ADMIN}</dt>
                <dd>
                  Suporte ao restaurante e gestão de usuários, com acesso a
                  pedidos sem valores.
                </dd>
              </div>
            </dl>
          </aside>
        </div>
      </main>
    </div>
  );
}
