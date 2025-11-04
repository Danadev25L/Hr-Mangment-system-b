import '@/styles/globals.css';

export const metadata = {
  title: "HR Management System",
  description: "Complete HR management solution for your organization",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
