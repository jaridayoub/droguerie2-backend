import { forwardRef } from 'react';

const numberToWords = (n) => {
  const units = ['', 'UN', 'DEUX', 'TROIS', 'QUATRE', 'CINQ', 'SIX', 'SEPT', 'HUIT', 'NEUF',
    'DIX', 'ONZE', 'DOUZE', 'TREIZE', 'QUATORZE', 'QUINZE', 'SEIZE', 'DIX-SEPT', 'DIX-HUIT', 'DIX-NEUF']
  const tens = ['', '', 'VINGT', 'TRENTE', 'QUARANTE', 'CINQUANTE', 'SOIXANTE', 'SOIXANTE', 'QUATRE-VINGT', 'QUATRE-VINGT']

  if (n === 0) return 'ZÉRO'
  if (n < 0) return 'MOINS ' + numberToWords(-n)

  let result = ''
  const int = Math.floor(n)
  const dec = Math.round((n - int) * 100)

  const convert = (num) => {
    if (num === 0) return ''
    if (num < 20) return units[num] + ' '
    if (num < 100) {
      const t = Math.floor(num / 10)
      const u = num % 10
      if (t === 7 || t === 9) return tens[t] + (u === 0 ? (t === 8 ? 'S ' : ' ') : '-' + units[10 + u] + ' ')
      return tens[t] + (u === 0 ? (t === 8 ? 'S ' : ' ') : '-' + units[u] + ' ')
    }
    if (num < 1000) {
      const h = Math.floor(num / 100)
      const r = num % 100
      return (h === 1 ? 'CENT ' : units[h] + ' CENT' + (r === 0 ? 'S ' : ' ')) + convert(r)
    }
    if (num < 1000000) {
      const m = Math.floor(num / 1000)
      const r = num % 1000
      return (m === 1 ? 'MILLE ' : convert(m) + 'MILLE ') + convert(r)
    }
    return num.toString()
  }

  result = convert(int).trim() + ' DIRHAMS'
  if (dec > 0) result += ' ET ' + convert(dec).trim() + ' CENTIMES'
  return result
}

const TicketPrint = forwardRef(({ sale }, ref) => {
  if (!sale) return <div ref={ref} />

  const tvaGroups = {}
  sale.items?.forEach(item => {
    const tva = +item.tva || 0
    const ht = (+item.total) / (1 + tva / 100)
    const tvaAmt = (+item.total) - ht
    if (!tvaGroups[tva]) tvaGroups[tva] = { ht: 0, tva: 0, ttc: 0 }
    tvaGroups[tva].ht  += ht
    tvaGroups[tva].tva += tvaAmt
    tvaGroups[tva].ttc += +item.total
  })

  const totalHT  = Object.values(tvaGroups).reduce((s, g) => s + g.ht, 0)
  const totalTVA = Object.values(tvaGroups).reduce((s, g) => s + g.tva, 0)
  const totalTTC = +sale.total
  const remise   = +sale.remise || 0

  const now = new Date()
  const dateStr = now.toLocaleDateString('fr-MA')
  const timeStr = now.toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })

  const th = { padding: '6px 8px', border: '1px solid #ccc', background: '#e8e8e8', fontSize: 11, fontWeight: 'bold' }
  const td = { padding: '5px 8px', border: '1px solid #ddd', fontSize: 11 }

  return (
    <div ref={ref} style={{ width: '210mm', minHeight: '297mm', margin: '0 auto', padding: '10mm 12mm', fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#000', backgroundColor: '#fff', boxSizing: 'border-box', position: 'relative' }}>

      {/* Page number */}
      <div style={{ textAlign: 'right', fontSize: 10, marginBottom: 4 }}>Page: 1</div>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        {/* Logo / Entreprise */}
        <div style={{ width: '40%' }}>
          <img src="/A2.jpeg" alt="Tassouki" style={{ height: '80px', width: 'auto', objectFit: 'contain' }} />
        </div>

        {/* Titre Facture */}
        <div style={{ width: '55%', textAlign: 'center' }}>
          <div style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 4 }}>Facture</div>
          <div style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>N° : {sale.invoice_number}</div>

          {/* Client box */}
          <div style={{ border: '1px solid #ccc', padding: '6px 10px', textAlign: 'left', marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: '#666' }}>Nom ou Raison Sociale</div>
            <div style={{ fontWeight: 'bold' }}>{sale.client?.name || 'Client anonyme'}</div>
            {sale.client?.address && <div style={{ fontSize: 11 }}>{sale.client.address}</div>}
          </div>

          {/* Infos facture */}
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <tbody>
              <tr>
                <td style={{ padding: '2px 6px', color: '#555', width: '40%' }}>Date Facture :</td>
                <td style={{ padding: '2px 6px', borderLeft: '1px solid #ccc' }}>{new Date(sale.created_at || Date.now()).toLocaleDateString('fr-MA')}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 6px', color: '#555' }}>Code Client :</td>
                <td style={{ padding: '2px 6px', borderLeft: '1px solid #ccc' }}>{sale.client ? `#${String(sale.client.id).padStart(5, '0')}` : '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 6px', color: '#555' }}>Vendeur :</td>
                <td style={{ padding: '2px 6px', borderLeft: '1px solid #ccc' }}>{sale.user?.name || '—'}</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 6px', color: '#555' }}>Paiement :</td>
                <td style={{ padding: '2px 6px', borderLeft: '1px solid #ccc' }}>{sale.payment_method === 'cash' ? 'Espèces' : sale.payment_method === 'credit' ? 'Crédit' : 'Mixte'}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Table Produits */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
        <thead>
          <tr>
            <th style={th}>Référence</th>
            <th style={{ ...th, textAlign: 'left' }}>Désignation</th>
            <th style={th}>Qté</th>
            <th style={th}>Prix U. HT</th>
            <th style={th}>Remise</th>
            <th style={th}>PU Net HT</th>
            <th style={th}>Prix Total HT</th>
          </tr>
        </thead>
        <tbody>
          {sale.items?.map((item, i) => {
            const tva = +item.tva || 0
            const puTTC = +item.price
            const puHT = puTTC / (1 + tva / 100)
            const totalHTLine = (+item.total) / (1 + tva / 100)
            const remisePct = remise > 0 ? ((remise / (+sale.subtotal)) * 100).toFixed(2) : '0.00'
            const puNetHT = puHT * (1 - remise / (+sale.subtotal || 1))
            return (
              <tr key={i} style={{ background: i % 2 === 0 ? '#fafafa' : '#fff' }}>
                <td style={{ ...td, textAlign: 'center' }}>{item.product_id}</td>
                <td style={td}>{item.product_name}</td>
                <td style={{ ...td, textAlign: 'center' }}>{item.quantity}</td>
                <td style={{ ...td, textAlign: 'right' }}>{puHT.toFixed(3)}</td>
                <td style={{ ...td, textAlign: 'center' }}>{remisePct}%</td>
                <td style={{ ...td, textAlign: 'right' }}>{puNetHT.toFixed(2)}</td>
                <td style={{ ...td, textAlign: 'right' }}>{(puNetHT * item.quantity).toFixed(2)}</td>
              </tr>
            )
          })}
          {/* Empty rows */}
          {Array.from({ length: Math.max(0, 8 - (sale.items?.length || 0)) }).map((_, i) => (
            <tr key={'e' + i}><td style={td}>&nbsp;</td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td><td style={td}></td></tr>
          ))}
        </tbody>
      </table>

      {/* Montants en DH label */}
      <div style={{ textAlign: 'right', fontSize: 10, marginBottom: 4, color: '#555' }}>Montants en DH</div>

      {/* Bottom section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 10 }}>

        {/* Montant en lettres */}
        <div style={{ width: '55%' }}>
          <div style={{ fontSize: 11, marginBottom: 6 }}>
            <strong>Arrêté le présent document à la somme de :</strong>
          </div>
          <div style={{ fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 10 }}>
            {numberToWords(totalTTC)}
          </div>
          <div style={{ fontSize: 10, color: '#555', marginTop: 10 }}>
            <div>Généré le: {dateStr} à {timeStr}</div>
            <div>Par: {sale.user?.name || '—'}</div>
          </div>
        </div>

        {/* Totaux */}
        <div style={{ width: '40%' }}>
          {remise > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#fff3cd', marginBottom: 2 }}>
              <span>dont la remise est de :</span>
              <span style={{ fontWeight: 'bold', color: '#c00' }}>{remise.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', border: '1px solid #ccc', marginBottom: 2 }}>
            <span>Total H.T.</span>
            <span style={{ fontWeight: 'bold' }}>{totalHT.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', border: '1px solid #ccc', marginBottom: 2 }}>
            <span>Total T.V.A.</span>
            <span style={{ fontWeight: 'bold' }}>{totalTVA.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 8px', background: '#ccc', fontWeight: 'bold', fontSize: 12 }}>
            <span>Total T.T.C.</span>
            <span>{totalTTC.toFixed(2)}</span>
          </div>
          {(+sale.credit) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 8px', background: '#ffe0e0', marginTop: 2 }}>
              <span>Reste à payer :</span>
              <span style={{ fontWeight: 'bold', color: '#c00' }}>{(+sale.credit).toFixed(2)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '2px solid #333', paddingTop: 8, marginTop: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#444' }}>
          <div>📍 Votre adresse — Maroc</div>
          <div>📞 05XX-XXXXXX</div>
          <div>✉ contact@tassouki.ma</div>
        </div>
        <div style={{ textAlign: 'center', fontSize: 9, color: '#888', marginTop: 4, fontStyle: 'italic' }}>
          Les articles vendus ne sont ni repris ni échangés.
        </div>
      </div>

    </div>
  )
})

TicketPrint.displayName = 'TicketPrint'
export default TicketPrint
