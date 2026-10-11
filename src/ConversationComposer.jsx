import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { PlusIcon, MicrophoneIcon, KeyboardIcon, ArrowUpIcon } from '@phosphor-icons/react'

export default function ConversationComposer({ input, setInput, onSend, guideName, suspended = false, disabled = false, onInputFocus, composerRef: externalRef }) {
  const localRef = useRef(null)
  const composerRef = externalRef || localRef
  const [voiceMode, setVoiceMode] = useState(false)
  const [listening, setListening] = useState(false)
  const [composerNotice, setComposerNotice] = useState('')
  const uploadRef = useRef(null)
  const speechRef = useRef(null)
  useEffect(() => () => speechRef.current?.abort(), [])
  useEffect(() => { if (suspended) speechRef.current?.abort() }, [suspended])
  const startVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) { setComposerNotice('当前浏览器不支持语音输入，请切换键盘输入'); return }
    const speech = new SpeechRecognition()
    speechRef.current = speech
    speech.lang = 'zh-CN'
    speech.onstart = () => { setListening(true); setComposerNotice('') }
    speech.onresult = event => { setInput(event.results[0][0].transcript); setVoiceMode(false) }
    speech.onerror = event => setComposerNotice(event.error === 'not-allowed' ? '请允许麦克风权限后重试' : '未识别到语音，请重试')
    speech.onend = () => setListening(false)
    speech.start()
  }
  const [multilineInput, setMultilineInput] = useState(false)
  useLayoutEffect(() => {
    const textarea = composerRef.current?.querySelector('textarea')
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      const style = window.getComputedStyle(textarea)
      const lineHeight = Number.parseFloat(style.lineHeight)
      const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom)
      const contentHeight = textarea.scrollHeight
      textarea.style.height = `${Math.min(contentHeight, lineHeight * 3 + padding)}px`
      setMultilineInput(contentHeight > lineHeight + padding + 1)
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [input, voiceMode, composerRef])
  useLayoutEffect(() => {
    const form = composerRef.current
    const home = form?.closest('.app-shell')?.querySelector('.home-screen')
    const row = form?.querySelector('.input-row')
    if (!home || !row) return
    let wasAtBottom = home.scrollHeight - home.clientHeight - home.scrollTop <= 2
    const rememberPosition = () => { wasAtBottom = home.scrollHeight - home.clientHeight - home.scrollTop <= 2 }
    home.addEventListener('scroll', rememberPosition)
    const updateBottomSpace = () => {
      const messages = [...home.querySelectorAll('.chat-messages > *')].filter(element => element.getClientRects().length)
      const last = messages.at(-1)
      const gap = last ? row.getBoundingClientRect().top - last.getBoundingClientRect().bottom : Infinity
      const followBottom = home.scrollTop > 0 && (wasAtBottom || (gap >= 0 && gap <= 96))
      const scale = home.getBoundingClientRect().height / home.offsetHeight || 1
      const space = (home.getBoundingClientRect().bottom - row.getBoundingClientRect().top + 64) / scale
      home.style.setProperty('--conversation-bottom-space', `${space}px`)
      if (followBottom) home.scrollTo({ top: home.scrollHeight, behavior: 'instant' })
    }
    updateBottomSpace()
    const observer = new ResizeObserver(updateBottomSpace)
    observer.observe(row)
    observer.observe(home)
    window.addEventListener('resize', updateBottomSpace)
    return () => { observer.disconnect(); home.removeEventListener('scroll', rememberPosition); window.removeEventListener('resize', updateBottomSpace) }
  }, [composerRef])
  const send = event => {
    event.preventDefault()
    if (disabled || !input.trim()) return
    onSend(event)
    setComposerNotice('')
    if (uploadRef.current) uploadRef.current.value = ''
  }
  return <form className={`composer journey-composer${multilineInput ? ' multiline' : ''}`} onSubmit={send} inert={suspended} ref={composerRef}>
      <input ref={uploadRef} type="file" accept="image/*,.pdf" multiple hidden onChange={event => {
        const files = [...event.target.files]
        setComposerNotice(files.length ? `已选择：${files.map(file => file.name).join('、')}（仅本地选择）` : '')
      }} />
      {composerNotice && <p className="composer-notice" role="status">{composerNotice}</p>}
      <div className="input-row">
        <button className="composer-icon" type="button" aria-label="上传图片或文件" disabled={disabled} onClick={() => uploadRef.current?.click()}><PlusIcon /></button>
        {voiceMode && !input.trim() ? <button className="voice-input-trigger" type="button" disabled={disabled} onClick={() => listening ? speechRef.current?.stop() : startVoice()}>{listening ? '正在聆听，点击结束' : '点击说话'}</button> : <textarea aria-label={`向${guideName}提出出行意向`} value={input} onChange={event => setInput(event.target.value)} onFocus={onInputFocus} onClick={onInputFocus} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) send(event) }} rows={1} disabled={disabled} placeholder="请输入文字..." />}
        {input.trim() ? <button className="send-button" aria-label="发送出行意向" disabled={disabled}><ArrowUpIcon weight="bold" /></button> : <button className="composer-icon" type="button" aria-label={voiceMode ? '切换文字输入' : '切换语音输入'} aria-pressed={voiceMode} disabled={disabled} onClick={() => { speechRef.current?.abort(); setVoiceMode(!voiceMode); setComposerNotice('') }}>{voiceMode ? <KeyboardIcon /> : <MicrophoneIcon />}</button>}
      </div>
    </form>
}
