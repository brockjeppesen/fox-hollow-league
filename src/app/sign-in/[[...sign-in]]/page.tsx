import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-green-800 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full bg-brass blur-[150px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6 animate-fade-in">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-brass flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-green-900"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-4h2v-2h-2v2zm0-10h2v6h-2V6z" />
            </svg>
          </div>
          <h1 className="font-heading text-3xl text-cream mb-2">
            League Manager
          </h1>
          <p className="text-cream/60">
            Sign in to manage Fox Hollow League
          </p>
        </div>

        <SignIn
          appearance={{
            elements: {
              rootBox: "mx-auto w-full",
              card: "bg-white/95 backdrop-blur shadow-2xl rounded-xl border-0",
              headerTitle: "text-green-800 font-heading",
              headerSubtitle: "text-text-muted",
              formButtonPrimary:
                "bg-green-800 hover:bg-green-700 transition-colors-smooth",
              footerActionLink: "text-brass hover:text-brass-light",
            },
          }}
        />
      </div>
    </div>
  );
}
