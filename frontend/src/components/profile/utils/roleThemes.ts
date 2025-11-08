export interface RoleTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  borderColor: string;
  iconColor: string;
}

export const roleThemes: Record<string, RoleTheme> = {
  admin: {
    primary: '#1890ff',
    secondary: '#40a9ff',
    accent: '#096dd9',
    background: '#f0f8ff',
    text: '#003a8c',
    border: '#91d5ff',
    borderColor: 'border-blue-500',
    iconColor: '#1890ff'
  },
  manager: {
    primary: '#52c41a',
    secondary: '#73d13d',
    accent: '#389e0d',
    background: '#f6ffed',
    text: '#135200',
    border: '#b7eb8f',
    borderColor: 'border-green-500',
    iconColor: '#52c41a'
  },
  employee: {
    primary: '#722ed1',
    secondary: '#9254de',
    accent: '#531dab',
    background: '#f9f0ff',
    text: '#391085',
    border: '#d3adf7',
    borderColor: 'border-purple-500',
    iconColor: '#722ed1'
  }
};

export const getRoleTheme = (role: string): RoleTheme => {
  return roleThemes[role] || roleThemes.employee;
};