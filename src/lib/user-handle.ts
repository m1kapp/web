import { clerkClient } from "@clerk/nextjs/server";

export interface UserInfo {
  id: string;
  handle: string;
  name: string;
  imageUrl: string;
}

export function resolveHandle(user: {
  username: string | null;
  emailAddresses: { emailAddress: string }[];
}): string {
  return (
    user.username ||
    user.emailAddresses[0]?.emailAddress.split("@")[0] ||
    ""
  );
}

export async function getUserByHandle(handle: string): Promise<UserInfo | null> {
  const clerk = await clerkClient();

  // 1) username 정확 매칭
  const byUsername = await clerk.users.getUserList({ username: [handle], limit: 1 });
  if (byUsername.data.length > 0) {
    const u = byUsername.data[0];
    return {
      id: u.id,
      handle: resolveHandle(u),
      name: u.firstName || handle,
      imageUrl: u.imageUrl,
    };
  }

  // 2) 이메일 앞부분으로 fuzzy 검색 후 정확 필터
  const byQuery = await clerk.users.getUserList({ query: handle, limit: 30 });
  const matched = byQuery.data.find((u) =>
    u.emailAddresses.some((e) => e.emailAddress.split("@")[0] === handle)
  );
  if (!matched) return null;

  return {
    id: matched.id,
    handle: resolveHandle(matched),
    name: matched.firstName || handle,
    imageUrl: matched.imageUrl,
  };
}

export async function getUserById(userId: string): Promise<UserInfo | null> {
  try {
    const clerk = await clerkClient();
    const u = await clerk.users.getUser(userId);
    return {
      id: u.id,
      handle: resolveHandle(u),
      name: u.firstName || resolveHandle(u),
      imageUrl: u.imageUrl,
    };
  } catch (e) {
    console.error("[getUserById] failed:", e);
    return null;
  }
}
