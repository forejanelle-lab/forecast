"use client";

import { createContext, useContext } from "react";

interface ActorMembershipContextValue {
  membership: string;
  isPremium: boolean;
  trialEndsAt: string | null;
}

const ActorMembershipContext = createContext<ActorMembershipContextValue | null>(
  null,
);

export function ActorMembershipProvider({
  children,
  membership,
  isPremium,
  trialEndsAt,
}: {
  children: React.ReactNode;
  membership: string;
  isPremium: boolean;
  trialEndsAt: string | null;
}) {
  return (
    <ActorMembershipContext.Provider
      value={{ membership, isPremium, trialEndsAt }}
    >
      {children}
    </ActorMembershipContext.Provider>
  );
}

export function useActorMembership(): ActorMembershipContextValue {
  const value = useContext(ActorMembershipContext);
  if (!value) {
    throw new Error("useActorMembership must be used within ActorMembershipProvider");
  }
  return value;
}

export function useActorMembershipOptional():
  ActorMembershipContextValue | null {
  return useContext(ActorMembershipContext);
}
