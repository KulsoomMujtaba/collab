import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage() {
  return <AuthShell eyebrow="Welcome back" title="Pick up where you left off." description="Sign in to manage creator partnerships and campaign requests."><LoginForm /></AuthShell>;
}
