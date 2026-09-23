import { createClient } from "@/lib/supabase/server";
import { requireStaffOrAdmin } from "@/lib/guard";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import DonorTable from "./DonorTable";

export default async function DonorsPage() {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const dict = getDictionary(await getLocale());

  // ดึงข้อมูลตรง ๆ จาก Supabase โดยไม่มีการแปลงหรือสุ่มข้อมูลจังหวัดทับ
  const { data: donors, error } = await supabase
    .from("donors")
    .select("id, name, donor_type, phone, address, is_anonymous, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching donors:", error.message);
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <DonorTable donors={donors ?? []} dict={dict} />
    </main>
  );
}