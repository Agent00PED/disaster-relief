import { redirect } from 'next/navigation'

export default async function DonationEditRedirect({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  redirect(`/donations/${id}/receipt/edit`)
}

