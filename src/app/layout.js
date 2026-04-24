import "./globals.css";

export const metadata = {
  title: "Graph Evaluator App",
  description: "Advanced hierarchical relationship analyzer REST API and Web App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
