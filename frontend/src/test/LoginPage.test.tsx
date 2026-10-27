import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { LoginPage } from '../app/components/LoginPage';
import { AuthProvider } from '../context/AuthContext';

describe('LoginPage Component', () => {
  it('Renders email, password inputs, and Sign In button', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Create account/i)).toBeInTheDocument();
  });

  it('Toggles password visibility when eye button is clicked', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement;
    expect(passwordInput.type).toBe('password');

    // The eye toggle button inside the password wrapper
    const toggleBtn = passwordInput.parentElement?.querySelector('button') as HTMLButtonElement;
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('text');

    fireEvent.click(toggleBtn);
    expect(passwordInput.type).toBe('password');
  });

  it('Updates form state when user types into inputs', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <LoginPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const emailInput = screen.getByPlaceholderText(/Enter your email/i) as HTMLInputElement;
    const passwordInput = screen.getByPlaceholderText(/Enter your password/i) as HTMLInputElement;

    fireEvent.change(emailInput, { target: { value: 'user@test.com' } });
    fireEvent.change(passwordInput, { target: { value: 'secretPass123' } });

    expect(emailInput.value).toBe('user@test.com');
    expect(passwordInput.value).toBe('secretPass123');
  });
});
