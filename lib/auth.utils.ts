import { headers } from "next/headers";
import { auth, Session } from "./auth";
import { createRLSClient } from "./prisma-rls";

export async function getAuthenticatedClient(): Promise<{
  db: ReturnType<typeof createRLSClient>;
  session: Session | null;
}> {
  const headersList = await headers();

  const session = await auth.api.getSession({
    headers: headersList,
  });

  const userId = session?.user.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const db = createRLSClient(userId);

  return { db, session };
}
