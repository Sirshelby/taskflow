import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn, setAuthToken, getAuthToken } from "@/lib/queryClient";

type AuthUser = { id: number; email: string; name: string } | null;

export function useAuth() {
  const { data: user, isLoading } = useQuery<AuthUser>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    staleTime: Infinity,
    retry: false,
    // Only attempt if we have a token
    enabled: !!getAuthToken(),
  });

  // If no token exists, we're definitely not authenticated and not loading
  const effectiveLoading = getAuthToken() ? isLoading : false;

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const res = await apiRequest("POST", "/api/auth/login", data);
      return res.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], { id: data.id, email: data.email, name: data.name });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const res = await apiRequest("POST", "/api/auth/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      setAuthToken(data.token);
      queryClient.setQueryData(["/api/auth/me"], { id: data.id, email: data.email, name: data.name });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      setAuthToken(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
    },
  });

  return {
    user,
    isLoading: effectiveLoading,
    isAuthenticated: !!user,
    login: loginMutation,
    register: registerMutation,
    logout: logoutMutation,
  };
}
