import React, { useEffect, useContext, useState } from "react";
import { AuthProvider, AuthContext } from "./contexts/AuthContext";
import LoginForm from "./components/LoginForm";
import AdminDashboard from "./components/AdminDashboard";
import StaffDashboard from "./components/StaffDashboard";
import DatabaseDiagnostic from "./components/DatabaseDiagnostic";
import { dbService } from "./utils/db";
import { initializeDatabase } from "./utils/storage";

// Loading component
const LoadingSpinner = ({ message = "Loading...", error = null }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center">
    <div className="text-center max-w-md mx-auto p-6">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">Initializing Application</h2>
      <p className="text-gray-500 mb-4">{message}</p>

      {error && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">Warning: {error}</p>
          <p className="text-yellow-600 text-xs mt-1">Attempting to continue with recovery options...</p>
        </div>
      )}
    </div>
  </div>
);

// Database error component
const DatabaseErrorScreen = ({ error, onRetry, onShowDiagnostic }) => (
  <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
    <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
      <div className="text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Error</h2>
        <p className="text-gray-600 mb-6 text-sm">{error}</p>
        <div className="space-y-3">
          <button onClick={onRetry} className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium">
            Retry Connection
          </button>
          <button
            onClick={onShowDiagnostic}
            className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
          >
            Show Diagnostics & Recovery
          </button>
        </div>
      </div>
    </div>
  </div>
);

// Main app content component
const AppContent = () => {
  const { currentUser, isAuthenticated, isLoading, error, databaseError, showDatabaseDiagnostic, logout, handleDatabaseRecovery } = useContext(AuthContext);

  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [retryAttempts, setRetryAttempts] = useState(0);

  // Show database diagnostic if requested or if there are database errors
  if (showDatabaseDiagnostic || showDiagnostic) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Diagnostic & Recovery</h1>
            <p className="text-gray-600">There seems to be an issue with the database. Use the tools below to diagnose and fix the problem.</p>
          </div>

          <DatabaseDiagnostic
            dbService={dbService}
            onRecoveryComplete={() => {
              setShowDiagnostic(false);
              handleDatabaseRecovery();
            }}
          />

          {!showDatabaseDiagnostic && (
            <div className="mt-6 text-center">
              <button onClick={() => setShowDiagnostic(false)} className="bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors">
                Back to App
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Show loading spinner
  if (isLoading) {
    return <LoadingSpinner message="Initializing authentication..." />;
  }

  // Show database error screen
  if (databaseError) {
    return (
      <DatabaseErrorScreen
        error={databaseError}
        onRetry={() => {
          setRetryAttempts((prev) => prev + 1);
          handleDatabaseRecovery();
        }}
        onShowDiagnostic={() => setShowDiagnostic(true)}
      />
    );
  }

  // Show login form if not authenticated
  if (!isAuthenticated) {
    return <LoginForm />;
  }

  // Show appropriate dashboard based on user role
  if (currentUser?.role === "admin") {
    return <AdminDashboard logout={logout} />;
  } else {
    return <StaffDashboard logout={logout} />;
  }
};

// Main App component
const App = () => {
  const [isStorageInitialized, setIsStorageInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState(null);
  const [showDiagnostic, setShowDiagnostic] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log("Initializing application...");

        // First, try to initialize the enhanced database system
        const dbSuccess = await dbService.initDatabase();
        if (!dbSuccess) {
          console.warn("Enhanced database initialization failed, trying legacy initialization...");

          // Fallback to legacy initialization
          await initializeDatabase();
        }

        setIsStorageInitialized(true);
        console.log("Application initialization completed successfully");
      } catch (error) {
        console.error("App initialization failed:", error);
        setInitializationError(error.message);

        // Check if it's a database-related error
        if (
          error.message.includes("object store") ||
          error.message.includes("IndexedDB") ||
          error.message.includes("Database") ||
          error.message.includes("not a known object store name")
        ) {
          setShowDiagnostic(true);
        }

        // Still allow the app to continue
        setIsStorageInitialized(true);
      }
    };

    initializeApp();
  }, []);

  // Show diagnostic screen if database issues are detected during initialization
  if (showDiagnostic && !isStorageInitialized) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Database Initialization Failed</h1>
            <p className="text-gray-600 mb-2">The application failed to initialize properly due to database issues.</p>
            {initializationError && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                <p className="text-red-700 text-sm font-medium">Error: {initializationError}</p>
              </div>
            )}
          </div>

          <DatabaseDiagnostic
            dbService={dbService}
            onRecoveryComplete={() => {
              setShowDiagnostic(false);
              setInitializationError(null);
              setIsStorageInitialized(true);
            }}
          />
        </div>
      </div>
    );
  }

  // Show loading screen while initializing
  if (!isStorageInitialized) {
    return <LoadingSpinner message="Setting up database and storage..." error={initializationError} />;
  }

  // Show initialization error with recovery options
  if (initializationError && !showDiagnostic) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Initialization Warning</h2>
          <p className="text-gray-600 mb-4 text-sm">{initializationError}</p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Reload Application
            </button>
            <button
              onClick={() => setShowDiagnostic(true)}
              className="w-full bg-gray-200 text-gray-800 px-6 py-2 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
            >
              Show Diagnostics
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider dbService={dbService}>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
};

export default App;
