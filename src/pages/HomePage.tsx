import { useEffect, useState } from 'react';
import { getSession, logout } from '../apiClient/auth';
import { getSavedStats } from '../apiClient/stats';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatsDashboard from '../components/StatsDashboard';
import ViewPasswordGate from '../components/ViewPasswordGate';
import type { AccessLevel, SavedStats } from '../types/stats';

export default function HomePage() {
  const [access, setAccess] = useState<AccessLevel | null>(null);
  const [stats, setStats] = useState<SavedStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  async function loadStats() {
    setIsLoadingStats(true);
    try {
      const savedStats = await getSavedStats();
      setStats(savedStats);
    } finally {
      setIsLoadingStats(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then(async (session) => {
        if (!isMounted) {
          return;
        }
        setAccess(session.access);
        if (session.access === 'view' || session.access === 'editor') {
          await loadStats();
        }
      })
      .catch(() => {
        if (isMounted) {
          setAccess('none');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleAuthenticated(nextAccess: AccessLevel) {
    setAccess(nextAccess);
    if (nextAccess === 'view' || nextAccess === 'editor') {
      await loadStats();
    }
  }

  async function handleLogout() {
    await logout();
    setAccess('none');
    setStats(null);
  }

  if (access === null) {
    return <LoadingState title="Проверяю доступ" subtitle="Смотрю, можно ли открыть страницу без повторного ввода пароля." />;
  }

  if (access === 'none') {
    return <ViewPasswordGate onSuccess={handleAuthenticated} />;
  }

  if (isLoadingStats) {
    return <LoadingState title="Готовлю статистику" subtitle="Забираю последнюю сохранённую версию." />;
  }

  if (!stats) {
    return <EmptyState editorHint />;
  }

  return <StatsDashboard stats={stats} onLogout={handleLogout} />;
}
