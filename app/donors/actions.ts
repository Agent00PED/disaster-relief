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
  const donorType = formData.get("type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  
  // ปรับตรงนี้ให้รองรับค่า "on" จาก checkbox ในฟอร์มด้วย
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
  const donorType = formData.get("donor_type") === "organization" ? "organization" : "individual";
  const email = String(formData.get("email") || "").trim() || null;
  const address = String(formData.get("address") || "").trim() || null;
  const isAnonymous = formData.get("is_anonymous") === "on";
  const isActive = formData.get("is_active") === "on";

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
    })
    .eq("id", id);

  if (error) {
    redirect(`/donors/${id}/edit?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/donors");
  revalidatePath(`/donors/${id}/edit`);
  redirect("/donors");
}