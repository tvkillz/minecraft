import type { LegalBlock, LegalDocumentConfig } from '@/config/schema'
import './LegalDocument.css'

type LegalDocumentProps = {
  document: LegalDocumentConfig
}

function renderBlock(block: LegalBlock, index: number) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p key={index} className="legal-doc__paragraph">
          {block.text}
        </p>
      )
    case 'heading': {
      const Tag = block.level === 3 ? 'h3' : 'h2'
      return (
        <Tag key={index} className="legal-doc__heading">
          {block.text}
        </Tag>
      )
    }
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag key={index} className="legal-doc__list">
          {block.items.map((item, itemIndex) => (
            <li key={itemIndex}>{item}</li>
          ))}
        </ListTag>
      )
    }
    case 'company':
      return (
        <div key={index} className="legal-doc__company">
          <p className="legal-doc__company-name">{block.name}</p>
          <p>Company number: {block.companyNumber}</p>
          <p>Registered address: {block.address}</p>
          <p>
            Email:{' '}
            <a href={`mailto:${block.email}`} className="legal-doc__link">
              {block.email}
            </a>
          </p>
        </div>
      )
    default:
      return null
  }
}

export default function LegalDocument({ document }: LegalDocumentProps) {
  return (
    <article className="legal-doc">
      {document.eyebrow ? <p className="legal-doc__eyebrow">{document.eyebrow}</p> : null}
      <h1 className="legal-doc__title">{document.title}</h1>
      {document.lastUpdated ? (
        <p className="legal-doc__updated">Last Updated: {document.lastUpdated}</p>
      ) : null}
      <div className="legal-doc__body">{document.blocks.map(renderBlock)}</div>
    </article>
  )
}
