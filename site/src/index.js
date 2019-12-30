// Copyright (c) 2019 Eamonn O'Brien-Strain All rights reserved. This
// program and the accompanying materials are made available under the
// terms of the Eclipse Public License v1.0 which accompanies this
// distribution, and is available at
// http://www.eclipse.org/legal/epl-v10.html

import { newCards, readCards, writeCards, images, merge, score } from './common.js'
import { MAX_IMAGE_COUNT_PER_QUERY } from './shared.js'
import { imageSearchUrl } from './searchurl.js'

const LANGUAGE = 'es'
const COUNTRY = 'mx'

/**
 * An ordered list of cards.
 * @type {{
 * head: function(): Card,
 * updateHeadAndSort: function(number),
 * }}
 */
const order = (() => {
  const cards = merge(readCards(), newCards())
  const sort = () => {
    cards.sort((a, b) => score(a) - score(b))
  }
  sort()

  const head = () => cards[0]

  const updateHeadAndSort = (correctness) => {
    const t = Date.now()
    cards[0].responses.push({ t, correctness })
    sort()
    writeCards(cards)
  }

  return { head, updateHeadAndSort }
})()

/**
 * Return element with given ID or throw error if it does not exist.
 * @param {string} id
 * @return {!Element} DOM element with given ID
 */
const getElement = (id) => {
  const element = document.getElementById(id)
  if (!element) {
    throw new Error(`Bad page. No element with id="${id}"`)
  }
  return element
}

const cardEl = getElement('card')
const frontEl = getElement('front')
const backEl = getElement('back')
const correctEl = getElement('correct')
const mehEl = getElement('meh')
const wrongEl = getElement('wrong')

/* global SpeechSynthesisUtterance, gtag */

let revealSay = () => { }
let unflipSay = () => { }

/**
 * Log that user has viewed this screen
 * @param {string} screen
 */
const logScreenView = (screen) => {
  gtag('event', 'screen_view', { screen_name: screen })
}
/**
 * Log that user has viewed these items.
 * @param {string} items
 */
const logViewItem = (items) => {
  gtag('event', 'view_item', { items })
}
/**
 * Log that user has responded with this correctness.
 * @param {number} correctness
 */
const logResponse = (correctness) => {
  gtag('event', 'response', { correctness })
}

/** Present the front of the card to the user. */
const ask = () => {
  const { phrase, reversed } = order.head()
  cardEl.classList.add('offscreen')

  navIconsActive(false)
  const queryText = phrase.split(')').slice(-1)[0].trim()

  let say = () => { }
  if (window.speechSynthesis) {
    const utterance = new SpeechSynthesisUtterance(queryText)
    utterance.lang = `${LANGUAGE}-${COUNTRY}`
    say = () => {
      window.speechSynthesis.speak(utterance)
    }
  }

  /**
   * Remove all current children from a DOM elements.
   * @param {!Element} element
   */
  const removeContent = (element) => {
    element.querySelectorAll('.content').forEach(el => el.remove())
  }

  /**
   * Add the images to one side of the card.
   * @param {!Element} imagesEl
   */
  const addImages = (imagesEl) => {
    let imageCount = 0
    images[phrase].forEach((image) => {
      ++imageCount
      if (imageCount > MAX_IMAGE_COUNT_PER_QUERY) {
        return
      }
      const imgEl = document.createElement('img')
      imgEl.className = 'content'
      imgEl.src = image.src
      imgEl.width = image.width
      imgEl.height = image.height
      imgEl.alt = `image search result ${imageCount}`
      imagesEl.append(imgEl)
    })
  }
  /**
   * Add the phrase to the other side of the card.
   * @param {!Element} textCardEl
   */
  const addPhrase = (textCardEl) => {
    const pEl = document.createElement('a')
    pEl.className = 'content'
    pEl.href = imageSearchUrl(queryText, LANGUAGE, COUNTRY)
    pEl.innerHTML = phrase
    textCardEl.append(pEl)
  }
  removeContent(frontEl)
  removeContent(backEl)
  backEl.className = 'unflipped'
  backEl.onclick = unflip
  frontEl.className = 'unflipped'
  frontEl.onclick = cardReveal
  if (reversed) {
    addImages(frontEl)
    frontEl.classList.add('images')
    addPhrase(backEl)
    backEl.classList.add('word')
    revealSay = say
    unflipSay = () => { }
    logScreenView('ask-image')
    logViewItem(`${phrase} [ask-image]`)
  } else {
    addPhrase(frontEl)
    frontEl.classList.add('word')
    addImages(backEl)
    backEl.classList.add('images')
    revealSay = () => { }
    unflipSay = say
    logScreenView('ask-text')
    logViewItem(`${phrase} [ask-text]`)
  }
}

/** Set the CSS classes that will trigger an animation to flip the card to show the answer side. */
const flip = () => {
  backEl.classList.add('flipped')
  frontEl.classList.add('flipped')
  backEl.classList.remove('unflipped')
  frontEl.classList.remove('unflipped')
  cardEl.classList.remove('offscreen')
  logScreenView('reveal')
}

/** Set the CSS classes that will trigger an animation to unflip the card to show the question side. */
const unflip = () => {
  unflipSay()
  backEl.classList.add('unflipped')
  frontEl.classList.add('unflipped')
  backEl.classList.remove('flipped')
  frontEl.classList.remove('flipped')
  logScreenView('unflip')
}

/** Reveal the answer. */
const cardReveal = () => {
  revealSay()
  flip()
  navIconsActive(true)
}

/**
 * Generate a function that updates the card deck with the user response.
 * @param {number} correctness
 * @return {function()}
 */
const answerFn = (correctness) => () => {
  logResponse(correctness)
  cardEl.classList.add('offscreen')
  order.updateHeadAndSort(correctness)
  flip()
  ask()
}

/** @type {function()} */
const correct = answerFn(1.0)

/** @type {function()} */
const meh = answerFn(0.5)

/** @type {function()} */
const wrong = answerFn(0.1)

/**
 * Change element to be active or not.
 * @param {!Element} el
 * @param {boolean} active
 * @param {function()} onclick applied if active
 */
const activeIf = (el, active, onclick) => {
  if (active) {
    el.classList.add('active')
    el.onclick = onclick
  } else {
    el.classList.remove('active')
    el.onclick = null
  }
}

/**
 * Update active (or not) status of the controls.
 * @param {boolean} answersActive
 */
const navIconsActive = (answersActive) => {
  activeIf(correctEl, answersActive, correct)
  activeIf(mehEl, answersActive, meh)
  activeIf(wrongEl, answersActive, wrong)
}

// Should be same as animation-duration in .offscreen CSS
const OFFSCREEN_TIME_MS = 2000

document.body.onload = () => {
  ask()

  // Hack to prevent animation on forst card shown.
  // TODO(eob) see if this can be dine in pure CSS without JS
  setTimeout(() => {
    cardEl.classList.remove('initial')
  }, OFFSCREEN_TIME_MS)
}
