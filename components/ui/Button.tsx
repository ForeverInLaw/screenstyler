import type { ComponentProps } from 'react';

type Props = ComponentProps<'button'> & {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  iconOnly?: boolean;
};

export function Button({ variant = 'default', iconOnly, className = '', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={`button button-${variant}${iconOnly ? ' button-icon' : ''} ${className}`}
      {...props}
    />
  );
}
