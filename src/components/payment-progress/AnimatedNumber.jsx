import { useState } from 'react'

function AnimatedDigit({ value }) {
  const [digits, setDigits] = useState({ current: value, previous: null })
  if (digits.current !== value) {
    setDigits({ current: value, previous: digits.current })
  }

  return <span className="pp-rolling-digit">
    <span className={digits.previous === null ? 'pp-digit-pair' : 'pp-digit-pair pp-digit-changing'} key={digits.current}>
      {digits.previous !== null && <span className="pp-digit-old">{digits.previous}</span>}
      <span className="pp-digit-new">{digits.current}</span>
    </span>
  </span>
}

export function AnimatedNumber({ value }) {
  const text = String(value)
  return <span className="pp-animated-number">
    <span className="pp-number-accessible">{text}</span>
    <span className="pp-number-visual" aria-hidden="true">
      {[...text].map((character, index) => /\d/.test(character)
        ? <AnimatedDigit key={text.length - index} value={character} />
        : <span key={text.length - index}>{character}</span>)}
    </span>
  </span>
}
