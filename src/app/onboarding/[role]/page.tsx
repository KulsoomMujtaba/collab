import { notFound } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (role !== "company" && role !== "creator") notFound();
  return <OnboardingForm role={role} />;
}
