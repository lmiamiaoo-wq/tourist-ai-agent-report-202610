import Price from './Price'
export default function GuideServices({ services, onOpen }) {
  return <section className="guide-available-services" aria-label="当前可提供的服务">
    {services.map(service => <button type="button" className="journey-service-product" key={service.id} onClick={() => onOpen(service)}>
      <img src={service.image} alt="" /><span><strong>{service.cardName || service.name}</strong><small>{service.cardDescription || service.intro}</small><b>{service.referencePrice ? <Price value={service.referencePrice} prefix="参考价 ￥" auxiliaryWeight={400} /> : <Price value={service.price || service.priceLabel?.replace(/^[￥¥]/, "")} suffix={service.priceSuffix} auxiliaryWeight={400} />}</b></span>
    </button>)}
  </section>
}
