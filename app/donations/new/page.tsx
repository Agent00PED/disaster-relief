import { getLocale } from '@/lib/i18n/locale'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { createDonation } from '../actions'
import NewDonationForm from './NewDonationForm'

export default async function NewDonationPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams
  const locale = await getLocale()
  const dict = getDictionary(locale) as unknown as Parameters<
    typeof NewDonationForm
  >[0]['dict']

  return (
    <NewDonationForm
      dict={dict}
      error={error}
      createDonationAction={createDonation}
    />
  )
}
