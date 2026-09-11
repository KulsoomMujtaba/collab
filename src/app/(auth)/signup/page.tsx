import { AuthShell } from "@/components/auth/auth-shell";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return <AuthShell eyebrow="Join Collab" title="How will you collaborate?" description="Choose your role, then create the account that will represent you on Collab."><SignupForm /></AuthShell>;
}
