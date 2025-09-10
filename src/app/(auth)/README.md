# Authentication Pages

This directory contains the authentication pages for the Todo List application.

## Pages

### Login Page (`/login`)
- Displays the login form with email and password fields
- Handles form validation and error display
- Redirects authenticated users to dashboard
- Supports redirect URL parameter for better UX after login
- Shows loading state while checking authentication

### Register Page (`/register`)
- Displays the registration form with email, password, and confirm password fields
- Includes password strength indicator
- Handles form validation and error display
- Shows success message after registration
- Redirects authenticated users to dashboard
- Shows loading state while checking authentication

## Features

### Automatic Redirects
- Authenticated users are automatically redirected to `/dashboard` when accessing auth pages
- Unauthenticated users are redirected to `/login` when accessing protected routes
- Login page supports `redirectTo` query parameter to redirect users back to their intended destination

### Error Handling
- Form validation errors are displayed inline
- Authentication errors from Supabase are shown with user-friendly messages
- Network errors are handled gracefully

### Loading States
- Loading spinners are shown while checking authentication status
- Form submission loading states prevent multiple submissions

### Accessibility
- Proper ARIA labels and roles
- Keyboard navigation support
- Screen reader friendly error messages

## Implementation Details

### Authentication Flow
1. User visits auth page
2. `useAuthContext` checks current authentication status
3. If authenticated, redirect to dashboard
4. If not authenticated, show auth form
5. On successful auth, redirect to dashboard or intended destination

### Form Integration
- Uses React Hook Form for form management
- Zod validation schemas for client-side validation
- Integration with Supabase authentication

### Middleware Integration
- Middleware handles server-side redirects
- Protects routes at the edge for better performance
- Handles authentication state before page loads