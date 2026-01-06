
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStorage } from "../components/StorageContext";
import OnboardingPage from "./onboarding/page";

export default function Home() {
  const storage = useStorage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const checkProfile = async () => {
      const p = await storage.getUserProfile();
      if (p) router.push("/today");
      else { setShowOnboarding(true); setLoading(false); }
    };
    checkProfile();
  }, [storage, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return showOnboarding ? <OnboardingPage onComplete={() => router.push("/today")} /> : null;
}
