const genreLabels = ['Concerts', 'Sports', 'Arts & Theatre', 'Family', 'Comedy']

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function findLocationAnchor() {
  return [...document.querySelectorAll('input, button, label, h1, h2, h3, p, span')].find((element) => /location|near you|your city/i.test(element.textContent || element.placeholder || ''))
}

function renderCard(events, title = 'Explore Event Genres', mode = 'discover') {
  const cards = events.slice(0, 6).map((event, index) => {
    const image = event.images?.find((item) => item.ratio === '16_9')?.url || event.images?.[0]?.url || ''
    const venue = event._embedded?.venues?.[0]
    const date = event.dates?.start?.localDate || 'Date TBA'
    const time = event.dates?.start?.localTime ? ` · ${event.dates.start.localTime.slice(0, 5)}` : ''
    const location = [venue?.name, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', ') || 'Venue TBA'
    return `<a class="axs-discovery-event" href="${escapeHtml(event.url || '#')}" target="_blank" rel="noopener noreferrer" style="--card-index:${index}"><div class="axs-discovery-event-image" style="${image ? `background-image:url('${escapeHtml(image)}')` : ''}" role="img" aria-label="${escapeHtml(event.name || 'Event')}"></div><div class="axs-discovery-event-copy"><span class="axs-discovery-event-date">${escapeHtml(date)}${escapeHtml(time)}</span><strong>${escapeHtml(event.name || 'Live event')}</strong><span>${escapeHtml(location)}</span></div></a>`
  }).join('')
  const fallback = '<div class="axs-discovery-empty">Live events will appear here when available.</div>'
  return `<section class="axs-discovery-cards ${mode === 'search' ? 'axs-discovery-search-results' : ''}" aria-label="${escapeHtml(title)}"><div class="axs-discovery-cards-heading"><div><p class="axs-discovery-eyebrow">${mode === 'search' ? 'SEARCH RESULTS' : 'DISCOVER'}</p><h2>${escapeHtml(title)}</h2></div>${mode === 'discover' ? `<div class="axs-discovery-genres">${genreLabels.map((label) => `<span>${label}</span>`).join('')}</div>` : ''}</div><div class="axs-discovery-event-stack">${cards || fallback}</div></section>`
}

async function mountDiscoveryCards() {
  if (document.querySelector('.axs-discovery-cards')) return true
  const anchor = findLocationAnchor()
  if (!anchor) return false
  const container = anchor.closest('section, form, main, div') || anchor.parentElement
  if (!container) return false
  const wrapper = document.createElement('div')
  wrapper.innerHTML = renderCard([])
  container.insertAdjacentElement('afterend', wrapper.firstElementChild)
  try {
    const city = anchor instanceof HTMLInputElement ? anchor.value.trim() : ''
    const response = await fetch(`/api/events?${city ? `city=${encodeURIComponent(city)}&` : ''}size=6`)
    if (response.ok) {
      const payload = await response.json()
      document.querySelector('.axs-discovery-cards')?.replaceWith(document.createRange().createContextualFragment(renderCard(payload?._embedded?.events || [])).firstElementChild)
    }
  } catch {}
  return true
}

const discoveryStyle = document.createElement('style')
discoveryStyle.textContent = `.axs-discovery-cards{box-sizing:border-box;width:100%;max-width:100%;margin:24px 0 16px;padding:0;background:transparent;color:#fff;overflow:hidden}.axs-discovery-cards-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 18px;padding:0}.axs-discovery-eyebrow{display:none}.axs-discovery-cards h2{margin:0;color:#fff;font-size:clamp(26px,7vw,42px);font-weight:800;line-height:1.1}.axs-discovery-genres{display:none}.axs-discovery-event-stack{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;width:100%;max-width:100%}.axs-discovery-event{display:flex;min-width:0;width:100%;overflow:hidden;flex-direction:column;border-radius:18px;background:#18285f;color:#fff;text-decoration:none;box-shadow:none}.axs-discovery-event-image{width:100%;height:148px;flex:none;background:#273a7a center/cover no-repeat}.axs-discovery-event-copy{display:grid;min-width:0;gap:5px;padding:12px}.axs-discovery-event-copy strong,.axs-discovery-event-copy span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-event-copy strong{font-size:14px;line-height:1.2}.axs-discovery-event-copy span{color:#bac7e1;font-size:11px}.axs-discovery-event-date{color:#d7e0f4!important;font-weight:800}.axs-discovery-empty{padding:24px 0;color:#aab8d5;font-size:16px}.axs-discovery-search-results{margin-top:20px}.axs-discovery-search-results .axs-discovery-event-stack{grid-template-columns:1fr}.axs-discovery-search-results .axs-discovery-event{display:grid;grid-template-columns:112px minmax(0,1fr);background:transparent;border-bottom:1px solid rgba(196,206,226,.25);border-radius:0}.axs-discovery-search-results .axs-discovery-event-image{height:112px;border-radius:14px}.axs-discovery-search-results .axs-discovery-event-copy{padding:12px 8px}.axs-discovery-search-results .axs-discovery-event-copy strong{font-size:18px;white-space:normal}.axs-discovery-search-results .axs-discovery-event-copy span{font-size:13px;white-space:normal}@media(max-width:620px){.axs-discovery-cards{margin:22px 0 12px}.axs-discovery-cards-heading{margin-bottom:16px}.axs-discovery-cards h2{font-size:32px}.axs-discovery-event-stack{display:flex;width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 0 4px}.axs-discovery-event-stack::-webkit-scrollbar{display:none}.axs-discovery-event{flex:0 0 min(78vw,300px);scroll-snap-align:start}.axs-discovery-event-image{height:164px}.axs-discovery-event-copy strong{font-size:16px}.axs-discovery-search-results .axs-discovery-event-stack{display:grid;overflow:visible}.axs-discovery-search-results .axs-discovery-event{width:100%;flex:none}}`
document.head.appendChild(discoveryStyle)

async function searchEvents(keyword) {
  const section = document.querySelector('.axs-discovery-cards')
  if (!section || !keyword.trim()) return
  section.outerHTML = renderCard([], `Results for “${keyword.trim()}”`, 'search')
  try {
    const response = await fetch(`/api/events?keyword=${encodeURIComponent(keyword.trim())}&size=20`)
    const payload = response.ok ? await response.json() : {}
    document.querySelector('.axs-discovery-search-results')?.replaceWith(document.createRange().createContextualFragment(renderCard(payload?._embedded?.events || [], `Results for “${keyword.trim()}”`, 'search')).firstElementChild)
  } catch {}
}

function bindSearch() {
  const input = [...document.querySelectorAll('input')].find((element) => /search.*event|event.*performer|venue/i.test(`${element.placeholder} ${element.getAttribute('aria-label') || ''}`))
  if (!input || input.dataset.axsSearchBound) return
  input.dataset.axsSearchBound = 'true'
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' && !event.isComposing && event.keyCode !== 229) {
      event.preventDefault()
      searchEvents(input.value)
    }
  })
}

const observer = new MutationObserver(() => { bindSearch(); mountDiscoveryCards() })
observer.observe(document.body, { childList: true, subtree: true })
mountDiscoveryCards()
bindSearch()
