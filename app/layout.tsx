import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const mono = Geist_Mono({ subsets: ['latin'], variable: '--font-mono' })
export const metadata: Metadata = { title: 'AXS — Event access, without the friction', description: 'Manage event tickets, claims, and receipts in one clear workspace.' }
export const viewport: Viewport = { themeColor: '#102a43', userScalable: false }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body className={`${geist.variable} ${mono.variable}`}>{children}</body></html> }

