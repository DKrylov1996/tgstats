import EditPage from './pages/EditPage';
import HomePage from './pages/HomePage';

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/editpage')) {
    return <EditPage />;
  }

  return <HomePage />;
}
