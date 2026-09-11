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

export type FieldErrors = Record<string, string>;

export function getFieldErrors(error: z.ZodError): FieldErrors {
  return Object.fromEntries(error.issues.map((issue) => [String(issue.path[0]), issue.message]));
}
