export default function Loading() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            {/* Main content skeleton */}
            <div className="w-full max-w-4xl space-y-8">
                {/* Header skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-8 w-32 bg-secondary/40 rounded animate-pulse" />
                    <div className="h-10 w-24 bg-secondary/40 rounded animate-pulse" />
                </div>

                {/* Main card skeleton - resembles PhrasePlaybackView */}
                <div className="rounded-2xl border bg-card p-8 space-y-6 animate-pulse">
                    {/* Title area */}
                    <div className="h-6 w-1/3 bg-secondary/40 rounded mx-auto" />

                    {/* Main text area - phrase content */}
                    <div className="space-y-4 py-12">
                        <div className="h-12 w-3/4 bg-secondary/60 rounded mx-auto" />
                        <div className="h-10 w-2/3 bg-secondary/40 rounded mx-auto" />
                    </div>

                    {/* Controls area */}
                    <div className="flex items-center justify-center gap-4 pt-8">
                        <div className="h-12 w-12 bg-secondary/40 rounded-full" />
                        <div className="h-16 w-16 bg-secondary/60 rounded-full" />
                        <div className="h-12 w-12 bg-secondary/40 rounded-full" />
                    </div>

                    {/* Progress bar */}
                    <div className="pt-4">
                        <div className="h-2 w-full bg-secondary/40 rounded-full" />
                    </div>
                </div>

                {/* Bottom navigation skeleton */}
                <div className="flex items-center justify-between">
                    <div className="h-10 w-28 bg-secondary/40 rounded animate-pulse" />
                    <div className="h-10 w-28 bg-secondary/40 rounded animate-pulse" />
                </div>
            </div>
        </div>
    );
}
