'use server';

import { getCollection } from './db';
import { cookies } from 'next/headers';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function generateSessionToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

const COOKIE_NAME = 'chillo_session';
const SESSION_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

async function setSessionCookie(token: string, expiresAt: Date) {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  });
}

export type ActionResult =
  | { success: true }
  | { success: false; message: string; field?: 'email' | 'password' | 'name' | 'general' };

export async function loginAction(formData: FormData): Promise<ActionResult> {
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!email || !password) return { success: false, message: 'Please fill in all fields.', field: 'general' };
  if (!email.includes('@')) return { success: false, message: 'Please enter a valid email address.', field: 'email' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.', field: 'password' };

  try {
    const userCollection = await getCollection('users');
    if (!userCollection) return { success: false, message: 'Database connection failed.', field: 'general' };

    const user = await userCollection.findOne({ email });
    if (!user) return { success: false, message: 'No account found with this email.', field: 'email' };
    if (user.password !== hashPassword(password)) return { success: false, message: 'Incorrect password.', field: 'password' };

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const sessionCollection = await getCollection('sessions');
    if (sessionCollection) {
      await sessionCollection.insertOne({ token: sessionToken, userId: user._id, email: user.email, name: user.name, createdAt: new Date(), expiresAt });
    }

    await setSessionCookie(sessionToken, expiresAt);
    return { success: true };
  } catch (err) {
    console.error('[Login] Error:', err);
    return { success: false, message: 'Something went wrong. Please try again.', field: 'general' };
  }
}

export async function signupAction(formData: FormData): Promise<ActionResult> {
  const name = (formData.get('name') as string)?.trim();
  const email = (formData.get('email') as string)?.trim().toLowerCase();
  const password = formData.get('password') as string;

  if (!name || !email || !password) return { success: false, message: 'Please fill in all fields.', field: 'general' };
  if (name.length < 2) return { success: false, message: 'Name must be at least 2 characters.', field: 'name' };
  if (!email.includes('@') || !email.includes('.')) return { success: false, message: 'Please enter a valid email address.', field: 'email' };
  if (password.length < 6) return { success: false, message: 'Password must be at least 6 characters.', field: 'password' };

  try {
    const userCollection = await getCollection('users');
    if (!userCollection) return { success: false, message: 'Database connection failed.', field: 'general' };

    const existing = await userCollection.findOne({ email });
    if (existing) return { success: false, message: 'An account with this email already exists.', field: 'email' };

    const result = await userCollection.insertOne({ name, email, password: hashPassword(password), createdAt: new Date() });

    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    const sessionCollection = await getCollection('sessions');
    if (sessionCollection) {
      await sessionCollection.insertOne({ token: sessionToken, userId: result.insertedId, email, name, createdAt: new Date(), expiresAt });
    }

    await setSessionCookie(sessionToken, expiresAt);
    return { success: true };
  } catch (err) {
    console.error('[Signup] Error:', err);
    return { success: false, message: 'Something went wrong. Please try again.', field: 'general' };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (sessionToken) {
    try {
      const sessionCollection = await getCollection('sessions');
      if (sessionCollection) await sessionCollection.deleteOne({ token: sessionToken });
    } catch (err) {
      console.error('[Logout] Error:', err);
    }
  }
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionToken) return null;
  try {
    const sessionCollection = await getCollection('sessions');
    if (!sessionCollection) return null;
    const session = await sessionCollection.findOne({ token: sessionToken, expiresAt: { $gt: new Date() } });
    return session ?? null;
  } catch {
    return null;
  }
}
