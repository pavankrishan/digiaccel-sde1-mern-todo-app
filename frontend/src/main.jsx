import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { TaskUIProvider } from './components/TaskUIProvider';
import { TopProgressBar } from './components/Loaders';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (count, err) => err?.status !== 400 && err?.status !== 404 && count < 2,
    },
  },
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TaskUIProvider>
          <TopProgressBar />
          <App />
        </TaskUIProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);
