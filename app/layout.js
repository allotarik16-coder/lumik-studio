import './globals.css';

export const metadata = {
  title: 'LUMIK Studio',
  description: 'AI Image Generation for E-Commerce',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-gradient-to-br from-[#080808] to-[#1a1a1a] text-white">
        {children}
      </body>
    </html>
  );
}
