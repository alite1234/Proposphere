"use client";

import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "your-anon-key";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Get the current session user
export async function getSessionUser() {
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session?.user;
}

// Sign in with email
export async function signIn(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldSendMagicLink: false,
    },
  });
  return { data, error };
}

// Sign up with email and auto-generate password/username
export async function signUp(email: string, fullName: string) {
  // Generate auto username from name
  const username = fullName
    .split(" ")
    .map((word) => word.charAt(0).toLowerCase() + word.slice(1).toLowerCase())
    .join(".")
    .substring(0, 20);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: generateAutoPassword(),
    options: {
      data: {
        fullName,
        username,
      },
      shouldSendVerification: false,
    },
  });
  return { data, error };
}

// Generate auto password (12 characters, mixed case + numbers + symbols)
function generateAutoPassword(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  password += chars[26]; // A
  password += chars[52]; // a
  password += chars[61]; // 9
  for (let i = password.length; i < 12; i++) {
    password += chars[Math.floor(Math.random() * chars.length)];
  }
  return password
    .split("")
    .sort(() => 0.5 - Math.random())
    .join("");
}

// Sign out
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}