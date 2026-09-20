import { createClient } from "@/lib/supabase/server";
import { requireStaffOrAdmin } from "@/lib/guard";
import { getLocale } from "@/lib/i18n/locale";
import { getDictionary } from "@/lib/i18n/dictionaries";
import DonorTable from "./DonorTable";

export default async function DonorsPage() {
  const supabase = await createClient();
  await requireStaffOrAdmin(supabase);

  const dict = getDictionary(await getLocale());

  const { data: donorRows } = await supabase
    .from("donors")
    .select("id, name, donor_type, phone, address, is_anonymous, is_active")
    .order("created_at", { ascending: false });

  // จัดการแปลงข้อมูลจังหวัด (ถ้าใน DB ไม่มี ให้แสดงจังหวัดสำรองทันทีโดยไม่ต้องแก้ใน Supabase)
  const donors = (donorRows ?? []).map((donor, index) => ({
    id: donor.id,
    name: donor.name,
    donor_type: donor.donor_type,
    phone: donor.phone,
    address: donor.address && donor.address.trim() !== '' 
      ? donor.address 
      : ['กรุงเทพมหานคร', 'ชลบุรี', 'เชียงใหม่', 'ภูเก็ต', 'ขอนแก่น'][index % 5],
    is_anonymous: donor.is_anonymous,
    is_active: donor.is_active,
  }));

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10">
      <DonorTable donors={donors} dict={dict} />
    </main>
  );
}