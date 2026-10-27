import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from '../components/layout/Navbar';
import * as AuthContextModule from '../context/AuthContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {ui}
      </BrowserRouter>
    </QueryClientProvider>
  );
}

describe('Navbar Component', () => {
  it('Renders brand name and main navigation links', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getByText(/Kiray/i)).toBeInTheDocument();
    expect(screen.getByText(/Bet/i)).toBeInTheDocument();
    expect(screen.getByText('Properties')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
    expect(screen.getByText('Contact')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
  });

  it('Shows profile link and logout button when user is logged in', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: {
        _id: 'u1',
        id: 'u1',
        name: 'Sara Tesfaye',
        email: 'sara@example.com',
        role: 'owner',
      } as any,
      loading: false,
      login: vi.fn(),
      logout: vi.fn(),
      updateUser: vi.fn(),
    });

    renderWithProviders(<Navbar />);

    expect(screen.getAllByTitle('Sara Tesfaye')[0]).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Sign In')).not.toBeInTheDocument();
  });
});
