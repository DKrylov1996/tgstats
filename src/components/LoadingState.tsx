import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  title?: string;
  subtitle?: string;
}

export default function LoadingState({
  title = 'Загружаю',
  subtitle = 'Ещё мгновение, и всё будет на месте.',
}: LoadingStateProps) {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="glass-card flex w-full max-w-md flex-col items-center rounded-lg px-8 py-10 text-center">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-berry" aria-hidden="true" />
        <h1 className="text-2xl font-semibold text-ink">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-ink/64">{subtitle}</p>
      </div>
    </div>
  );
}
