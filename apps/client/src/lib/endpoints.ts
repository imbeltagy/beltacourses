export const endpoints = {
  getUserById: (userId: string) =>
    `${process.env.NEXT_PUBLIC_API_URL}/users/${userId}`,
  login: () => `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
  register: () => `${process.env.NEXT_PUBLIC_API_URL}/auth/register`,
};

if (!process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "NEXT_PUBLIC_API_URL is not set — cannot build the /auth/refresh URL.",
  );
}
export const refreshTokenApiUrl = `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`;
