import { merge, newCards } from '../src/js/card.js'
import { IndexedWords } from '../src/js/word.js'

/* global performance */

const noImages = [
  { foo: 'one', bar: 111 },
  { foo: 'two', bar: 222 },
  { foo: 'three', bar: 333 },
  { foo: 'four', bar: 444 },
  { foo: 'five', bar: 555 }
]

const Stats = () => {
  let n = 0
  let sum = 0
  let sumSq = 0

  const put = x => {
    ++n
    sum += x
    sumSq += x * x
  }

  const toString = () =>
    `mean=${sum / n} stdev=${Math.sqrt(sumSq / (n - 1))}`

  return { put, toString }
}

/**
 * Shuffles array in place. (From https://stackoverflow.com/a/6274381/978525)
 * @param {Array} a items An array containing the items.
 * @return {void}
 */
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const x = a[i]
    a[i] = a[j]
    a[j] = x
  }
}

export default test => {
  test('merge: empty', t => {
    const words = new IndexedWords('xx', 'yy', [])
    t.truthy(words)

    const actual = merge(words, [], [])

    t.deepEqual([], actual)
  })

  test('merge: no images', t => {
    const words = new IndexedWords('xx', 'yy', [])
    t.truthy(words)

    const left = merge(words, noImages, [])
    const right = merge(words, [], noImages)
    const both = merge(words, noImages, noImages)

    t.deepEqual([], left)
    t.deepEqual([], right)
    t.deepEqual([], both)
  })

  test('merge: one', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'foo', lang: 'xx', country: 'yy', images: [{}] }
    ])

    const actual = merge(words, [
      { phrase: 'foo' }
    ], [])

    const expected = [
      { phrase: 'foo' }
    ]
    t.is(actual.length, 1)
    t.deepEqual(actual, expected)
  })

  test('merge: multiple cards', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'foo', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'bar', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'baz', lang: 'xx', country: 'yy', images: [{}] }
    ])

    const actual = merge(words, [
      { phrase: 'foo' },
      { phrase: 'bar' }
    ], [
      { phrase: 'baz' }
    ])

    t.is(actual.length, 3)
  })

  test('merge: duplicates', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'foo', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'bar', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'baz', lang: 'xx', country: 'yy', images: [{}] }
    ])

    const actual = merge(words, [
      { phrase: 'foo' },
      { phrase: 'baz' },
      { phrase: 'bar' },
      { phrase: 'foo' },
      { phrase: 'foo' },
      { phrase: 'foo' },
      { phrase: 'foo' }
    ], [
      { phrase: 'foo' },
      { phrase: 'baz' },
      { phrase: 'foo' }
    ])

    t.is(actual.length, 3)
  })

  test('merge: filtering of images', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'has image', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'also has image', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'no image', lang: 'xx', country: 'yy' },
      { query: 'also no image', lang: 'xx', country: 'yy' }
    ])

    const actual = merge(words, [
      { phrase: 'has image' },
      { phrase: 'no image' }
    ], [
      { phrase: 'also has image' },
      { phrase: 'also no image' }
    ])

    const expected = [
      { phrase: 'has image' },
      { phrase: 'also has image' }
    ]
    t.deepEqual(actual, expected)
  })

  test('merge: filtering of non existing', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'has image', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'also has image', lang: 'xx', country: 'yy', images: [{}] }
    ])

    const actual = merge(words, [
      { phrase: 'has image' },
      { phrase: 'does not exist' }
    ], [
      { phrase: 'also has image' },
      { phrase: 'also does not exist' }
    ])

    const expected = [
      { phrase: 'has image' },
      { phrase: 'also has image' }
    ]
    t.deepEqual(actual, expected)
  })

  test('merge: filtering by locale', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'right locale', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'wrong country', lang: 'xx', country: 'AA', images: [{}] },
      { query: 'wrong language', lang: 'BB', country: 'yy' },
      { query: 'all wrong', lang: 'CC', country: 'DD' }
    ])

    const actual = merge(words, [
      { phrase: 'right locale' },
      { phrase: 'wrong country' }
    ], [
      { phrase: 'wrong language' },
      { phrase: 'all wrong' }
    ])

    const expected = [
      { phrase: 'right locale' }
    ]
    t.deepEqual(actual, expected)
  })

  const makeArray = n => x => [...Array(n)].map((_, i) => x(i))
  const makeBigArray = makeArray(900)

  test('merge: many', t => {
    const lang = 'xx'
    const country = 'yy'
    const images = [{}]
    const words = new IndexedWords(lang, country, makeBigArray(i => {
      const query = `q${i}`
      return { query, lang, country, images }
    }))

    const actual = merge(words, [], makeBigArray(i => {
      const phrase = `q${i}`
      return { phrase }
    }))

    t.is(actual.length, 900)
  })
  const lang = 'xx'
  const country = 'yy'
  const images = [{}]
  const goodData = makeBigArray(i => {
    const query = `q${i}`
    return { query, lang, country, images }
  })
  const wrongLanguage = makeBigArray(i => {
    const query = `A${i}`
    return { query, lang: 'AA', country, images }
  })
  const noImagesBig = makeBigArray(i => {
    const query = `n${i}`
    return { query, lang, country }
  })
  const data = [...wrongLanguage, ...goodData, ...noImagesBig]
  shuffle(data)

  const words = new IndexedWords(lang, country, data)

  test('merge: everything', t => {
    const cards = makeBigArray(i => {
      const phrase = `q${i}`
      return { phrase }
    })
    const start = performance.now()

    const actual = merge(words, [], cards)

    const end = performance.now()
    console.log(`merge took ${end - start} ms`)

    t.is(actual.length, 900)
  })

  test('merge: everything multiple', t => {
    const stats = Stats()
    const cards = makeBigArray(i => {
      const phrase = `q${i}`
      return { phrase }
    })
    for (let i = 0; i < 100; ++i) {
      const start = performance.now()

      const actual = merge(words, [], cards)

      const end = performance.now()
      stats.put(end - start)

      t.is(actual.length, 900)
    }
    console.log(`merge stats (ms): ${stats.toString()}`)
  })

  test('newCards: a few', t => {
    const words = new IndexedWords('xx', 'yy', [
      { query: 'foo', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'bar', lang: 'xx', country: 'yy', images: [{}] },
      { query: 'baz', lang: 'xx', country: 'yy', images: [{}] }
    ])

    const cards = newCards(words)

    t.is(cards.length, 6)
    const expected = [
      { phrase: 'foo', reversed: false, responses: [] },
      { phrase: 'bar', reversed: false, responses: [] },
      { phrase: 'baz', reversed: false, responses: [] },
      { phrase: 'foo', reversed: true, responses: [] },
      { phrase: 'bar', reversed: true, responses: [] },
      { phrase: 'baz', reversed: true, responses: [] }
    ]
    t.deepEqual(cards, expected)
  })

  const words1000 = new IndexedWords('xx', 'yy', makeArray(1000)(i => {
    const query = `q${i}`
    return { query, lang, country, images }
  }))

  test('newCards: many', t => {
    const start = performance.now()

    const cards = newCards(words1000)

    const end = performance.now()
    console.log(`newCards took ${end - start} ms`)
    t.is(cards.length, 2000)
  })

  test('newCards: many multiple', t => {
    const stats = Stats()
    for (let i = 0; i < 1000; ++i) {
      const start = performance.now()

      const cards = newCards(words1000)

      const end = performance.now()
      stats.put(end - start)

      t.is(cards.length, 2000)
    }
    console.log(`newCards stats (ms): ${stats.toString()}`)
  })
}