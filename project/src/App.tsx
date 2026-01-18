import { useState, useEffect } from 'react';
import Homepage from './pages/Homepage';
import HowItWorks from './pages/HowItWorks';
import Pricing from './pages/Pricing';
import Security from './pages/Security';
import About from './pages/About';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ResetPassword from './pages/ResetPassword';
import UpdatePassword from './pages/UpdatePassword';
import Dashboard from './pages/Dashboard';
import Tools from './pages/Tools';
import Renewals from './pages/Renewals';
import Settings from './pages/Settings';
import Analytics from './pages/Analytics';
import GettingStarted from './pages/GettingStarted';
import InboxConnection from './pages/InboxConnection';
import Interruptions from './pages/Interruptions';
import Billing from './pages/Billing';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(window.history, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
    };
  }, []);

  const renderPage = () => {
    switch (currentPath) {
      case '/':
        return <Homepage />;
      case '/how-it-works':
        return <HowItWorks />;
      case '/pricing':
        return <Pricing />;
      case '/security':
        return <Security />;
      case '/about':
        return <About />;
      case '/getting-started':
        return <GettingStarted />;
      case '/privacy':
        return <Privacy />;
      case '/terms':
        return <Terms />;
      case '/login':
        return <Login />;
      case '/signup':
        return <Signup />;
      case '/reset-password':
        return <ResetPassword />;
      case '/update-password':
        return <UpdatePassword />;
      case '/app':
        return (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        );
      case '/app/tools':
        return (
          <ProtectedRoute>
            <Tools />
          </ProtectedRoute>
        );
      case '/app/renewals':
        return (
          <ProtectedRoute>
            <Renewals />
          </ProtectedRoute>
        );
      case '/app/settings':
        return (
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        );
      case '/app/analytics':
        return (
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        );
      case '/app/inbox':
        return (
          <ProtectedRoute>
            <InboxConnection />
          </ProtectedRoute>
        );
      case '/app/interruptions':
        return (
          <ProtectedRoute>
            <Interruptions />
          </ProtectedRoute>
        );
      case '/app/billing':
        return (
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        );
      default:
        return <Homepage />;
    }
  };

  return renderPage();
}

export default App;
