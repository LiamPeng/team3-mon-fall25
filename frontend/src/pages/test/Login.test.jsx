// src/pages/test/Login.test.jsx
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../Login';
import { endpoints } from '../../api/endpoints';
import apiClient from '../../api/client';

const mockLoginFn = vi.fn();
const mockNavigate = vi.fn();

// Mock AuthContext
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    login: mockLoginFn,
    isAuthenticated: vi.fn(() => false),
    isLoading: false,
  }),
}));

// Mock react-router-dom (only what we need)
vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

// Mock api client
vi.mock('../../api/client', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('Login page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function fillAndSubmitForm(email, password) {
    const emailInput = screen.getByPlaceholderText('your.email@nyu.edu');
    const passwordInput = screen.getByPlaceholderText('Minimum 6 characters');
    const button = screen.getByRole('button', { name: /login \/ register/i });

    fireEvent.change(emailInput, { target: { value: email } });
    fireEvent.change(passwordInput, { target: { value: password } });
    fireEvent.click(button);
  }

  it('shows validation error for non-NYU email and does not call API', async () => {
    render(<Login />);

    fillAndSubmitForm('user@gmail.com', 'password123');

    expect(
      screen.getByText('Please use your NYU email address (@nyu.edu)')
    ).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('logs in verified user and redirects to home', async () => {
    apiClient.post.mockResolvedValueOnce({
      data: {
        access_token: 'access',
        refresh_token: 'refresh',
        user: { id: 1, email: 'user@nyu.edu' },
      },
    });

    render(<Login />);

    fillAndSubmitForm('user@nyu.edu', 'password123');

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenCalledWith(endpoints.auth.login, {
        email: 'user@nyu.edu',
        password: 'password123',
      });
      expect(mockLoginFn).toHaveBeenCalledWith(
        'access',
        'refresh',
        { id: 1, email: 'user@nyu.edu' }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('registers new user and redirects to verify-email when login returns 404 with requires_registration', async () => {
    // First call: login -> 404 requires_registration
    apiClient.post
      .mockRejectedValueOnce({
        response: {
          status: 404,
          data: { requires_registration: true },
        },
      })
      // Second call: register -> success
      .mockResolvedValueOnce({
        data: {
          message: 'Registration successful',
        },
      });

    render(<Login />);

    fillAndSubmitForm('newuser@nyu.edu', 'password123');

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenNthCalledWith(
        1,
        endpoints.auth.login,
        {
          email: 'newuser@nyu.edu',
          password: 'password123',
        }
      );
      expect(apiClient.post).toHaveBeenNthCalledWith(
        2,
        endpoints.auth.register,
        {
          email: 'newuser@nyu.edu',
          password: 'password123',
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: { email: 'newuser@nyu.edu' },
      });
    });
  });

  it('sends OTP and redirects to verify-email when login returns 403 with requires_verification', async () => {
    // First call: login -> 403 requires_verification
    apiClient.post
      .mockRejectedValueOnce({
        response: {
          status: 403,
          data: { requires_verification: true },
        },
      })
      // Second call: send-otp -> success
      .mockResolvedValueOnce({
        data: {
          message: 'Verification code sent successfully.',
        },
      });

    render(<Login />);

    fillAndSubmitForm('existing@nyu.edu', 'password123');

    await waitFor(() => {
      expect(apiClient.post).toHaveBeenNthCalledWith(
        1,
        endpoints.auth.login,
        {
          email: 'existing@nyu.edu',
          password: 'password123',
        }
      );
      expect(apiClient.post).toHaveBeenNthCalledWith(
        2,
        endpoints.auth.sendOtp,
        {
          email: 'existing@nyu.edu',
        }
      );
      expect(mockNavigate).toHaveBeenCalledWith('/verify-email', {
        state: { email: 'existing@nyu.edu' },
      });
    });
  });
});
