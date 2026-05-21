import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthButton } from './AuthButton';
import { signOut, useSession } from '@/lib/auth/client';

vi.mock('@/lib/auth/client', () => ({
  useSession: vi.fn(),
  signOut: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('AuthButton', () => {
  it('opens a profile menu before signing out', async () => {
    (useSession as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      data: { user: { email: 'werrygoodtest@gmail.com' } },
      isPending: false,
    });

    render(<AuthButton />);
    expect(screen.queryByText('werrygoodtest@gmail.com')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: /open profile menu/i }));

    expect(signOut).not.toHaveBeenCalled();
    expect(screen.getByText('werrygoodtest@gmail.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(signOut).toHaveBeenCalledTimes(1);
  });
});
