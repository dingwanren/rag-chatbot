/**
 * Mock authentication functions for local development
 * Simple promise-based mock - replace with real API calls later
 */

export interface User {
  id: string;
  username: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  password: string;
  confirmPassword: string;
}

// Simple in-memory "database" for demo
const users: Array<User & { password: string }> = [];

export function mockLogin(credentials: LoginCredentials): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const user = users.find((u) => u.username === credentials.username);
      if (user && user.password === credentials.password) {
        resolve({ id: user.id, username: user.username });
      } else {
        reject(new Error("Invalid username or password"));
      }
    }, 500);
  });
}

export function mockRegister(credentials: RegisterCredentials): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (credentials.password !== credentials.confirmPassword) {
        reject(new Error("Passwords do not match"));
        return;
      }
      if (credentials.password.length < 6) {
        reject(new Error("Password must be at least 6 characters"));
        return;
      }
      const existing = users.find((u) => u.username === credentials.username);
      if (existing) {
        reject(new Error("Username already exists"));
        return;
      }
      const newUser = {
        id: Date.now().toString(),
        username: credentials.username,
        password: credentials.password,
      };
      users.push(newUser);
      resolve({ id: newUser.id, username: newUser.username });
    }, 500);
  });
}
