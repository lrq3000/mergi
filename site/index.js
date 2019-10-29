/* global mergiWords, localStorage */

const lang = 'es'
const country = 'mx'

const queries = [] // the phrases
const images = {} // list of images for each phrase
mergiWords.forEach((word) => {
  if (word.lang === lang && word.country === country) {
    queries.push(word.query)
    images[word.query] = word.images
  }
})

const merge = (existing, added) => {
  const key = (card) => `${card.query}|${card.reversed}`
  const result = []
  const included = {}
  const hasImages = (card) => !!images[card.query]
  if (existing) {
    existing.filter(hasImages).forEach((card) => {
      result.push(card)
      included[key(card)] = true
    })
  }
  if (added) {
    added.filter(hasImages).forEach((card) => {
      const k = key(card)
      if (!included[k]) {
        result.push(card)
        included[k] = true
      }
    })
  }
  return result
}

const TAO = 1000.0 * 60 * 60 * 24

const score = (responses) => {
  if (responses.length === 0) {
    return -1
  }
  const now = Date.now()
  const weightedSum = responses
    .map((response) => response.correctness * Math.exp((response.t - now) / TAO))
    .reduce((sum, x) => sum + x)
  return weightedSum / responses.length
}

const order = (() => {
  // Return ordered list of cards
  const newOrder = () => {
    const cards = []
    for (let i = 0; i < 2; ++i) {
      const reversed = (i === 1)
      queries.forEach((query) => {
        const responses = []
        cards.push({ query, reversed, responses })
      })
    }
    return cards
  }

  const sort = () => {
    order.sort((a, b) => score(a.responses) - score(b.responses))
  }

  const head = () => order[0]

  const update = (correctness) => {
    const t = Date.now()
    order[0].responses.push({ t, correctness })
    sort()
    localStorage.setItem(KEY, JSON.stringify(order))
  }

  const KEY = 'mergi-order-v3'
  const order = merge(JSON.parse(localStorage.getItem(KEY)), newOrder())
  sort()

  return { head, update }
})()

const wordEl = document.getElementById('word')
const imagesEl = document.getElementById('images')
const correctEl = document.getElementById('correct')
const mehEl = document.getElementById('meh')
const wrongEl = document.getElementById('wrong')

const ask = () => {
  const { query, reversed } = order.head()

  correctEl.style.display = 'none'
  mehEl.style.display = 'none'
  wrongEl.style.display = 'none'
  if (reversed) {
    wordEl.classList.add('back')
    imagesEl.classList.add('front')
  } else {
    wordEl.classList.add('front')
    imagesEl.classList.add('back')
  }
  wordEl.innerHTML = query
  while (imagesEl.firstChild) {
    imagesEl.removeChild(imagesEl.firstChild)
  }
  images[query].forEach((image) => {
    const imgEl = document.createElement('img')
    imgEl.src = image.src
    imgEl.width = image.width
    imgEl.height = image.height
    imagesEl.append(imgEl)
  })
}

imagesEl.onclick = () => {
  wordEl.classList.remove('back')
  correctEl.style.display = 'inline'
  mehEl.style.display = 'inline'
  wrongEl.style.display = 'inline'
}

wordEl.onclick = () => {
  imagesEl.classList.remove('back')
  correctEl.style.display = 'inline'
  mehEl.style.display = 'inline'
  wrongEl.style.display = 'inline'
}

correctEl.onclick = () => {
  order.update(1.0)
  ask()
}
mehEl.onclick = () => {
  order.update(0.5)
  ask()
}
wrongEl.onclick = () => {
  order.update(0.0)
  ask()
}

document.body.onload = ask