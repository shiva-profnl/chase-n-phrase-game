import { useEffect, useState } from "react";

export function useCurrentUserId() {
  const [userId, setUserId] = useState<string>("");
  const [username, setUsername] = useState<string>("");

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const res = await fetch("/api/currentUserId");
        const data = await res.json();
        setUserId(data.userId || "");
        setUsername(data.username || "");
      } catch (err) {
        setUserId("");
        setUsername("");
      }
    }
    fetchUserInfo();
  }, []);

  return { userId, username };
}
