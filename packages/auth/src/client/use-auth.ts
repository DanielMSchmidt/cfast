type AuthClient = {
  signOut: () => Promise<unknown>;
};

export function useAuth(authClient: AuthClient) {
  return {
    signOut: async () => {
      await authClient.signOut();
    },
  };
}
