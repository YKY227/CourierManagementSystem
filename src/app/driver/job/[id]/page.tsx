interface DriverJobPageProps {
  params: { id: string };
}

export default function DriverJobPage({ params }: DriverJobPageProps) {
  const { id } = params;
  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="max-w-xl w-full px-4 py-10">
        <h1 className="text-2xl font-semibold mb-2">Driver Job Detail</h1>
        <p className="text-gray-600 mb-4">
          Viewing job: <span className="font-mono">{id}</span>
        </p>
        <p className="text-sm text-gray-500">
          Show route, pickup & drop-off actions, POD upload, and status controls here.
        </p>
      </div>
    </main>
  );
}
