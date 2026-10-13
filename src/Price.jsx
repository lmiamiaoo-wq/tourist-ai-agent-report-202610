/** Keeps each price's existing numeric typography; only its surrounding text is reduced. */
export default function Price({ value, prefix = '￥', suffix = '', auxiliaryWeight = 400, suffixSize }) {
  const amount = String(value ?? '').replace(/[,，]/g, '')
  const style = { fontSize: 'calc(1em - var(--price-affix-reduction, 8px))', fontWeight: auxiliaryWeight, color: 'inherit', display: 'inline', lineHeight: 'inherit' }
  return <>{prefix && <small className="price-affix" style={style}>{prefix}</small>}{amount}{suffix && <small className="price-affix" style={{ ...style, ...(suffixSize ? { fontSize: suffixSize } : {}) }}>{suffix}</small>}</>
}
