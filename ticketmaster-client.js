export function mapTicketmasterEvent(event) { const image = [...(event?.images || [])].sort((a,b) => (b.width || 0) - (a.width || 0))[0]?.url || ''; const venue = event?._embedded?.venues?.[0]; const date = event?.dates?.start?.localDate || ''; return { id: event?.id || crypto.randomUUID(), name: event?.name || 'Live event', image, date, venue: venue?.name || venue?.city?.name || 'Venue TBA', url: event?.url || '#' } }

export async function searchTicketmasterEvents({ keyword = '', city = '', countryCode = '', classificationName = '', startDateTime = '' } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (city) params.set('city', city)
  if (countryCode) params.set('countryCode', countryCode)
  if (classificationName) params.set('classificationName', classificationName)
  if (startDateTime) params.set('startDateTime', startDateTime)
  const response = await fetch(`/api/events?${params.toString()}`)
  if (response.status === 503) return []
  if (!response.ok) throw new Error('Unable to load events')
  const payload = await response.json()
  return payload?._embedded?.events || []
}
