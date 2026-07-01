import React from "react";
import ReactDOM from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import "./index.css";

const sentryDsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment:
      (import.meta.env.VITE_ENVIRONMENT as string | undefined) ??
      import.meta.env.MODE,
    sendDefaultPii: false,
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: true },
    mutations: { retry: false },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <CartProvider>
            <Sentry.ErrorBoundary
              fallback={
                <div className="grid min-h-screen place-items-center p-6 text-center">
                  <div>
                    <h1 className="text-2xl font-bold">Something went wrong</h1>
                    <p className="mt-2 text-slate-600">
                      Refresh the page or try again shortly.
                    </p>
                  </div>
                </div>
              }
            >
              <App />
            </Sentry.ErrorBoundary>
          </CartProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
