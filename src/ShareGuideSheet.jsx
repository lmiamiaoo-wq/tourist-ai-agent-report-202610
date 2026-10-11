import { useEffect, useRef, useState } from 'react'
import { LinkIcon, DownloadSimpleIcon, WechatLogoIcon, XIcon } from '@phosphor-icons/react'
import QRCode from 'qrcode'
import { toPng } from 'html-to-image'
import './share-guide.css'

export default function ShareGuideSheet({ guide, onClose }) {
  const sheet = useRef(null), poster = useRef(null)
  const [qr, setQr] = useState(''), [showLink, setShowLink] = useState(false), [status, setStatus] = useState(''), [busy, setBusy] = useState(false)
  const url = new URL(location.pathname, location.origin)
  url.searchParams.set('guide', guide.name)
  url.searchParams.set('view', 'chat')
  const link = url.href
  useEffect(() => {
    let alive = true
    QRCode.toDataURL(link, { width: 240, margin: 1, errorCorrectionLevel: 'M' }).then(value => { if (alive) setQr(value) }).catch(() => setStatus('二维码生成失败，请重试'))
    const previous = document.activeElement
    sheet.current?.focus()
    return () => { alive = false; previous?.focus() }
  }, [link])
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); setStatus('链接已复制') }
    catch { setStatus('请长按下方链接复制'); setShowLink(true) }
  }
  const save = async () => {
    setBusy(true)
    try {
      await document.fonts.ready
      const data = await toPng(poster.current, { pixelRatio: 3, cacheBust: false })
      const anchor = document.createElement('a'); anchor.download = `${guide.name}的名片.png`; anchor.href = data; anchor.click()
      setStatus('名片图片已生成，请查看下载')
    } catch { setStatus('图片保存失败，请重试') }
    finally { setBusy(false) }
  }
  const share = async () => {
    if (!navigator.share) { setStatus('请复制链接或保存图片，再发送给微信好友'); return }
    try { await navigator.share({ title: `与${guide.name}对话`, text: '贵旅出行·文旅推荐官', url: link }) }
    catch (error) { if (error.name !== 'AbortError') setStatus('请复制链接或保存图片，再发送给微信好友') }
  }
  const trap = event => {
    if (event.key === 'Escape') onClose()
    if (event.key !== 'Tab') return
    const buttons = [...sheet.current.querySelectorAll('button:not(:disabled), a[href]')]
    const first = buttons[0], last = buttons.at(-1)
    if (event.shiftKey && (document.activeElement === first || document.activeElement === sheet.current)) { event.preventDefault(); last.focus() }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
  }
  return <div className="guide-share-overlay" onClick={onClose}>
    <section className="guide-share-sheet" role="dialog" aria-modal="true" aria-labelledby="guide-share-title" ref={sheet} tabIndex={-1} onKeyDown={trap} onClick={e => e.stopPropagation()}>
      <header><h2 id="guide-share-title">分享</h2><button onClick={onClose} aria-label="关闭分享"><XIcon /></button></header>
      <div className="guide-share-poster" ref={poster}>
        <img className="share-cover" src={guide.name === '罗文静' ? '/assets/profile-terraces.jpg' : '/assets/profile-waterfall.jpg'} alt="个人主页背景" />
        <div className="share-person"><img src={guide.image} alt={guide.name} /><h3>{guide.name}</h3><p>贵旅出行·文旅推荐官</p><div className="share-tags driver-info-tags">{guide.tags.map(tag => <span key={tag.label} data-kind={tag.kind}>{tag.label}</span>)}</div><p className="share-description">跑遍黔山秀水，为你精选地道景点和美食</p></div>
        <footer><div><strong>{guide.name}</strong><span>扫码跟{guide.name}对话</span></div>{qr && <img src={qr} alt="司导对话二维码" />}</footer>
      </div>
      {showLink && <div className="share-link-fallback"><a href={link}>{link}</a></div>}
      <p className="share-status" role="status">{status}</p>
      <div className="guide-share-actions">
        <button onClick={copy}><span><LinkIcon /></span>复制链接</button>
        <button onClick={save} disabled={busy || !qr}><span><DownloadSimpleIcon /></span>{busy ? '正在保存' : '保存图片'}</button>
        <button onClick={share}><span className="wechat"><WechatLogoIcon weight="fill" /></span>微信好友</button>
      </div>
    </section>
  </div>
}
