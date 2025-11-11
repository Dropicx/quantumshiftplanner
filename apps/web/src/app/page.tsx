import { config } from '@planday/config';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-4xl font-bold mb-8 text-center">
          Welcome to {config.app.name}
        </h1>
        <p className="text-xl text-center mb-4">
          Complete Workforce Management System
        </p>
        <p className="text-center text-gray-600">
          Version {config.app.version}
        </p>
        <div className="mt-8 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-3 lg:text-left gap-4">
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Shift Planning
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Drag & drop scheduling with templates and shift swapping
            </p>
          </div>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Time Tracking
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              GPS-based clock-in/out with photo verification
            </p>
          </div>
          <div className="group rounded-lg border border-transparent px-5 py-4 transition-colors hover:border-gray-300 hover:bg-gray-100">
            <h2 className="mb-3 text-2xl font-semibold">
              Multi-Tenancy
            </h2>
            <p className="m-0 max-w-[30ch] text-sm opacity-50">
              Full organization support with Clerk integration
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
