interface TrackingPageProps {
  params: { jobId: string };
}

export default function TrackingPage({ params }: TrackingPageProps) {
  const { jobId } = params;
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Track Job</h1>
        <p className="text-gray-600 mb-4">
          Tracking information for Job ID: <span className="font-mono">{jobId}</span>
        </p>
        <p className="text-sm text-gray-500">
          This is a placeholder view. Later, show live status, driver location, and
          a timeline of events.
        </p>
      </div>
    </main>
  );
}
