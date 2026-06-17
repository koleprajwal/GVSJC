import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

export type UserRole = 'admin' | 'clerk' | 'student' | 'teacher' | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  role: UserRole;
  isAdmin: boolean;
  isClerk: boolean;
  isStudent: boolean;
  isTeacher: boolean;
  portalUser: any; // stores local details for student/teacher
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  role: null,
  isAdmin: false,
  isClerk: false,
  isStudent: false,
  isTeacher: false,
  portalUser: null,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<UserRole>(null);
  const [portalUser, setPortalUser] = useState<any>(null);

  useEffect(() => {
    const resolveRole = (sess: Session | null): UserRole => {
      if (localStorage.getItem('adminLoggedIn') === 'true') return 'admin';
      if (localStorage.getItem('clerkLoggedIn') === 'true') return 'clerk';
      if (localStorage.getItem('studentLoggedIn') === 'true') return 'student';
      if (localStorage.getItem('teacherLoggedIn') === 'true') return 'teacher';
      
      if (!sess) return null;
      const userRole = sess.user?.user_metadata?.role;
      if (userRole === 'clerk') return 'clerk';
      return 'admin';
    };

    const loadPortalUser = () => {
      const stored = localStorage.getItem('portalUser');
      if (stored) {
        try {
          setPortalUser(JSON.parse(stored));
        } catch (e) {
          setPortalUser(null);
        }
      } else {
        setPortalUser(null);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(resolveRole(session));
      loadPortalUser();
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setRole(resolveRole(session));
      loadPortalUser();
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === 'admin';
  const isClerk = role === 'clerk';
  const isStudent = role === 'student';
  const isTeacher = role === 'teacher';

  return (
    <AuthContext.Provider value={{ user, session, loading, role, isAdmin, isClerk, isStudent, isTeacher, portalUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

