import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { refreshSession } from '@/features/auth/session';
import { queryClient } from '@/lib/queryClient';
import { router } from '@/routes';
import './index.css';

// Restore the session from the refresh cookie once, before first render decides where to send the user.
void refreshSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
