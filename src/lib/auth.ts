import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/User";
import connectDB from "@/lib/mongodb";
import { checkRateLimit, resetRateLimit } from "@/lib/rateLimit";
import { checkAccountLockout, recordFailedLogin, resetFailedLogins } from "@/lib/accountLockout";

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
      async authorize(credentials, req) {
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
          const ip = (req as any)?.headers?.['x-forwarded-for'] || 
                     (req as any)?.headers?.['x-real-ip'] || 
                     'unknown';
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
            rememberMe: credentials.rememberMe === 'true',
          };
        } catch (error: any) {
          console.error('Auth error:', error);
          throw new Error(error.message || 'Authentication failed');
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
    async signIn({ user, account, profile }) {
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
      } catch (error) {
        console.error('SignIn callback error:', error);
        return true;
      }
    },
    async jwt({ token, user, account, trigger }) {
      // If user is signing in, add user info to token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
        token.rememberMe = (user as any).rememberMe || false;
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
    async session({ session, token, trigger }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
        session.user.image = token.image as string;
        
        // Fetch seller status from database
        try {
          await connectDB();
          // Only query if token.id is a valid MongoDB ObjectId (24 hex chars)
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(String(token.id));
          if (isValidObjectId) {
            const user = await User.findById(token.id).select('isSeller sellerProfile');
            if (user) {
              (session.user as any).isSeller = user.isSeller || false;
              (session.user as any).shopName = user.sellerProfile?.shopName || null;
            }
          } else {
            // For OAuth users with non-MongoDB IDs, query by email
            const user = await User.findOne({ email: token.email }).select('isSeller sellerProfile');
            if (user) {
              (session.user as any).isSeller = user.isSeller || false;
              (session.user as any).shopName = user.sellerProfile?.shopName || null;
            }
          }
        } catch (error) {
          console.error("Error fetching seller status in session:", error);
        }
        
        // Set session expiration based on rememberMe
        const rememberMe = token.rememberMe as boolean;
        if (rememberMe) {
          // 30 days for "Remember Me"
          session.expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        } else {
          // 1 day for session cookie (expires on browser close)
          session.expires = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        }
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