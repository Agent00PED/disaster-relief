import type { Metadata } from "next";
import { Sarabun } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";

// Sarabun เป็นฟอนต์มาตรฐานที่ใช้ในเอกสารราชการ/ทางการของไทย เลือกใช้เพื่อ
// สื่อความน่าเชื่อถือกับผู้อ่าน โดยเฉพาะกลุ่มผู้ประสบภัยที่ต้องการความมั่นใจ
// ว่าระบบนี้เป็นทางการ ไม่ใช่เพื่อความสวยงามส่วนตัวของผู้พัฒนา
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
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
      className={`${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-100">
        {user && <Nav isAdmin={isAdmin} />}
        {children}
      </body>
    </html>
  );
}
