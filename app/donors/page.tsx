import { createClient } from "@/lib/supabase/server";
import { requireStaffOrAdmin } from "@/lib/guard";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import DonorTable from "./DonorTable";

export default async function DonorsPage() {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const dict = getDictionary(await getLocale());

  // 1. ดึงข้อมูลรายชื่อผู้บริจาค
  const { data: donorsData, error } = await supabase
    .from("donors")
    .select("id, name, donor_type, phone, address, is_anonymous, is_active")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching donors:", error.message);
  }

  // 2. ดึงข้อมูลสรุปจาก v_donor_summary เพื่อเอาจำนวนครั้งที่บริจาค (donation_count)
  const { data: summaryData } = await supabase
    .from("v_donor_summary")
    .select("donor_id, donation_count");

  // สร้าง Map สำหรับเก็บจำนวนครั้งการบริจาคเทียบกับ donor_id
  const countMap = new Map<string, number>();
  if (summaryData) {
    summaryData.forEach((item) => {
      countMap.set(item.donor_id, item.donation_count ?? 0);
    });
  }

  // 3. แม็ปจำนวนครั้งการบริจาค (donation_count) เข้าไปในข้อมูล donors
  const donors = (donorsData ?? []).map((donor) => ({
    ...donor,
    donation_count: countMap.get(donor.id) ?? 0,
  }));

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-6 py-10">
      <DonorTable donors={donors} dict={dict} />
    </main>
  );
}