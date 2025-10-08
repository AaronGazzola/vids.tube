import { ReactNode } from 'react';

export interface EditorLayoutProps {
  children: ReactNode;
}

export interface EditorHeaderProps {}

export interface EditorSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export interface EditorMainProps {
  children: ReactNode;
}
