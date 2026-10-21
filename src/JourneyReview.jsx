import { useState } from 'react'

export const reviewOptions = [{ value: 1, label: '非常差', icon: 'poor' }, { value: 3, label: '一般般', icon: 'okay' }, { value: 5, label: '超级棒', icon: 'great' }]
export default function JourneyReview({ order, enabled, onSubmit }) {
  const [rating, setRating] = useState(order?.rating || null)
  const [tags, setTags] = useState(order?.reviewTags || [])
  const [review, setReview] = useState('')
  const options = rating === 1 ? ['接送不准时', '沟通待改善', '车内不整洁', '路线不熟悉', '讲解不清楚', '服务不周到'] : rating === 3 ? ['接送较准时', '沟通一般', '车辆较整洁', '行程较合理', '讲解一般', '服务待提升'] : ['接送准时', '耐心细致', '驾驶平稳', '熟悉路线', '车辆整洁', '服务贴心']
  return <section className="journey-review">
    <header className="journey-review-heading"><h3>{order?.rating ? '感谢你的评价' : '本次服务怎么样？'}</h3></header>
    <div className="journey-reactions" role="group" aria-label="服务评分">{reviewOptions.map(option => <button type="button" key={option.value} disabled={!enabled} aria-pressed={rating === option.value} onClick={() => { setRating(option.value); setTags([]) }}><img src={`/assets/review-${option.icon}.svg`} alt="" /><span>{option.label}</span></button>)}</div>
    <form onSubmit={event => { event.preventDefault(); if (!enabled || !rating) return; onSubmit({ text: [tags.join('、'), review.trim()].filter(Boolean).join('。') || reviewOptions.find(option => option.value === rating).label, rating, tags }) }}>
      <div className="journey-review-tags" role="group" aria-label="评价标签">{options.map(tag => <button type="button" key={tag} disabled={!enabled} aria-pressed={tags.includes(tag)} onClick={() => setTags(current => current.includes(tag) ? current.filter(item => item !== tag) : [...current, tag])}>{tag}</button>)}</div>
      <textarea aria-label="其他评价" placeholder="其他评价（选填）" value={review} onChange={event => setReview(event.target.value)} disabled={!enabled} rows={3} />
      <button className="journey-primary" disabled={!enabled || !rating}>{order?.rating ? '评价已提交' : '确认评价'}</button>
    </form>
  </section>
}
