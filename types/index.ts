export interface User {
  id: string
  name: string
  email: string
  avatarUrl?: string
  roles?: string[]
  memberSince?: string
}

export interface NavItem {
  id: string
  label: string
  href: string
  icon: React.ReactNode
  subItems?: NavItem[]
}

export interface LayoutProps {
  children: React.ReactNode
  user: User
}

export interface QuickAction {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  href?: string
  onClick?: () => void
}
