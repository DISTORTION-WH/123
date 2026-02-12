import Link from 'next/link';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-white text-gray-900">
      <div className="z-10 max-w-5xl w-full items-center justify-center font-mono text-sm flex mb-10">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4">
          Welcome to&nbsp;
          <code className="font-mono font-bold">Innogram</code>
        </p>
      </div>

      <div className="relative flex place-items-center mb-16">
        <h1 className="text-6xl font-bold text-center tracking-tight">
          Share your <span className="text-blue-600">moments</span>
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-2 lg:text-left gap-8">
        <Link
          href="/auth/login"
          className="group rounded-lg border border-gray-200 px-5 py-4 transition-colors hover:border-blue-400 hover:bg-blue-50"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Login{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-60`}>
            Already have an account? Sign in to check your feed.
          </p>
        </Link>

        <Link
          href="/auth/signup"
          className="group rounded-lg border border-gray-200 px-5 py-4 transition-colors hover:border-green-400 hover:bg-green-50"
        >
          <h2 className={`mb-3 text-2xl font-semibold`}>
            Sign Up{' '}
            <span className="inline-block transition-transform group-hover:translate-x-1 motion-reduce:transform-none">
              -&gt;
            </span>
          </h2>
          <p className={`m-0 max-w-[30ch] text-sm opacity-60`}>
            New here? Create an account and join the community.
          </p>
        </Link>
      </div>
    </main>
  );
}