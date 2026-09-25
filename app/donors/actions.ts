"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";
import { formatPhone, isValidPhone, phoneDigits } from "@/lib/phone";

export async function createDonor(formData: FormData) {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const name = String(formData.get("name") || "").trim();
  // เบอร์ไม่บังคับ แต่ถ้ากรอกต้องครบ 10 หลัก เก็บเป็นรูปแบบ 000-000-0000 เสมอ
  const digits = phoneDigits(String(formData.get("phone") || ""));
  if (digits && !isValidPhone(digits)) throw new Error("invalid-phone");
  const phone = digits ? formatPhone(digits) : null;
  const donorType = formData.get("donor_type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  
  // ดึงค่า subdistrict และ province_name มารวมกันเป็น address ตามที่ตกลงกับชมพู่
  const subdistrict = String(formData.get("subdistrict") || "").trim();
  const provinceName = String(formData.get("province_name") || "").trim();
  const address = [subdistrict, provinceName].filter(Boolean).join(" ") || null;
  
  const rawAnonymous = formData.get("is_anonymous");
  const is_anonymous = rawAnonymous === "on" || rawAnonymous === "true";

  const { error } = await supabase.from("donors").insert({
      name,
      phone,
      donor_type: donorType,
      email,
      address,
      is_anonymous,
      is_active: true,
  });

  if (error) {
    redirect("/donors?error=" + encodeURIComponent(error.message));
  }

  revalidatePath("/donors");
  redirect("/donors");
}

export async function updateDonor(formData: FormData) {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const id = String(formData.get("id") || "");
  const name = String(formData.get("name") || "").trim();
  // เบอร์ไม่บังคับ แต่ถ้ากรอกต้องครบ 10 หลัก เก็บเป็นรูปแบบ 000-000-0000 เสมอ
  const digits = phoneDigits(String(formData.get("phone") || ""));
  if (digits && !isValidPhone(digits)) throw new Error("invalid-phone");
  const phone = digits ? formatPhone(digits) : null;
  const donorType = formData.get("donor_type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  
  // ดึงค่า subdistrict และ province_name มารวมกันเป็น address สำหรับอัปเดต
  const subdistrict = String(formData.get("subdistrict") || "").trim();
  const provinceName = String(formData.get("province_name") || "").trim();
  const address = [subdistrict, provinceName].filter(Boolean).join(" ") || null;
  
  const isAnonymous = formData.get("is_anonymous") === "on" || formData.get("is_anonymous") === "true";
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  const { error } = await supabase
    .from("donors")
    .update({
      name,
      phone,
      donor_type: donorType,
      email,
      address,
      is_anonymous: isAnonymous,
      is_active: isActive,
      // เอา updated_at ออกเรียบร้อยแล้ว ป้องกัน Error เรื่องคอลัมน์ไม่พบ
    })
    .eq("id", id);

  if (error) {
    redirect(`/donors/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/donors");
  revalidatePath(`/donors/${id}/edit`);
  redirect("/donors");
}