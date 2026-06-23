import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export type AuthTokenPurpose = "email-verify" | "password-reset";

const TOKEN_BYTES = 32;
const VERIFY_EXPIRY_HOURS = 24;
const RESET_EXPIRY_HOURS = 1;

function purposeIdentifier(purpose: AuthTokenPurpose, email: string): string {
  return `${purpose}:${email.trim().toLowerCase()}`;
}

function generateToken(): string {
  return crypto.randomBytes(TOKEN_BYTES).toString("hex");
}

function expiryForPurpose(purpose: AuthTokenPurpose): Date {
  const hours =
    purpose === "email-verify" ? VERIFY_EXPIRY_HOURS : RESET_EXPIRY_HOURS;
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

export async function createAuthToken(
  purpose: AuthTokenPurpose,
  email: string,
): Promise<string> {
  const normalizedEmail = email.trim().toLowerCase();
  const identifier = purposeIdentifier(purpose, normalizedEmail);
  const token = generateToken();
  const expires = expiryForPurpose(purpose);

  await prisma.verificationToken.deleteMany({ where: { identifier } });

  await prisma.verificationToken.create({
    data: { identifier, token, expires },
  });

  return token;
}

export async function consumeAuthToken(
  purpose: AuthTokenPurpose,
  token: string,
): Promise<string | null> {
  const trimmedToken = token.trim();
  if (!trimmedToken) return null;

  const record = await prisma.verificationToken.findUnique({
    where: { token: trimmedToken },
  });

  if (!record || record.expires < new Date()) {
    if (record) {
      await prisma.verificationToken.delete({
        where: { token: trimmedToken },
      });
    }
    return null;
  }

  const prefix = `${purpose}:`;
  if (!record.identifier.startsWith(prefix)) {
    return null;
  }

  const email = record.identifier.slice(prefix.length);

  await prisma.verificationToken.delete({ where: { token: trimmedToken } });

  return email;
}
