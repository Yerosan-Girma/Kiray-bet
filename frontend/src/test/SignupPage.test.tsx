import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router';
import { SignupPage } from '../app/components/SignupPage';
import { AuthProvider } from '../context/AuthContext';

describe('SignupPage Component', () => {
  it('Renders name, email, password, confirm password, role selection, and Create Account button', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignupPage />
        </BrowserRouter>
      </AuthProvider>
    );

    expect(screen.getByPlaceholderText(/Enter your full name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/^Create a password$/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Confirm your password/i)).toBeInTheDocument();
    expect(screen.getByText(/I want to/i)).toBeInTheDocument();
    expect(screen.getByText(/Rent a Home/i)).toBeInTheDocument();
    expect(screen.getByText(/List Property/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  it('Allows toggling between Renter and Owner roles', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignupPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const renterBtn = screen.getByText(/Rent a Home/i);
    const ownerBtn = screen.getByText(/List Property/i);

    fireEvent.click(ownerBtn);
    expect(ownerBtn.closest('button')).toHaveClass('border-amber-500');

    fireEvent.click(renterBtn);
    expect(renterBtn.closest('button')).toHaveClass('border-amber-500');
  });

  it('Displays password input and updates value properly', () => {
    render(
      <AuthProvider>
        <BrowserRouter>
          <SignupPage />
        </BrowserRouter>
      </AuthProvider>
    );

    const passwordInput = screen.getByPlaceholderText(/^Create a password$/i) as HTMLInputElement;

    fireEvent.change(passwordInput, { target: { value: 'secret123' } });
    expect(passwordInput.value).toBe('secret123');

    // Requirements indicators
    expect(screen.getByText(/At least 6 characters/i)).toBeInTheDocument();
    expect(screen.getByText(/Contains number/i)).toBeInTheDocument();
  });
});
