interface CountryFlagProps {
  code: string
  className?: string
}

export function CountryFlag({ code, className = "" }: CountryFlagProps) {
  const codePoints = code
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))

  return (
    <span className={className} role="img" aria-label={`Bandeira ${code}`}>
      {String.fromCodePoint(...codePoints)}
    </span>
  )
}
