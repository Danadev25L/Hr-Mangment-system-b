const lightTheme = {
  token: {
    colorPrimary: '#2563eb',
    colorSuccess: '#16a34a',
    colorWarning: '#d97706',
    colorError: '#dc2626',
    colorInfo: '#0891b2',
    borderRadius: 8,
    wireframe: false,
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    colorText: '#000000d9',
    colorTextSecondary: '#00000073',
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      colorBgContainer: '#ffffff',
    },
    Table: {
      borderRadius: 8,
      headerBg: '#fafafa',
      colorBgContainer: '#ffffff',
    },
    Menu: {
      borderRadius: 6,
      colorBgContainer: '#ffffff',
      itemBg: '#ffffff',
      itemSelectedBg: '#e6f4ff',
      itemColor: '#000000d9',
      itemSelectedColor: '#2563eb',
    },
    Modal: {
      borderRadius: 8,
      colorBgContainer: '#ffffff',
    },
    Layout: {
      siderBg: '#ffffff',
      headerBg: '#ffffff',
      bodyBg: '#f5f5f5',
    },
  },
}

const darkTheme = {
  token: {
    colorPrimary: '#3b82f6',
    colorSuccess: '#22c55e',
    colorWarning: '#f59e0b',
    colorError: '#ef4444',
    colorInfo: '#06b6d4',
    borderRadius: 8,
    wireframe: false,
    colorBgContainer: '#1f1f1f',
    colorBgElevated: '#262626',
    colorBgLayout: '#141414',
    colorText: '#ffffffd9',
    colorTextSecondary: '#ffffff73',
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
  },
  components: {
    Button: {
      borderRadius: 6,
      controlHeight: 40,
      fontWeight: 500,
    },
    Input: {
      borderRadius: 6,
      controlHeight: 40,
      colorBgContainer: '#1f1f1f',
      colorBorder: '#434343',
    },
    Select: {
      borderRadius: 6,
      controlHeight: 40,
    },
    Card: {
      borderRadius: 8,
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.3), 0 1px 2px 0 rgba(0, 0, 0, 0.2)',
      colorBgContainer: '#1f1f1f',
    },
    Table: {
      borderRadius: 8,
      headerBg: '#262626',
      colorBgContainer: '#1f1f1f',
      colorText: '#ffffffd9',
    },
    Menu: {
      borderRadius: 6,
      colorBgContainer: '#1f1f1f',
      itemBg: '#1f1f1f',
      itemSelectedBg: '#111b26',
      itemColor: '#ffffffd9',
      itemSelectedColor: '#3b82f6',
    },
    Modal: {
      borderRadius: 8,
      colorBgContainer: '#1f1f1f',
    },
    Layout: {
      siderBg: '#1f1f1f',
      headerBg: '#1f1f1f',
      bodyBg: '#141414',
    },
  },
}

export { lightTheme, darkTheme }
export default lightTheme