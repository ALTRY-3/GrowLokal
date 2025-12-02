import { NextAuthOptions, type RequestInternal, type Session } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { checkAccountLockout, recordFailedLogin, resetFailedLogins } from "@/lib/accountLockout";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      name?: string | null;
      image?: string | null;
      isSeller?: boolean;
      shopName?: string | null;
      rememberMe?: boolean;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    rememberMe?: boolean;
  }
}

type CredentialsAuthorizeRequest = Pick<RequestInternal, "headers"> | undefined;

const getClientIp = (req: CredentialsAuthorizeRequest): string => {
  const headerValue = req?.headers?.["x-forwarded-for"] ?? req?.headers?.["x-real-ip"];

  if (!headerValue) {
    return "unknown";
  }

  if (Array.isArray(headerValue)) {
    return headerValue[0] ?? "unknown";
  }

  const first = headerValue.split(",")[0]?.trim();
  return first && first.length > 0 ? first : "unknown";
};

const getRememberMeFlag = (value: unknown): boolean => {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string") {
    return value === "true";
  }
  if (typeof value === "object" && value !== null && "rememberMe" in value) {
    const rememberValue = (value as { rememberMe?: boolean | string }).rememberMe;
    return getRememberMeFlag(rememberValue);
  }
  return false;
};

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "public_profile"
        }
      }
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        rememberMe: { label: "Remember Me", type: "text" },
      },
      async authorize(credentials, req: CredentialsAuthorizeRequest) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password are required');
        }

        try {
          // Check account lockout first
          const lockoutResult = await checkAccountLockout(credentials.email);
          if (lockoutResult.isLocked) {
            throw new Error(lockoutResult.message || 'Account is temporarily locked');
          }

          // Check rate limit for login
          const ip = getClientIp(req);
          const rateLimitKey = `${ip}:${credentials.email}`;
          const rateLimitResult = await checkRateLimit(rateLimitKey, 'login');
          
          if (!rateLimitResult.allowed) {
            throw new Error(rateLimitResult.message || 'Too many login attempts. Please try again later.');
          }

          await connectDB();
          
          const user = await User.findOne({ email: credentials.email }).select('+password');
          
          if (!user) {
            // Record failed login attempt
            await recordFailedLogin(credentials.email);
            throw new Error('Invalid email or password');
          }

          const isPasswordValid = await user.comparePassword(credentials.password);
          
          if (!isPasswordValid) {
            // Record failed login attempt and check if account should be locked
            const failedLoginResult = await recordFailedLogin(credentials.email);
            throw new Error(failedLoginResult.message || 'Invalid email or password');
          }

          // Check if email is verified
          if (!user.emailVerified) {
            throw new Error('EMAIL_NOT_VERIFIED');
          }

          // Reset rate limit and failed attempts on successful login
          await resetRateLimit(rateLimitKey, 'login');
          await resetFailedLogins(credentials.email);

          return {
            id: user._id.toString(),
            email: user.email,
            name: user.name,
            image: user.image,
            rememberMe: getRememberMeFlag(credentials.rememberMe),
          };
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Authentication failed';
          console.error('Auth error:', error);
          throw new Error(message);
        }
      },
    }),
  ],
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days for JWT tokens
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user, account }) {
      try {
        if (account?.provider === "google" || account?.provider === "facebook") {
          await connectDB();
          
          // Check if user already exists by providerId
          let existingUser = await User.findOne({
            providerId: account.providerAccountId,
            provider: account.provider
          });
          
          if (!existingUser) {
            // Create new user
            await User.create({
              name: user.name,
              email: user.email,
              provider: account.provider,
              providerId: account.providerAccountId,
              image: user.image,
              emailVerified: true,
            });
          } else {
            // Update existing user
            existingUser.name = user.name || existingUser.name;
            existingUser.email = user.email || existingUser.email;
            existingUser.image = user.image || existingUser.image;
            existingUser.emailVerified = true;
            
            await existingUser.save();
          }
        }
        return true;
      } catch (error: unknown) {
        console.error('SignIn callback error:', error);
        return true;
      }
    },
    async jwt({ token, user, trigger }) {
      // If user is signing in, add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.rememberMe = getRememberMeFlag(user);
      }
      
      // Set token expiration based on rememberMe setting
      if (trigger === "update" || !token.exp) {
        const rememberMe = token.rememberMe as boolean;
        if (rememberMe) {
          // 30 days for "Remember Me"
          const thirtyDays = 30 * 24 * 60 * 60;
          token.exp = Math.floor(Date.now() / 1000) + thirtyDays;
        } else {
          // Session cookie (browser close) - shorter expiration
          const oneDay = 24 * 60 * 60;
          token.exp = Math.floor(Date.now() / 1000) + oneDay;
        }
      }
      
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      if (token) {
        const user = session.user as any;
        user.id = (token.id as string) || '';
        user.email = (token.email as string) || null;
        user.name = (token.name as string) || null;
        user.image = (token.image as string) || null;
        user.rememberMe = (token.rememberMe as boolean) || false;
        
        // Fetch seller status from database
        try {
          if (token.id) {
            await connectDB();
            const userRecord = await User.findById(token.id).select('isSeller sellerProfile');
            if (userRecord) {
              user.isSeller = userRecord.isSeller || false;
              user.shopName = userRecord.sellerProfile?.shopName || null;
            }
          }
        } catch (error) {
          console.error("Error fetching seller status in session:", error);
        }
        
        // Set session expiration based on rememberMe
        const rememberMe = (token as JWT).rememberMe ?? false;
        if (rememberMe) {
          // 30 days for "Remember Me"
          session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // 1 day for session cookie (expires on browser close)
          session.expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }
        user.rememberMe = rememberMe;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Check if profile is incomplete (handled in middleware)
      // Handle OAuth callback redirects
      if (url.startsWith(baseUrl)) {
        return url;
      }
      // For relative URLs, prepend the base URL
      if (url.startsWith("/")) {
        return `${baseUrl}${url}`;
      }
      // Default redirect to marketplace for successful auth
      return `${baseUrl}/marketplace`;
    },
  },
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        domain: process.env.COOKIE_DOMAIN || undefined,
        // maxAge dynamically set based on rememberMe - handled by session.maxAge
      },
    },
    callbackUrl: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Host-' : ''}next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // Default 30 days (overridden by JWT exp)
    updateAge: 24 * 60 * 60, // Update session every 24 hours
  },
};