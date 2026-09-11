import { z } from "zod";

const requiredText = (label: string, minimum = 2) =>
  z.string().trim().min(minimum, `${label} must be at least ${minimum} characters.`);

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const signupSchema = loginSchema
  .extend({
    fullName: requiredText("Name"),
    role: z.enum(["company", "creator"], { message: "Choose how you want to use Collab." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

const optionalUrl = z.union([z.literal(""), z.string().url("Enter a complete URL, including https://")]);

export const companySchema = z.object({
  companyName: requiredText("Company name"),
  websiteUrl: optionalUrl,
  description: z.string().trim().max(1000, "Keep the description under 1,000 characters."),
  logoUrl: optionalUrl,
});

export const creatorSchema = z.object({
  displayName: requiredText("Display name"),
  headline: requiredText("Headline").max(160, "Keep the headline under 160 characters."),
  bio: z.string().trim().min(20, "Tell companies a little more—use at least 20 characters.").max(1500),
  country: requiredText("Country"),
  linkedinUrl: z.string().url("Enter a complete LinkedIn URL.").refine((url) => url.includes("linkedin.com"), "Use a LinkedIn profile URL."),
  avatarUrl: optionalUrl,
  niches: z.array(z.string()).min(1, "Choose at least one niche.").max(3, "Choose up to three niches."),
  followerCount: z.coerce.number().int().min(0, "Followers cannot be negative."),
  averageViews: z.coerce.number().int().min(0, "Average views cannot be negative."),
  postRate: z.coerce.number().int().min(1, "Enter a post rate of at least €1."),
});

export const bookingRequestSchema = z.object({
  campaignTitle: requiredText("Campaign title").max(140, "Keep the title under 140 characters."),
  objective: z.string().trim().min(10, "Describe the campaign objective in at least 10 characters.").max(1000),
  deliverableDescription: z.string().trim().min(10, "Describe the requested post in at least 10 characters.").max(2000),
  desiredPublishDate: z.string().min(1, "Choose a desired publication date.").refine((value) => {
    const selected = new Date(`${value}T00:00:00`);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return selected >= today;
  }, "Choose today or a future date."),
  notes: z.string().trim().max(2000, "Keep notes under 2,000 characters."),
});

export const deliverableSchema = z.object({
  publicUrl: z.string().trim().url("Enter a complete URL, including https://").refine((value) => {
    try {
      const hostname = new URL(value).hostname.toLowerCase();
      return hostname === "linkedin.com" || hostname.endsWith(".linkedin.com");
    } catch {
      return false;
    }
  }, "Use a public LinkedIn URL."),
});

export const bookingMessageSchema = z.object({
  body: z.string().trim().min(1, "Write a message before sending.").max(2000, "Keep messages under 2,000 characters."),
});

export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: z.ZodError): FieldErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}
