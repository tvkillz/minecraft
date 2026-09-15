import { getSiteId } from '@/lib/site'
import { getSupabaseBrowserClient } from '@/lib/supabase/client'

export type BillingProfile = {
  firstName: string
  lastName: string
  addressLine1: string
  addressLine2: string
  city: string
  stateProvince: string
  postalCode: string
  country: string
  phone: string
}

export const EMPTY_BILLING_PROFILE: BillingProfile = {
  firstName: '',
  lastName: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  stateProvince: '',
  postalCode: '',
  country: '',
  phone: '',
}

/** Required on checkout before pay / test payment. */
export const CHECKOUT_REQUIRED_BILLING_FIELDS = [
  'firstName',
  'lastName',
  'city',
  'country',
  'postalCode',
] as const satisfies readonly (keyof BillingProfile)[]

const CHECKOUT_FIELD_LABELS: Record<(typeof CHECKOUT_REQUIRED_BILLING_FIELDS)[number], string> = {
  firstName: 'First name',
  lastName: 'Last name',
  city: 'City',
  country: 'Country',
  postalCode: 'Postal code',
}

export function validateBillingProfileForCheckout(
  profile: BillingProfile,
): { ok: true } | { ok: false; message: string } {
  for (const field of CHECKOUT_REQUIRED_BILLING_FIELDS) {
    if (!profile[field].trim()) {
      return { ok: false, message: `${CHECKOUT_FIELD_LABELS[field]} is required.` }
    }
  }
  return { ok: true }
}

type BillingRow = {
  first_name: string
  last_name: string
  address_line1: string
  address_line2: string
  city: string
  state_province: string
  postal_code: string
  country: string
  phone: string
}

function mapRow(row: BillingRow): BillingProfile {
  return {
    firstName: row.first_name ?? '',
    lastName: row.last_name ?? '',
    addressLine1: row.address_line1 ?? '',
    addressLine2: row.address_line2 ?? '',
    city: row.city ?? '',
    stateProvince: row.state_province ?? '',
    postalCode: row.postal_code ?? '',
    country: row.country ?? '',
    phone: row.phone ?? '',
  }
}

export async function fetchBillingProfile(userId: string): Promise<BillingProfile | null> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) return null

  const siteId = getSiteId()
  const { data, error } = await supabase
    .from('user_billing_profiles')
    .select(
      'first_name, last_name, address_line1, address_line2, city, state_province, postal_code, country, phone',
    )
    .eq('user_id', userId)
    .eq('site_id', siteId)
    .maybeSingle()

  if (error || !data) return null
  return mapRow(data as BillingRow)
}

export async function saveBillingProfile(
  userId: string,
  profile: BillingProfile,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { ok: false, message: 'Database is not configured.' }
  }

  const siteId = getSiteId()
  const row = {
    user_id: userId,
    site_id: siteId,
    first_name: profile.firstName.trim(),
    last_name: profile.lastName.trim(),
    address_line1: profile.addressLine1.trim(),
    address_line2: profile.addressLine2.trim(),
    city: profile.city.trim(),
    state_province: profile.stateProvince.trim(),
    postal_code: profile.postalCode.trim(),
    country: profile.country.trim(),
    phone: profile.phone.trim(),
    updated_at: new Date().toISOString(),
  }

  const { error } = await supabase.from('user_billing_profiles').upsert(row, {
    onConflict: 'user_id,site_id',
  })

  if (error) {
    return { ok: false, message: error.message || 'Could not save billing info.' }
  }

  return { ok: true }
}
