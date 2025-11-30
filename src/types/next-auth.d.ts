import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      isSeller?: boolean;
      shopName?: string | null;
      rememberMe?: boolean;
    };
  }

  interface User extends DefaultUser {
    id: string;
    isSeller?: boolean;
    shopName?: string | null;
    rememberMe?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rememberMe?: boolean;
  }
}