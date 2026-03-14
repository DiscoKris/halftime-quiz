import "./globals.css";

export const metadata = {
  title: "MyHalftimeQuiz.com",
  description: "Halftime quiz events, admin tools, and public gameplay flows.",
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
