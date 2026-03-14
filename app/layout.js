import "./globals.css";

export const metadata = {
  title: "Halftime Quiz",
  description: "Halftime quiz events, admin tools, and public gameplay flows.",
  icons: {
    icon: "/icons/favHQ.png",
    shortcut: "/icons/favHQ.png",
    apple: "/icons/favHQ.png",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
