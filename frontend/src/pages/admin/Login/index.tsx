import { useDocumentClass } from "@/hooks/useDocumentClass";
import { useState, type ChangeEvent, type FormEvent } from "react";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  NotebookPen,
  Utensils,
} from "lucide-react";
import { Button, TextField } from "@/components";
import logoTipo from "@/assets/logotipo/logo_principal.png";
import { login } from "@/services/auth.service";
import { PasswordStrength } from "@/components/ui/inputs/PasswordStrength";
import "./styles.scss";

type LoginProps = {
  onEnter: () => void;
  initialMode?: "login" | "reset";
  onReturnToLogin?: () => void;
};

export default function Login({
  onEnter,
  initialMode = "login",
  onReturnToLogin,
}: LoginProps) {
  useDocumentClass("login-active");

  const [mode, setMode] = useState<"login" | "recovery" | "reset">(
    initialMode,
  );
  const isRecovering = mode === "recovery";
  const isResetting = mode === "reset";
  const isCreatingPassword = isResetting;
  const [confirmPassword, setConfirmPassword] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRecovering || isResetting || loading) return;
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      onEnter();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.target.value);
    // A confirmação deve poder ser validada novamente após editar qualquer senha.
    const confirmation =
      event.target.form?.elements.namedItem("confirmPassword");
    if (confirmation instanceof HTMLInputElement)
      confirmation.setCustomValidity("");
  };

  const handleConfirmPasswordChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    event.target.setCustomValidity("");
    setConfirmPassword(event.target.value);
  };

  const switchMode = (nextMode: typeof mode) => {
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setError("");
  };

  return (
    <main className="login-page">
      <section className="login-intro" aria-labelledby="login-intro-title">
        <div className="login-brand">
          <img src={logoTipo} alt="" />
          <div>
            <strong>iServi</strong>
            <span>GESTÃO DO RESTAURANTE</span>
          </div>
        </div>
        <div className="login-intro-content">
          <span className="login-eyebrow">MAIS FLUIDEZ PARA SUA OPERAÇÃO</span>
          <h1 id="login-intro-title">
            Tudo à mesa.
            <br />
            Tudo sob controle.
          </h1>
          <p>
            Pedidos, mesas e cardápio em um só lugar. Mais tempo para cuidar de
            quem importa: seus clientes.
          </p>
          <ul className="login-features">
            <li>
              <LayoutDashboard aria-hidden="true" />
              <span>Acompanhe sua operação</span>
            </li>
            <li>
              <Utensils aria-hidden="true" />
              <span>Organize os atendimentos</span>
            </li>
            <li>
              <NotebookPen aria-hidden="true" />
              <span>Gerencie seu cardápio</span>
            </li>
          </ul>
        </div>
        <p className="login-intro-footer">Feito para quem recebe bem.</p>
      </section>
      <section className="login-access" aria-labelledby="login-title">
        <div className="login-card">
          <span className="login-access-label">ÁREA ADMINISTRATIVA</span>
          <h2 id="login-title">
            {isResetting
              ? "Crie sua nova senha"
              : isRecovering
                ? "Recuperar senha"
                : "Bem-vindo de volta!"}
          </h2>
          <p className="login-description">
            {isResetting
              ? "Escolha uma senha forte para proteger sua conta."
              : isRecovering
                ? "Informe o e-mail da sua conta para recuperar o acesso ao iServi."
                : "Acesse o iServi e acompanhe seu estabelecimento."}
          </p>
          <form key={mode} className="login-form" onSubmit={handleSubmit}>
            {!isResetting && (
              <TextField
                id="login-email"
                label="E-mail"
                type="email"
                autoComplete={isRecovering ? "email" : "username"}
                placeholder="seuemail@exemplo.com"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            )}
            {!isRecovering && (
              <div className="login-password">
                <TextField
                  id="login-password"
                  label={isResetting ? "Nova senha" : "Senha"}
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    isCreatingPassword ? "new-password" : "current-password"
                  }
                  placeholder={
                    isCreatingPassword
                      ? "Crie uma senha com pelo menos 8 caracteres"
                      : "Digite sua senha"
                  }
                  minLength={isCreatingPassword ? 8 : undefined}
                  maxLength={isCreatingPassword ? 128 : undefined}
                  aria-describedby={
                    isCreatingPassword ? "login-password-strength" : undefined
                  }
                  required
                  value={password}
                  onChange={handlePasswordChange}
                />
                <button
                  type="button"
                  className="login-password-toggle"
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" />
                  ) : (
                    <Eye aria-hidden="true" />
                  )}
                </button>
              </div>
            )}
            {isCreatingPassword && (
              <PasswordStrength
                password={password}
                id="login-password-strength"
              />
            )}
            {isCreatingPassword && (
              <TextField
                id="reset-confirm-password"
                name="confirmPassword"
                label="Confirmar senha"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="Digite a senha novamente"
                required
                maxLength={128}
                value={confirmPassword}
                onChange={handleConfirmPasswordChange}
              />
            )}
            {error && (
              <p className="login-error" role="alert">
                {error}
              </p>
            )}
            {isRecovering && (
              <p
                id="login-recovery-notice"
                className="login-recovery-notice"
                role="status"
              >
                O envio do link de recuperação por e-mail estará disponível em
                breve.
              </p>
            )}
            {isResetting && (
              <p
                id="login-reset-notice"
                className="login-recovery-notice"
                role="status"
              >
                A redefinição de senha estará disponível em breve.
              </p>
            )}
            <Button
              type="submit"
              loading={loading}
              disabled={
                isRecovering ||
                isResetting
              }
              aria-describedby={
                isRecovering
                  ? "login-recovery-notice"
                  : isResetting
                    ? "login-reset-notice"
                    : undefined
              }
            >
              {isResetting
                ? "Salvar nova senha"
                : isRecovering
                  ? "Enviar link de recuperação"
                  : "Entrar no painel"}
              <ArrowRight aria-hidden="true" />
            </Button>
          </form>
          {(isRecovering || isResetting) && (
            <p className="login-switch">
              <button type="button" disabled={loading} onClick={() => {
                if (isResetting && onReturnToLogin) onReturnToLogin();
                else switchMode("login");
              }}>
                Voltar para entrar
              </button>
            </p>
          )}
          {mode === "login" && (
            <p className="login-switch login-recovery-switch">
              <button
                type="button"
                disabled={loading}
                onClick={() => switchMode("recovery")}
              >
                Esqueci minha senha
              </button>
            </p>
          )}
        </div>
        <footer className="login-footer">
          iServi · Gestão que acompanha o seu ritmo.
        </footer>
      </section>
    </main>
  );
}
