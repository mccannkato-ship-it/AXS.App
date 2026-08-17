const genreLabels = ['Concerts', 'Sports', 'Arts & Theatre', 'Family', 'Comedy']

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function findLocationAnchor() {
  const elements = [...document.querySelectorAll('input, button, label, h1, h2, h3, p, span')]
  return elements.find((element) => /location|near you|your city/i.test(element.textContent || element.placeholder || ''))
}

function renderCard(events) {
  const cards = events.slice(0, 3).map((event, index) => {
    const image = event.images?.find((item) => item.ratio === '16_9')?.url || event.images?.[0]?.url || ''
    const venue = event._embedded?.venues?.[0]?.name || 'Venue TBA'
    const date = event.dates?.start?.localDate || 'Date TBA'
    return `<a class="axs-discovery-event" href="${escapeHtml(event.url || '#')}" target="_blank" rel="noopener noreferrer" style="--card-index:${index}"><div class="axs-discovery-event-image" style="${image ? `background-image:url('${escapeHtml(image)}')` : ''}"></div><div class="axs-discovery-event-copy"><strong>${escapeHtml(event.name || 'Live event')}</strong><span>${escapeHtml(date)} · ${escapeHtml(venue)}</span></div></a>`
  }).join('')
  const fallback = '<div class="axs-discovery-empty">Live events will appear here when available.</div>'
  return `<section class="axs-discovery-cards" aria-label="Explore event genres"><div class="axs-discovery-cards-heading"><div><p class="axs-discovery-eyebrow">DISCOVER</p><h2>Explore Event Genres</h2></div><div class="axs-discovery-genres">${genreLabels.map((label) => `<span>${label}</span>`).join('')}</div></div><div class="axs-discovery-event-stack">${cards || fallback}</div></section>`
}

async function mountDiscoveryCards() {
  if (document.querySelector('.axs-discovery-cards')) return
  const anchor = findLocationAnchor()
  if (!anchor) return false
  const container = anchor.closest('section, form, main, div') || anchor.parentElement
  if (!container) return false
  const card = document.createElement('div')
  card.innerHTML = renderCard([])
  container.insertAdjacentElement('afterend', card.firstElementChild)
  try {
    const city = anchor instanceof HTMLInputElement ? anchor.value.trim() : ''
    const query = city ? `?city=${encodeURIComponent(city)}&size=3` : '?size=3'
    const response = await fetch(`/api/events${query}`)
    if (!response.ok) return true
    const payload = await response.json()
    const section = document.querySelector('.axs-discovery-cards')
    if (section) section.outerHTML = renderCard(payload?._embedded?.events || [])
  } catch {
    // The fallback card remains visible when live event data is unavailable.
  }
  return true
}

const discoveryStyle = document.createElement('style')
discoveryStyle.textContent = `.axs-discovery-cards{margin:28px 0 8px;padding:18px;border:1px solid rgba(106,142,210,.24);border-radius:22px;background:#f7faff;color:#10214a;overflow:hidden}.axs-discovery-cards-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.axs-discovery-eyebrow{margin:0 0 5px;color:#6b8dca;font-size:10px;font-weight:800;letter-spacing:.15em}.axs-discovery-cards h2{margin:0;color:#2f6fcb;font-size:20px;line-height:1.15}.axs-discovery-genres{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.axs-discovery-genres span{padding:5px 8px;border-radius:999px;background:#e8f0ff;color:#3f76c4;font-size:10px;font-weight:700}.axs-discovery-event-stack{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.axs-discovery-event{display:flex;min-width:0;flex-direction:column;overflow:hidden;border-radius:14px;background:#fff;color:#10214a;text-decoration:none;box-shadow:0 5px 16px rgba(36,78,140,.1)}.axs-discovery-event-image{height:92px;background:#dfe9f7 center/cover no-repeat}.axs-discovery-event-copy{display:grid;gap:4px;padding:10px}.axs-discovery-event-copy strong{overflow:hidden;font-size:12px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-event-copy span{overflow:hidden;color:#6e7f9e;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-empty{padding:22px;text-align:center;color:#6e7f9e;font-size:12px}@media(max-width:620px){.axs-discovery-cards{margin-top:24px;padding:14px}.axs-discovery-cards-heading{display:grid}.axs-discovery-genres{justify-content:flex-start}.axs-discovery-event-stack{grid-template-columns:1fr}.axs-discovery-event{display:grid;grid-template-columns:92px 1fr}.axs-discovery-event-image{height:82px}.axs-discovery-event-copy{align-content:center}}`
document.head.appendChild(discoveryStyle)

const observer = new MutationObserver(() => { if (mountDiscoveryCards()) observer.disconnect() })
observer.observe(document.body, { childList: true, subtree: true })
mountDiscoveryCards()
