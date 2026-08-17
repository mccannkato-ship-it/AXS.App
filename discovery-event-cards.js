const genreLabels = ['Concerts', 'Sports', 'Arts & Theatre', 'Family', 'Comedy']

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function findLocationAnchor() {
  const elements = [...document.querySelectorAll('input, button, label, h1, h2, h3, p, span')]
  return elements.find((element) => /location|near you|your city/i.test(element.textContent || element.placeholder || ''))
}

function renderCard(events, title = 'Explore Event Genres', mode = 'discover') {
  const cards = events.slice(0, 3).map((event, index) => {
    const image = event.images?.find((item) => item.ratio === '16_9')?.url || event.images?.[0]?.url || ''
    const venue = event._embedded?.venues?.[0]?.name || 'Venue TBA'
    const date = event.dates?.start?.localDate || 'Date TBA'
    const time = event.dates?.start?.localTime ? ` · ${event.dates.start.localTime.slice(0, 5)}` : ''
    const location = [venue, event._embedded?.venues?.[0]?.city?.name, event._embedded?.venues?.[0]?.state?.stateCode].filter(Boolean).join(', ')
    return `<a class="axs-discovery-event" href="${escapeHtml(event.url || '#')}" target="_blank" rel="noopener noreferrer" style="--card-index:${index}"><div class="axs-discovery-event-image" style="${image ? `background-image:url('${escapeHtml(image)}')` : ''}" role="img" aria-label="${escapeHtml(event.name || 'Event')}" ></div><div class="axs-discovery-event-copy"><span class="axs-discovery-event-date">${escapeHtml(date)}${escapeHtml(time)}</span><strong>${escapeHtml(event.name || 'Live event')}</strong><span>${escapeHtml(location || 'Venue TBA')}</span></div></a>`
  }).join('')
  const fallback = '<div class="axs-discovery-empty">Live events will appear here when available.</div>'
  return `<section class="axs-discovery-cards ${mode === 'search' ? 'axs-discovery-search-results' : ''}" aria-label="${escapeHtml(title)}"><div class="axs-discovery-cards-heading"><div><p class="axs-discovery-eyebrow">${mode === 'search' ? 'SEARCH RESULTS' : 'DISCOVER'}</p><h2>${escapeHtml(title)}</h2></div>${mode === 'discover' ? `<div class="axs-discovery-genres">${genreLabels.map((label) => `<span>${label}</span>`).join('')}</div>` : ''}</div><div class="axs-discovery-event-stack">${cards || fallback}</div></section>`
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
discoveryStyle.textContent = `.axs-discovery-cards{margin:28px 0 8px;padding:18px;border:1px solid rgba(106,142,210,.24);border-radius:22px;background:#f7faff;color:#10214a;overflow:hidden}.axs-discovery-cards-heading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:14px}.axs-discovery-eyebrow{margin:0 0 5px;color:#6b8dca;font-size:10px;font-weight:800;letter-spacing:.15em}.axs-discovery-cards h2{margin:0;color:#2f6fcb;font-size:20px;line-height:1.15}.axs-discovery-genres{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:6px}.axs-discovery-genres span{padding:5px 8px;border-radius:999px;background:#e8f0ff;color:#3f76c4;font-size:10px;font-weight:700}.axs-discovery-event-stack{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.axs-discovery-event{display:flex;min-width:0;flex-direction:column;overflow:hidden;border-radius:14px;background:#fff;color:#10214a;text-decoration:none;box-shadow:0 5px 16px rgba(36,78,140,.1)}.axs-discovery-event-image{height:92px;background:#dfe9f7 center/cover no-repeat}.axs-discovery-event-copy{display:grid;gap:4px;padding:10px}.axs-discovery-event-copy strong{overflow:hidden;font-size:12px;line-height:1.25;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-event-copy span{overflow:hidden;color:#6e7f9e;font-size:10px;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-event-date{color:#536f9e!important;font-size:10px!important;font-weight:800}.axs-discovery-search-results{background:#0d1a52;color:#d7e0f4;border-color:#c4cee2}.axs-discovery-search-results h2{color:#fff}.axs-discovery-search-results .axs-discovery-event{background:#13235f;color:#fff}.axs-discovery-search-results .axs-discovery-event-copy span{color:#b9c7e2}.axs-discovery-search-results .axs-discovery-event-image{height:128px}@media(max-width:620px){.axs-discovery-search-results{margin-inline:0;border:0;border-radius:0;background:#0d1a52}.axs-discovery-search-results .axs-discovery-event{grid-template-columns:112px 1fr;background:transparent;border-bottom:1px solid rgba(196,206,226,.25);border-radius:0;box-shadow:none}.axs-discovery-search-results .axs-discovery-event-image{height:112px;border-radius:14px}.axs-discovery-search-results .axs-discovery-event-copy{padding:12px 8px}.axs-discovery-search-results .axs-discovery-event-copy strong{font-size:18px;line-height:1.2;white-space:normal}.axs-discovery-search-results .axs-discovery-event-copy span{font-size:13px;white-space:normal}}.axs-discovery-empty{padding:22px;text-align:center;color:#6e7f9e;font-size:12px}@media(max-width:620px){.axs-discovery-cards{margin-top:24px;padding:14px}.axs-discovery-cards-heading{display:grid}.axs-discovery-genres{justify-content:flex-start}.axs-discovery-event-stack{grid-template-columns:1fr}.axs-discovery-event{display:grid;grid-template-columns:92px 1fr}.axs-discovery-event-image{height:82px}.axs-discovery-event-copy{align-content:center}}`
document.head.appendChild(discoveryStyle)

async function searchEvents(keyword) { const section = document.querySelector('.axs-discovery-cards'); if (!section || !keyword.trim()) return; section.outerHTML = renderCard([], `Results for “${keyword.trim()}”`, 'search'); try { const response = await fetch(`/api/events?keyword=${encodeURIComponent(keyword.trim())}&size=20`); const payload = response.ok ? await response.json() : {}; const events = payload?._embedded?.events || []; const resultSection = document.querySelector('.axs-discovery-search-results'); if (resultSection) resultSection.outerHTML = renderCard(events, `Results for “${keyword.trim()}”`, 'search') } catch { const resultSection = document.querySelector('.axs-discovery-search-results'); if (resultSection) resultSection.outerHTML = renderCard([], `Results for “${keyword.trim()}”`, 'search') } }
function bindRecentEvents() { document.querySelectorAll('.axs-discovery-event').forEach((link) => { if (link.dataset.recentBound) return; link.dataset.recentBound = 'true'; link.addEventListener('click', () => { const recent = JSON.parse(sessionStorage.getItem('axs_recent_events') || '[]'); const item = { name: link.querySelector('strong')?.textContent || 'Event', meta: link.querySelector('span:last-child')?.textContent || '', image: link.querySelector('.axs-discovery-event-image')?.style.backgroundImage || '' }; sessionStorage.setItem('axs_recent_events', JSON.stringify([item, ...recent.filter((entry) => entry.name !== item.name)].slice(0, 5))) }) }) }
function bindSearch() { const input = [...document.querySelectorAll('input')].find((element) => /search.*event|event.*performer|venue/i.test(`${element.placeholder} ${element.getAttribute('aria-label') || ''}`)); if (!input || input.dataset.axsSearchBound) return; input.dataset.axsSearchBound = 'true'; input.addEventListener('keydown', (event) => { if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); searchEvents(input.value) } }) }
const observer = new MutationObserver(() => { bindSearch(); bindRecentEvents(); if (mountDiscoveryCards()) observer.disconnect() })
observer.observe(document.body, { childList: true, subtree: true })
mountDiscoveryCards(); bindSearch(); bindRecentEvents()
