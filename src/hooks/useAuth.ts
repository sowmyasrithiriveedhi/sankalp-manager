import { useState, useEffect, useCallback } from 'react';
import { mcpSignIn, mcpSignOut, mcpGetSession } from '../mcps/supabaseMcp';

/**
 * useAuth Custom React Hook
 * In Antigravity architecture, hooks act as the state management gateway
 * between frontend components and the background Subagents/Skills.
 */

export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Check current session on mount
  const checkSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const session = await mcpGetSession();
      setIsAuthenticated(session.active);
      setUserEmail(session.email);
    } catch (err: unknown) {
      console.error('Failed to check session:', err);
      setError('Failed to fetch authentication session.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const run = async () => { await checkSession(); };
    void run();
  }, [checkSession]);

  // Login handler
  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await mcpSignIn(email, password);
      if (result.success) {
        setIsAuthenticated(true);
        setUserEmail(email);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Login failed unexpectedly.';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout handler
  const logout = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const result = await mcpSignOut();
      if (result.success) {
        setIsAuthenticated(false);
        setUserEmail(null);
        return true;
      } else {
        setError(result.error);
        return false;
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Logout failed.';
      setError(message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isAuthenticated,
    userEmail,
    isLoading,
    error,
    login,
    logout,
    refreshSession: checkSession
  };
}
