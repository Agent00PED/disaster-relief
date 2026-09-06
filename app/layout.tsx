import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ",
  description: "ระบบภายในสำหรับเจ้าหน้าที่ศูนย์รับบริจาคและศูนย์พักพิง",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // layout ครอบทุกหน้ารวมถึง /login กับ /pledge (สาธารณะ) ด้วย เลยต้องเช็ค
  // session เองตรงนี้ก่อนตัดสินใจว่าจะโชว์แถบเมนูไหม — ไม่งั้นคนที่ยังไม่
  // login จะเห็นแถบเมนูของหน้าที่ตัวเองเข้าไม่ได้อยู่ดี
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    isAdmin = profile?.role === "admin";
  }

  return (
    <html
      lang="th"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100">
        {user && <Nav isAdmin={isAdmin} />}
        {children}
      </body>
    </html>
  );
}
