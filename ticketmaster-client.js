export async function searchTicketmasterEvents({ keyword = '', city = '', countryCode = '', classificationName = '', startDateTime = '' } = {}) {
  const params = new URLSearchParams()
  if (keyword) params.set('keyword', keyword)
  if (city) params.set('city', city)
  if (countryCode) params.set('countryCode', countryCode)
  if (classificationName) params.set('classificationName', classificationName)
  if (startDateTime) params.set('startDateTime', startDateTime)
  const response = await fetch(`/api/events?${params.toString()}`)
  if (!response.ok) throw new Error('Unable to load events')
  const payload = await response.json()
  return payload?._embedded?.events || []
}
