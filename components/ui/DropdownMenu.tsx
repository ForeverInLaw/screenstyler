'use client';
import { Menu } from '@base-ui/react/menu';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;

type ContentProps = Omit<Menu.Popup.Props, 'className'> & {
  className?: string;
  align?: Menu.Positioner.Props['align'];
};

export function DropdownMenuContent({ className = '', align = 'end', ...props }: ContentProps) {
  return (
    <Menu.Portal>
      <Menu.Positioner align={align} sideOffset={8} collisionPadding={8} className="z-50">
        <Menu.Popup className={`studio-popup p-1 ${className}`} {...props} />
      </Menu.Positioner>
    </Menu.Portal>
  );
}

type ItemProps = Omit<Menu.Item.Props, 'className'> & {
  className?: string;
  variant?: 'default' | 'danger';
};

export function DropdownMenuItem({ className = '', variant = 'default', ...props }: ItemProps) {
  return <Menu.Item className={`studio-option ${className}`} data-variant={variant} {...props} />;
}
