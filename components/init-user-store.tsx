"use client";

import { useEffect, useState } from "react";
import { fetchUser } from "@/utils/fetchUser";

export default function InitUserStore() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      await fetchUser();
      setLoading(false);
    };

    initializeUser();
  }, []);

  return loading ? null : <></>;
}
