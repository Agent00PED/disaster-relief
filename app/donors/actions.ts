"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaffOrAdmin } from "@/lib/guard";
import { createClient } from "@/lib/supabase/server";

export async function createDonor(formData: FormData) {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  // แก้จาก "type" เป็น "donor_type" ให้ตรงกับฟอร์ม
  const donorType = formData.get("donor_type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  
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
  const phone = String(formData.get("phone") || "").trim() || null;
  // ดึงค่า donor_type และ email กลับมาอัปเดต เพื่อไม่ให้ข้อมูลหาย
  const donorType = formData.get("donor_type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  
  // จัดการเช็คบ็อกซ์ (รองรับทั้ง "on" และ "true")
  const isAnonymous = formData.get("is_anonymous") === "on" || formData.get("is_anonymous") === "true";
  const isActive = formData.get("is_active") === "on" || formData.get("is_active") === "true";

  const { error } = await supabase
    .from("donors")
    .update({
      name,
      phone,
      donor_type: donorType, // ส่งค่าประเภทกลับไปอัปเดต
      email,                 // ส่งค่าอีเมลกลับไปอัปเดต
      address,
      is_anonymous: isAnonymous,
      is_active: isActive,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    redirect(`/donors/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/donors");
  revalidatePath(`/donors/${id}/edit`);
  redirect("/donors");
}