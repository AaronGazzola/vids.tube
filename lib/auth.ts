export interface Session {
  user: {
    id: string;
    email: string;
  };
}

export const auth = {
  api: {
    getSession: async ({ headers }: { headers: Headers }) => {
      return {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
      } as Session;
    },
  },
};
