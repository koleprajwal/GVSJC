import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, GraduationCap } from 'lucide-react';

export default function StudentCorner() {
  const navigate = useNavigate();
  const studentLoggedIn = typeof window !== 'undefined' && localStorage.getItem('studentLoggedIn') === 'true';

  if (studentLoggedIn) {
    navigate('/student');
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-xl max-w-md w-full text-center space-y-5">
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto text-2xl font-bold">
          <GraduationCap className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 font-display">Student Corner</h2>
        <p className="text-gray-500 text-sm">
          Welcome to the Student Corner. Access homework, grades, online materials, and school notices. Please sign in to your student portal.
        </p>
        <Button onClick={() => navigate('/portal')} className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold gap-2">
          Sign In to Student Portal <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
