const htmlparser2 = require('htmlparser2')
const fetch = require('node-fetch')

const QUERIES_PER_MINUTE = 20.0

// Returns promise of list of { width, height, src } objects
const search = (query, language, country, ofTotalQueries) => {
  const images = []
  const q = `q=${encodeURI(query)}`
  const cr = `cr=country${country.toUpperCase()}`
  const hl = `hl=${language}`
  const url = `https://www.google.com/search?${q}&${hl}&${cr}&tbm=isch`
  const parser = new htmlparser2.Parser(
    {
      onopentag (name, attribs) {
        if (name === 'img') {
          const width = Number(attribs.width)
          const height = Number(attribs.height)
          const src = attribs.src
          images.push({ width, height, src })
        }
      }
    }
  )
  const spreadOverMinutes = ofTotalQueries / QUERIES_PER_MINUTE
  return new Promise((resolve) => {
    setTimeout(() => {
      fetch(url).then((response) => response.text()).then((data) => {
        parser.write(data)
        parser.end()
        resolve(images)
      })
    }, spreadOverMinutes * 60000.0 * Math.random())
  })
}

module.exports = { search }