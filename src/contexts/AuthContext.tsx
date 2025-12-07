import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { useSignMessage, useAccount } from 'wagmi';
import { graphQLClient, setAuthToken, removeAuthToken } from '../lib/graphql';
import { LOGIN_MUTATION, UPDATE_PROFILE_MUTATION } from '../lib/mutations';
import { GET_ME } from '../lib/queries';

interface User {
  walletAddress: string;
  username?: string;
  email?: string;
  role?: string;
  avatarUrl?: string | null;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  login: () => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (input: { username?: string; email?: string; avatarUrl?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  user: null,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false,
  updateProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('auth_token'));
  const [user, setUser] = useState<User | null>(null);
  const { signMessageAsync } = useSignMessage();
  const { address, isConnected } = useAccount(); 

  const [isLoggingIn, setIsLoggingIn] = useState(false); // Prevent multiple login attempts

  useEffect(() => {
    if (token) {
      setAuthToken(token);
      fetchUser();
    } else {
      setUser(null);
    }
  }, [token]);

  // Auto-login when wallet connects
  useEffect(() => {
    const autoLogin = async () => {
      if (isConnected && address && !token && !isLoggingIn) {
        console.log("Wallet connected, auto-logging in...");
        await login();
      }
    };
    autoLogin();
  }, [isConnected, address, token]);

  // 监听 wagmi 的 isConnected 状态 (Auto-logout)
  useEffect(() => {
    // 只有当 isConnected 明确为 false 且之前有 token 时才执行 logout
    if (!isConnected && token) {
      console.log("Wallet disconnected, logging out...");
      logout();
    }
  }, [isConnected]); 

  const fetchUser = async () => {
    try {
      const data: any = await graphQLClient.request(GET_ME);
      const me = data.me;
      // 如果后端未返回头像则使用默认头像
      const withDefaultAvatar = {
        ...me,
        avatarUrl: me?.avatarUrl ?? "https://assets.mikasa-ackerman.vip/uPic/202512071111001765077060.png",
      };
      setUser(withDefaultAvatar);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      // If fetch fails (e.g. token expired), might want to logout
      // logout(); 
    }
  };

  const login = async () => {
    if (!address) return;
    if (isLoggingIn) return;

    setIsLoggingIn(true);
    const timestamp = Date.now();
    const message = `Login to Web3 University:${timestamp}`;
    
    try {
      const signature = await signMessageAsync({ message });
      
      const response: any = await graphQLClient.request(LOGIN_MUTATION, {
        input: {
          walletAddress: address,
          message,
          signature,
        },
      });

      if (response.login.token) {
        const newToken = response.login.token;
        setToken(newToken);
        localStorage.setItem('auth_token', newToken);
        setAuthToken(newToken);
        // fetchUser will be called by useEffect
      }
    } catch (error) {
      console.error('Login failed:', error);
      // Don't throw error here to avoid crashing UI in useEffect, just log it
    } finally {
      setIsLoggingIn(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('auth_token');
    removeAuthToken();
  };

  const updateProfile = async (input: { username?: string; email?: string; avatarUrl?: string }) => {
    try {
      const response: any = await graphQLClient.request(UPDATE_PROFILE_MUTATION, { input });
      const updated = response.updateProfile;
      const withDefaultAvatar = {
        ...updated,
        avatarUrl: updated?.avatarUrl ?? "https://assets.mikasa-ackerman.vip/uPic/202512071111001765077060.png",
      };
      setUser(prev => prev ? { ...prev, ...withDefaultAvatar } : withDefaultAvatar);
    } catch (error) {
      console.error('Failed to update profile:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, isAuthenticated: !!token, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
