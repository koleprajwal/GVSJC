import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Shield, Users, UserCheck, Loader2, Eye, EyeOff, Lock, Mail, ArrowRight, GraduationCap, HeartHandshake } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Role = 'admin' | 'clerk' | 'teacher' | 'student' | 'parent';

const ROLES: { id: Role; label: string; icon: React.ElementType; gradient: string }[] = [
  { id: 'admin',   label: 'Admin',   icon: Shield,          gradient: 'from-indigo-500 to-purple-600' },
  { id: 'clerk',   label: 'Clerk',   icon: UserCheck,       gradient: 'from-emerald-500 to-teal-600'  },
  { id: 'teacher', label: 'Teacher', icon: GraduationCap,  gradient: 'from-sky-500 to-blue-600'      },
  { id: 'student', label: 'Student', icon: Users,           gradient: 'from-pink-500 to-rose-600'     },
  { id: 'parent',  label: 'Parent',  icon: HeartHandshake,  gradient: 'from-amber-500 to-orange-500'  },
];

const DEV_CREDENTIALS: Record<string, { password: string; role: Role }> = {
  'admin@school.com': { password: 'admin@gvsc', role: 'admin' },
  'clerk@school.com': { password: 'clerk@gvsc', role: 'clerk' },
};

export default function LoginPortal() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<Role>('admin');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Please enter email and password'); return; }
    setLoading(true);

    if (selectedRole === 'parent') {
      toast.info("Parents: Please log in using your child's Student ID.");
      setSelectedRole('student');
      setLoading(false);
      return;
    }

    // Dev bypass for Admin/Clerk
    const dev = DEV_CREDENTIALS[email.toLowerCase()];
    if (dev && password === dev.password) {
      if (dev.role !== selectedRole) {
        toast.error(`These credentials are for the "${dev.role}" role. Please select it above.`);
        setLoading(false);
        return;
      }
      if (dev.role === 'admin') {
        localStorage.setItem('adminLoggedIn', 'true');
        toast.success('Welcome, Admin!');
        navigate('/admin');
      } else {
        localStorage.setItem('clerkLoggedIn', 'true');
        toast.success('Welcome, Clerk!');
        navigate('/clerk');
      }
      setLoading(false);
      return;
    }

    // Dev bypass for student/teacher
    if (selectedRole === 'student' && email.toLowerCase() === 'student@school.com' && password === 'student@gvsc') {
      localStorage.setItem('studentLoggedIn', 'true');
      const mockStudent = { id: '00000000-0000-0000-0000-000000000000', name: 'Aarav Patil', student_id: 'GVS-2024-001', class: 'Class 5', roll_no: '01' };
      localStorage.setItem('portalUser', JSON.stringify(mockStudent));
      toast.success('Welcome, Student!');
      navigate('/student');
      setLoading(false);
      return;
    }

    if (selectedRole === 'teacher' && email.toLowerCase() === 'teacher@school.com' && password === 'teacher@gvsc') {
      localStorage.setItem('teacherLoggedIn', 'true');
      const mockTeacher = { id: '00000000-0000-0000-0000-000000000000', name: 'Hon. Shri. Pravin Mali', teacher_id: 'TCH-0001', role: 'Principal' };
      localStorage.setItem('portalUser', JSON.stringify(mockTeacher));
      toast.success('Welcome, Teacher!');
      navigate('/teacher');
      setLoading(false);
      return;
    }

    // Database check for Student Login
    if (selectedRole === 'student') {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .or(`student_id.eq.${email},email.eq.${email}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        toast.error('Login error: ' + error.message);
        setLoading(false);
        return;
      }

      if (data) {
        localStorage.setItem('studentLoggedIn', 'true');
        localStorage.setItem('portalUser', JSON.stringify(data));
        toast.success(`Welcome, ${data.name}!`);
        navigate('/student');
        setLoading(false);
        return;
      }
      
      toast.error('Invalid Student ID / Email or Password');
      setLoading(false);
      return;
    }

    // Database check for Teacher Login
    if (selectedRole === 'teacher') {
      const { data, error } = await supabase
        .from('faculty')
        .select('*')
        .or(`teacher_id.eq.${email},email.eq.${email}`)
        .eq('password', password)
        .maybeSingle();

      if (error) {
        toast.error('Login error: ' + error.message);
        setLoading(false);
        return;
      }

      if (data) {
        localStorage.setItem('teacherLoggedIn', 'true');
        localStorage.setItem('portalUser', JSON.stringify(data));
        toast.success(`Welcome, ${data.name}!`);
        navigate('/teacher');
        setLoading(false);
        return;
      }
      
      toast.error('Invalid Teacher ID / Email or Password');
      setLoading(false);
      return;
    }

    // Real Supabase auth for Admin/Clerk
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) { toast.error(error.message); return; }

    const role = (data.user?.user_metadata?.role as Role) ?? selectedRole;
    toast.success('Signed in!');
    if (role === 'admin') { localStorage.setItem('adminLoggedIn', 'true'); navigate('/admin'); }
    else if (role === 'clerk') { localStorage.setItem('clerkLoggedIn', 'true'); navigate('/clerk'); }
    else { navigate('/parents'); }
  };

  const active = ROLES.find((r) => r.id === selectedRole)!;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-5">

        {/* Logo */}
        <div className="text-center space-y-2">
          <Link to="/">
            <img src="/icon.png" alt="Logo" className="w-14 h-14 rounded-full shadow mx-auto object-contain bg-white" />
          </Link>
          <h1 className="text-xl font-display font-bold text-gray-900">Gurukul Vidyalay</h1>
          <p className="text-sm text-gray-500">Sign in to your portal</p>
        </div>

        {/* Role pills */}
        <div className="grid grid-cols-5 gap-1">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = selectedRole === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => setSelectedRole(r.id)}
                className={`flex flex-col items-center gap-1 py-2 rounded-xl border text-[10px] font-semibold transition-all duration-200 ${
                  active
                    ? `bg-gradient-to-br ${r.gradient} text-white border-transparent shadow-md scale-[1.04]`
                    : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                {selectedRole === 'student' ? 'Student ID or Email' : selectedRole === 'teacher' ? 'Teacher ID or Email' : 'Email'}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === 'student' ? 'GVS-2024-001' : selectedRole === 'teacher' ? 'TCH-1234' : 'you@school.com'
                  }
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 text-left"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1 text-left">
              <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-10 pr-10 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 text-left"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full bg-gradient-to-r ${active.gradient} text-white font-semibold hover:opacity-90 transition-opacity`}
            >
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</>
                : <><ArrowRight className="w-4 h-4 mr-2" />Sign In as {active.label}</>
              }
            </Button>
          </form>

          <p className="text-xs text-center text-gray-400">
            Forgot password? Call <span className="font-medium text-gray-600">70832 37878</span>
          </p>
        </div>

        <p className="text-center text-xs text-gray-400">
          <Link to="/" className="hover:text-primary transition-colors">← Back to website</Link>
        </p>
      </div>
    </div>
  );
}

