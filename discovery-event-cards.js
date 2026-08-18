const genreLabels = ['Concerts', 'Sports', 'Arts & Theatre', 'Family', 'Comedy']

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
}

function findLocationAnchor() {
  return [...document.querySelectorAll('input, button, label, h1, h2, h3, p, span')].find((element) => /location|near you|your city/i.test(element.textContent || element.placeholder || ''))
}

function renderCard(events, title = 'Explore Event Genres', mode = 'discover') {
  const cards = events.slice(0, 3).map((event, index) => {
    const image = event.images?.find((item) => item.ratio === '16_9')?.url || event.images?.[0]?.url || ''
    const venue = event._embedded?.venues?.[0]
    const date = event.dates?.start?.localDate || 'Date TBA'
    const time = event.dates?.start?.localTime ? ` · ${event.dates.start.localTime.slice(0, 5)}` : ''
    const location = [venue?.name, venue?.city?.name, venue?.state?.stateCode].filter(Boolean).join(', ') || 'Venue TBA'
    return `<a class="axs-discovery-event pos-${index + 1}" href="${escapeHtml(event.url || '#')}" target="_blank" rel="noopener noreferrer" style="--card-index:${index}"><div class="axs-discovery-event-image" style="${image ? `background-image:url('${escapeHtml(image)}')` : ''}" role="img" aria-label="${escapeHtml(event.name || 'Event')}"></div><div class="axs-discovery-event-copy"><span class="axs-discovery-event-date">${escapeHtml(date)}${escapeHtml(time)}</span><strong>${escapeHtml(event.name || 'Live event')}</strong><span>${escapeHtml(location)}</span></div></a>`
  }).join('')
  const fallback = mode === 'search' ? '<div class="axs-discovery-empty">No events found.</div>' : '<div class="axs-discovery-empty">Live events will appear here when available.</div>'
  return `<section class="axs-discovery-cards ${mode === 'search' ? 'axs-discovery-search-results' : ''}" aria-label="${escapeHtml(title)}"><div class="axs-discovery-cards-heading"><div><p class="axs-discovery-eyebrow">${mode === 'search' ? '' : 'LIVE EVENTS'}</p><h2>${escapeHtml(title)}</h2></div></div><div class="axs-discovery-event-stack">${cards || fallback}</div></section>`
}

function bindCardStack() { const stack = document.querySelector('.axs-discovery-event-stack'); if (!stack || stack.dataset.bound || stack.querySelector('.axs-discovery-empty')) return; stack.dataset.bound = 'true'; let animating = false; stack.addEventListener('click', (event) => { if (animating) return; const active = stack.querySelector('.axs-discovery-event.pos-1'); const second = stack.querySelector('.axs-discovery-event.pos-2'); const third = stack.querySelector('.axs-discovery-event.pos-3'); if (!active || !second || !third || event.target.closest('a') !== active) return; event.preventDefault(); animating = true; active.classList.remove('pos-1'); active.classList.add('swiping-out'); second.classList.remove('pos-2'); second.classList.add('pos-1'); third.classList.remove('pos-3'); third.classList.add('pos-2'); setTimeout(() => { active.classList.remove('swiping-out'); active.classList.add('pos-3'); setTimeout(() => { animating = false }, 100) }, 400) }) }

function isAccountPage() { return [...document.querySelectorAll('h1,h2,h3,nav,button,[role="tab"]')].some((element) => /^(account|profile)$/i.test((element.textContent || '').trim()) || /account/i.test(element.getAttribute('aria-label') || '')) }

function normalizeAccountLayout() { if (!isAccountPage()) return false; document.querySelectorAll('.axs-discovery-cards').forEach((element) => element.remove()); const help = [...document.querySelectorAll('h1,h2,h3')].find((element) => /help\s*&\s*more/i.test(element.textContent || '')); const location = [...document.querySelectorAll('h1,h2,h3,p,span,button')].find((element) => /home location/i.test(element.textContent || '')); const helpGroup = help?.closest('section,article') || help?.parentElement; const locationGroup = location?.closest('section,article') || location?.parentElement; if (helpGroup && locationGroup && locationGroup.parentElement) locationGroup.parentElement.insertBefore(helpGroup, locationGroup.nextSibling); return true }

async function mountDiscoveryCards() {
  if (isAccountPage()) { normalizeAccountLayout(); return false }
  if (document.querySelector('.axs-discovery-search-results')) return false
  if (document.querySelector('.axs-discovery-cards')) return true
  const anchor = findLocationAnchor()
  if (!anchor) return false
  const container = anchor.closest('section, form, main, div') || anchor.parentElement
  if (!container) return false
  const wrapper = document.createElement('div')
  wrapper.innerHTML = renderCard([])
  container.insertAdjacentElement('afterend', wrapper.firstElementChild); bindCardStack()
  try {
    const city = anchor instanceof HTMLInputElement ? anchor.value.trim() : ''
    const response = await fetch(`/api/events?${city ? `city=${encodeURIComponent(city)}&` : ''}size=6`)
    if (response.ok) {
      const payload = await response.json()
      document.querySelector('.axs-discovery-cards')?.replaceWith(document.createRange().createContextualFragment(renderCard(payload?._embedded?.events || [])).firstElementChild); bindCardStack()
    }
  } catch {}
  return true
}

const discoveryStyle = document.createElement('style')
discoveryStyle.textContent = `.axs-discovery-cards{box-sizing:border-box;width:100%;max-width:100%;margin:24px 0 16px;padding:0;background:transparent;color:#fff;overflow:hidden}.axs-discovery-cards-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 18px;padding:0}.axs-discovery-eyebrow{display:none}.axs-discovery-cards h2{margin:0;color:#fff;font-size:clamp(26px,7vw,42px);font-weight:800;line-height:1.1}.axs-discovery-event-stack{position:relative;width:320px;height:420px;max-width:100%;margin:0 auto;cursor:pointer}.axs-discovery-event{position:absolute;inset:0;display:flex;min-width:0;width:100%;height:100%;overflow:hidden;flex-direction:column;border-radius:16px;background:#0d1b3e;color:#fff;text-decoration:none;box-shadow:0 10px 25px rgba(0,0,0,.35);transition:transform .5s cubic-bezier(.25,1,.5,1),opacity .5s ease;user-select:none}.axs-discovery-event-image{width:100%;height:68%;flex:none;background:#000 center/cover no-repeat}.axs-discovery-event-copy{display:flex;min-width:0;height:32%;flex-direction:column;justify-content:center;gap:5px;padding:20px;background:#0b193d}.axs-discovery-event-copy strong,.axs-discovery-event-copy span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.axs-discovery-event-copy strong{font-size:22px;line-height:1.2}.axs-discovery-event-copy span{color:#cbd5e1;font-size:13px}.axs-discovery-event-date{color:#94a3b8!important;font-size:13px!important;font-weight:500}.axs-discovery-event-date::first-letter{color:#fff}.axs-discovery-event.pos-1{z-index:3;transform:translate3d(0,0,0) scale(1);opacity:1}.axs-discovery-event.pos-2{z-index:2;transform:translate3d(18px,12px,0) scale(.96);opacity:.85}.axs-discovery-event.pos-3{z-index:1;transform:translate3d(34px,24px,0) scale(.92);opacity:.6}.axs-discovery-event.swiping-out{z-index:4;transform:translate3d(-120%,0,0) rotate(-10deg) scale(.95);opacity:0;transition:transform .4s ease-in,opacity .4s ease-in}.axs-discovery-empty{padding:24px 0;color:#aab8d5;font-size:16px}.axs-discovery-search-results{margin-top:20px}.axs-discovery-search-results .axs-discovery-event-stack{grid-template-columns:1fr}.axs-discovery-search-results .axs-discovery-event{display:grid;grid-template-columns:112px minmax(0,1fr);background:transparent;border-bottom:1px solid rgba(196,206,226,.25);border-radius:0}.axs-discovery-search-results .axs-discovery-event-image{height:112px;border-radius:14px}.axs-discovery-search-results .axs-discovery-event-copy{padding:12px 8px}.axs-discovery-search-results .axs-discovery-event-copy strong{font-size:18px;white-space:normal}.axs-discovery-search-results .axs-discovery-event-copy span{font-size:13px;white-space:normal}@media(max-width:620px){.axs-discovery-cards{margin:22px 0 12px}.axs-discovery-cards-heading{margin-bottom:16px}.axs-discovery-cards h2{font-size:32px}.axs-discovery-event-stack{display:flex;width:100%;max-width:100%;overflow-x:auto;overscroll-behavior-x:contain;scroll-snap-type:x mandatory;scrollbar-width:none;padding:0 0 4px}.axs-discovery-event-stack::-webkit-scrollbar{display:none}.axs-discovery-event{flex:0 0 min(78vw,300px);scroll-snap-align:start}.axs-discovery-event-image{height:164px}.axs-discovery-event-copy strong{font-size:16px}.axs-discovery-search-results .axs-discovery-event-stack{display:grid;overflow:visible}.axs-discovery-search-results .axs-discovery-event{width:100%;flex:none}}`
document.head.appendChild(discoveryStyle)

const greetingStyle = document.createElement('style')
greetingStyle.textContent = `.axs-compact-greeting{font-size:clamp(14px,3.8vw,19px)!important;line-height:1.2!important}`
document.head.appendChild(greetingStyle)

function sizeDiscoveryGreeting() { const greeting = [...document.querySelectorAll('h1,h2,h3,p,span')].find((element) => /good (morning|afternoon|evening)/i.test(element.textContent || '')); if (greeting) { greeting.classList.add('axs-compact-greeting'); return true } return false }


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

const observer = new MutationObserver(() => { bindSearch(); mountDiscoveryCards(); normalizeAccountLayout(); sizeDiscoveryGreeting() })
observer.observe(document.body, { childList: true, subtree: true })
mountDiscoveryCards()
normalizeAccountLayout()
bindSearch()
sizeDiscoveryGreeting()
