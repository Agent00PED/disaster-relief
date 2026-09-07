import type { Metadata } from "next";
import { Sarabun, Prompt } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { Nav } from "./nav";

// Sarabun เป็นฟอนต์มาตรฐานที่ใช้ในเอกสารราชการ/ทางการของไทย ใช้กับเนื้อหา/
// ฟอร์มที่ต้องอ่านยาวๆ เพื่อสื่อความน่าเชื่อถือกับผู้อ่าน โดยเฉพาะกลุ่ม
// ผู้ประสบภัยที่ต้องการความมั่นใจว่าระบบนี้เป็นทางการ
const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["thai", "latin"],
  weight: ["400", "500", "600", "700"],
});

// Prompt เป็นฟอนต์ของแบรนด์ WalaiTrack (โลโก้/หัวข้อใหญ่เท่านั้น) — ทีม
// เลือกธีมนี้เองหลังดู mockup แล้ว ไม่ใช้แทน Sarabun ทั้งเว็บเพราะ Prompt
// อ่านยาวๆ ไม่สบายตาเท่า เก็บไว้เฉพาะจุดที่ต้องการความรู้สึกของแบรนด์
const prompt = Prompt({
  variable: "--font-prompt",
  subsets: ["thai", "latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "WalaiTrack — ระบบติดตามการบริจาคและกระจายสิ่งของช่วยเหลือภัยพิบัติ",
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
      className={`${sarabun.variable} ${prompt.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-brand-cream">
        {user && <Nav isAdmin={isAdmin} />}
        {children}
      </body>
    </html>
  );
}
