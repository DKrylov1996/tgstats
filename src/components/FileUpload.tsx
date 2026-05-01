import { ChangeEvent, DragEvent, useRef, useState } from 'react';
import { FileJson, RefreshCw, UploadCloud } from 'lucide-react';

export type UploadStatus = 'idle' | 'reading' | 'analyzing' | 'ready' | 'saving' | 'saved';

interface FileUploadProps {
  status: UploadStatus;
  onFile: (file: File) => void;
}

const statusLabels: Record<UploadStatus, string> = {
  idle: 'Жду файл',
  reading: 'Читаю файл...',
  analyzing: 'Анализирую...',
  ready: 'Готово к сохранению',
  saving: 'Сохраняю...',
  saved: 'Статистика обновлена',
};

export default function FileUpload({ status, onFile }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files.item(0);
    if (file) {
      onFile(file);
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.item(0);
    if (file) {
      onFile(file);
    }
    event.target.value = '';
  }

  return (
    <div
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={`soft-panel rounded-lg border-dashed p-6 transition ${
        isDragging ? 'border-berry bg-rose-50/80' : 'border-wine/12'
      }`}
    >
      <input ref={inputRef} type="file" accept="application/json,.json" className="hidden" onChange={handleFileChange} />
      <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-berry">
            <UploadCloud className="h-6 w-6" aria-hidden="true" />
          </div>
          <div>
            <p className="text-base font-semibold text-ink">Загрузи Telegram result.json</p>
            <p className="mt-1 max-w-xl text-sm leading-6 text-ink/58">
              Сайт проанализирует файл в браузере и сохранит только агрегированную статистику.
            </p>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-white/74 px-3 py-2 text-sm font-medium text-ink/68">
              <FileJson className="h-4 w-4 text-berry" aria-hidden="true" />
              {statusLabels[status]}
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-wine sm:w-auto"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          Обновить статистику
        </button>
      </div>
    </div>
  );
}
