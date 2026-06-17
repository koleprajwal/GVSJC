import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useNotices } from '@/hooks/useNotices';
import { useQueries } from '@/hooks/useQueries';
import { useFeedback } from '@/hooks/useFeedback';
import { useAdmissions } from '@/hooks/useAdmissions';
import { useAuth } from '@/contexts/AuthContext';
import { BellRing, FileText, Activity } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { notices = [], isLoading: noticesLoading } = useNotices();

  const { data: queriesData = [], isLoading: queriesLoading } = useQueries();
  const queries = queriesData ?? [];

  const { data: feedbackData = [], isLoading: feedbackLoading } = useFeedback();
  const feedback = feedbackData ?? [];

  const { data: admissionsData = [], isLoading: admissionsLoading } = useAdmissions();
  const admissions = admissionsData ?? [];

  return (
    <div className="space-y-8 animate-fade-in text-left">
      <div>
        <h1 className="text-3xl font-bold font-display text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">Welcome back, {user?.email}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Notices Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Notices</CardTitle>
            <BellRing className="h-4 w-4 text-muted-foreground text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {noticesLoading ? '...' : notices?.length || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Announcements currently visible</p>
            <Link to="/admin/notices" className="text-xs text-primary font-medium mt-3 inline-block hover:underline">
              Manage Notices →
            </Link>
          </CardContent>
        </Card>

        {/* Site Content Summary */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Site Content</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Editable Data</div>
            <p className="text-xs text-muted-foreground mt-1">Text, headers, and UI strings</p>
            <Link to="/admin/content" className="text-xs text-primary font-medium mt-3 inline-block hover:underline">
              Manage Content →
            </Link>
          </CardContent>
        </Card>

        {/* System Status */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground mt-1">Supabase connected successfully</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Recent Notices */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>A quick glance at the latest announcements on your site.</CardDescription>
          </CardHeader>
          <CardContent>
            {noticesLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : notices && notices.length > 0 ? (
              <div className="space-y-4">
                {notices.slice(0, 3).map((notice) => (
                  <div key={notice.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                    <div className="bg-gray-100 p-2 rounded-lg mt-1">
                      <BellRing className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold">{notice.title}</h4>
                      <p className="text-xs text-gray-500 line-clamp-1">{notice.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No notices found.</p>
            )}
          </CardContent>
        </Card>

        {/* Queries / Contacts */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Site Queries</CardTitle>
            <CardDescription>Messages submitted by visitors via the contact form.</CardDescription>
          </CardHeader>
          <CardContent>
            {queriesLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : queries && queries.length > 0 ? (
              <div className="space-y-3">
                {queries.slice(0, 5).map((q: any) => (
                  <div key={q.id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-medium">{q.name} <span className="text-xs text-gray-400">({q.email})</span></p>
                    <p className="text-gray-500 text-xs line-clamp-2">{q.message}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No queries received.</p>
            )}
            <Link to="/admin/queries" className="text-xs text-primary font-medium mt-3 inline-block hover:underline">
              View all queries →
            </Link>
          </CardContent>
        </Card>

        {/* Feedback */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
            <CardDescription>User feedback collected from the feedback form.</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : feedback && feedback.length > 0 ? (
              <div className="space-y-3">
                {feedback.slice(0, 5).map((f: any) => (
                  <div key={f.id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-medium">{f.name ?? 'Anonymous'} <span className="text-xs text-yellow-500">{'★'.repeat(f.rating ?? 0)}</span></p>
                    <p className="text-gray-500 text-xs line-clamp-2">{f.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No feedback yet.</p>
            )}
            <Link to="/admin/feedback" className="text-xs text-primary font-medium mt-3 inline-block hover:underline">
              View all feedback →
            </Link>
          </CardContent>
        </Card>

        {/* Admissions */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Admissions</CardTitle>
            <CardDescription>Recent admission applications.</CardDescription>
          </CardHeader>
          <CardContent>
            {admissionsLoading ? (
              <p className="text-sm text-gray-500">Loading...</p>
            ) : admissions && admissions.length > 0 ? (
              <div className="space-y-3">
                {admissions.slice(0, 5).map((a: any) => (
                  <div key={a.id} className="text-sm border-b pb-2 last:border-0">
                    <p className="font-medium">{a.student_name ?? 'N/A'}</p>
                    <p className="text-xs text-gray-400">
                      Grade: {a.grade ?? '–'} · Parent: {a.parent_name ?? '–'}
                    </p>
                    <p className="text-xs text-gray-400">{a.email}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No admissions data.</p>
            )}
            <Link to="/admin/admissions" className="text-xs text-primary font-medium mt-3 inline-block hover:underline">
              View all admissions →
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
