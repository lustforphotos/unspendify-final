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
import Notifications from './pages/Notifications';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';

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

  const renderAuthenticatedPage = (path: string, Component: React.ComponentType) => {
    return (
      <ProtectedRoute>
        <AppLayout currentPath={path}>
          <Component />
        </AppLayout>
      </ProtectedRoute>
    );
  };

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
        return renderAuthenticatedPage('/app', Dashboard);
      case '/app/tools':
        return renderAuthenticatedPage('/app/tools', Tools);
      case '/app/renewals':
        return renderAuthenticatedPage('/app/renewals', Renewals);
      case '/app/settings':
        return renderAuthenticatedPage('/app/settings', Settings);
      case '/app/analytics':
        return renderAuthenticatedPage('/app/analytics', Analytics);
      case '/app/inbox':
        return renderAuthenticatedPage('/app/inbox', InboxConnection);
      case '/app/interruptions':
        return renderAuthenticatedPage('/app/interruptions', Interruptions);
      case '/app/billing':
        return renderAuthenticatedPage('/app/billing', Billing);
      case '/app/notifications':
        return renderAuthenticatedPage('/app/notifications', Notifications);
      default:
        return <Homepage />;
    }
  };

  return renderPage();
}

export default App;
