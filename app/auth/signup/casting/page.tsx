import { SignUpForm } from "@/components/auth/sign-up-form";

export default function CastingSignUpPage() {
  return <SignUpForm defaultRole="CASTING" allowRoleChange={false} />;
}
