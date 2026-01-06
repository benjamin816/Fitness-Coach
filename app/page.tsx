
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStorage } from "../components/StorageContext";
import OnboardingPage from "./onboarding/page";

export default function Home() {
  const storage = useStorage();
  const router = useRouter();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProfile = async () => {
      const p = await storage.getUserProfile();
      if (p) {
        setProfile(p);
        router.push("/today");
      } else {
        setLoading(false);
      }
    };
    checkProfile();
  }, [storage, router]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return <OnboardingPage onComplete={(p) => {
    setProfile(p);
    router.push("/today");
  }} />;
}
