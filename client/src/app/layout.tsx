import type {Metadata} from "next";
import {Inter} from 'next/font/google';
import "./globals.css";

const inter = Inter({subsets: ['latin']});

export const metadata: Metadata = {
  title: "Time Bomb",
  description: "Jeu de société Time Bomb",
};

export default function RootLayout({
									 children,
								   }: Readonly<{
  children: React.ReactNode;
}>) {
  return (
	  <html
		  lang="fr"
		  className={`${inter.className} h-full antialiased`}
	  >
	  <body className="min-h-full flex flex-col bg-cover bg-center bg-no-repeat bg-fixed">
	  {children}
	  </body>
	  </html>
  );
}
