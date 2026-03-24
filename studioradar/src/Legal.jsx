import { useState } from 'react'
import { FileText, XCircle, ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from './components/Navbar'

const SECTIONS = {
  terms: {
    icon: FileText,
    label: 'Términos y Condiciones',
    lastUpdate: 'marzo de 2026',
    content: [
      {
        title: '1. Información General',
        body: `En cumplimiento con lo establecido en la Ley 34/2002, de 11 de julio, de Servicios de la Sociedad de la Información y Comercio Electrónico (LSSI-CE), se informa que el presente sitio web es titularidad de Helicon Studios S.L., con domicilio en Madrid, correo electrónico de contacto: legal@heliconstudio.es.`
      },
      {
        title: '2. Objeto y Aceptación',
        body: `Los presentes Términos y Condiciones regulan el acceso, uso y contratación de los servicios disponibles en la plataforma Helicon (en adelante, "la Plataforma"), cuyo objeto es poner en contacto a productores musicales que ofrecen espacios de grabación (en adelante, "Productores") con usuarios que desean reservar dichos espacios (en adelante, "Clientes").

El acceso y uso de la Plataforma implica la aceptación plena y sin reservas de estos Términos y Condiciones. Si no estás de acuerdo, debes abstenerte de usar la Plataforma.`
      },
      {
        title: '3. Usuarios de la Plataforma',
        body: `La Plataforma distingue dos tipos de usuarios:

• Productores: profesionales o empresas que registran sus estudios de grabación, configuran su disponibilidad y reciben reservas a través de la Plataforma.

• Clientes: personas físicas o jurídicas que buscan y reservan espacios de grabación mediante la Plataforma.

Ambos tipos de usuarios deben ser mayores de 18 años o contar con autorización de su representante legal.`
      },
      {
        title: '4. Proceso de Reserva y Contratación',
        body: `4.1 El Cliente selecciona el estudio, espacio y franja horaria disponible en la Plataforma.

4.2 La reserva queda confirmada únicamente tras la realización del pago completo. Hasta ese momento, el slot permanece disponible para otros usuarios.

4.3 Una vez completado el pago, el Cliente recibirá un correo electrónico de confirmación con los detalles de su reserva. Este correo tiene valor de confirmación contractual.

4.4 La Plataforma actúa como intermediaria entre Productores y Clientes. El contrato de prestación del servicio de estudio se establece directamente entre el Productor y el Cliente.`
      },
      {
        title: '5. Precios y Pagos',
        body: `5.1 Los precios de cada espacio son fijados por cada Productor y se muestran claramente antes de confirmar la reserva, incluyendo los impuestos aplicables (IVA).

5.2 El pago se realiza de forma segura a través de Stripe. La Plataforma no almacena datos de tarjetas de crédito.

5.3 Cualquier cargo adicional debe acordarse directamente entre Cliente y Productor y no está cubierto por esta Plataforma.`
      },
      {
        title: '6. Obligaciones del Productor',
        body: `• Mantener actualizada la disponibilidad de sus espacios.
• Prestar el servicio en las condiciones descritas en su perfil.
• Garantizar que el espacio está en las condiciones anunciadas en el momento de la reserva.
• Notificar a la Plataforma cualquier incidencia que impida la prestación del servicio reservado.`
      },
      {
        title: '7. Obligaciones del Cliente',
        body: `• Proporcionar datos verídicos en el proceso de registro y reserva.
• Respetar las normas de uso del estudio indicadas por el Productor.
• Llegar puntualmente a la hora reservada. Los retrasos no darán derecho a extensión del tiempo reservado salvo acuerdo expreso con el Productor.
• No ceder la reserva a terceros sin consentimiento previo del Productor.`
      },
      {
        title: '8. Responsabilidad',
        body: `8.1 La Plataforma no se responsabiliza de incumplimientos entre Productores y Clientes, aunque facilitará los mecanismos de resolución de disputas disponibles.

8.2 La Plataforma no garantiza la disponibilidad ininterrumpida del servicio y queda exenta de responsabilidad por interrupciones técnicas ajenas a su control.

8.3 Los Productores son responsables de la exactitud de la información publicada sobre sus estudios.`
      },
      {
        title: '9. Propiedad Intelectual',
        body: `El contenido de la Plataforma (diseño, textos, logotipos) es propiedad de Helicon Studios S.L. o cuenta con las licencias pertinentes. Las imágenes de los estudios son responsabilidad de cada Productor, que garantiza tener los derechos necesarios para su publicación.`
      },
      {
        title: '10. Modificación de los Términos',
        body: `La Plataforma se reserva el derecho a modificar estos Términos en cualquier momento. Los cambios serán notificados con al menos 15 días de antelación. El uso continuado de la Plataforma tras ese plazo implica aceptación de los nuevos términos.`
      },
      {
        title: '11. Legislación y Jurisdicción',
        body: `Estos Términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los Juzgados y Tribunales de Madrid, sin perjuicio de los fueros que correspondan a consumidores según la normativa vigente.`
      },
    ]
  },
  cancellation: {
    icon: XCircle,
    label: 'Política de Cancelación',
    lastUpdate: 'marzo de 2026',
    content: [
      {
        title: 'Nota Legal',
        body: `En virtud del artículo 103 del Real Decreto Legislativo 1/2007 (LGDCU), las reservas de servicios sujetas a una fecha y hora específicas están expresamente excluidas del derecho de desistimiento general de 14 días. Las siguientes políticas son por tanto legalmente válidas y de aplicación.`
      },
      {
        title: 'Modalidad A — Política Flexible',
        body: `Recomendada para estudios que quieran atraer más reservas con menos riesgo para el cliente.`,
        table: [
          ['Momento de cancelación', 'Reembolso'],
          ['Más de 72 horas antes', '100% del importe pagado'],
          ['Entre 24 y 72 horas antes', '50% del importe pagado'],
          ['Menos de 24 horas antes', 'Sin reembolso'],
        ]
      },
      {
        title: 'Modalidad B — Política Estricta',
        body: `Para estudios con alta demanda o espacios muy solicitados.`,
        table: [
          ['Momento de cancelación', 'Reembolso'],
          ['Más de 7 días antes', '50% del importe pagado'],
          ['Menos de 7 días antes', 'Sin reembolso'],
        ]
      },
      {
        title: 'Cancelación por Parte del Productor',
        body: `Si un Productor cancela una reserva confirmada:

• El Cliente recibirá el reembolso íntegro del 100% del importe pagado.
• El reembolso se procesará en un plazo máximo de 5 días hábiles.
• La Plataforma se reserva el derecho a aplicar penalizaciones al Productor por cancelaciones reiteradas.`
      },
      {
        title: 'Modificaciones de Reserva',
        body: `Las modificaciones (cambio de fecha u hora) están sujetas a la disponibilidad del Productor y deben solicitarse con al menos 48 horas de antelación.

El Productor tiene derecho a rechazar modificaciones. En ese caso, aplica la política de cancelación estándar si el Cliente no desea mantener la reserva original.`
      },
      {
        title: 'Reclamaciones',
        body: `Para cualquier incidencia, el Cliente puede dirigirse a legal@heliconstudio.es. La Plataforma actuará como mediadora entre las partes. Si la disputa no se resuelve, el Cliente podrá acudir a la Junta Arbitral de Consumo de su comunidad autónoma, de conformidad con la normativa española de resolución alternativa de litigios (Ley 7/2017).`
      },
    ]
  }
}

function AccordionItem({ title, body, table, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-white/5 last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm font-mono font-semibold text-white/80 group-hover:text-white transition-colors">
          {title}
        </span>
        {open
          ? <ChevronUp size={14} className="text-accent shrink-0" />
          : <ChevronDown size={14} className="text-white/30 shrink-0" />
        }
      </button>

      {open && (
        <div className="pb-5 space-y-4">
          {body && (
            <p className="text-sm font-mono text-white/50 leading-relaxed whitespace-pre-line">
              {body}
            </p>
          )}
          {table && (
            <div className="overflow-hidden rounded-xl border border-white/5">
              {table.map((row, i) => (
                <div
                  key={i}
                  className={`grid grid-cols-2 gap-4 px-4 py-3 text-xs font-mono ${i === 0
                      ? 'bg-white/5 text-white/40 uppercase tracking-widest'
                      : 'border-t border-white/5 text-white/60'
                    }`}
                >
                  <span>{row[0]}</span>
                  <span className={i > 0 ? 'text-accent' : ''}>{row[1]}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function Legal() {
  const [activeTab, setActiveTab] = useState('terms')
  const section = SECTIONS[activeTab]
  const Icon = section.icon

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Noise overlay */}
      <div className="noise-bg" />

      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-28 pb-16">
        {/* Hero */}
        <div className="mb-12">
          <p className="text-[10px] font-mono text-accent uppercase tracking-[0.3em] mb-3">Documentos Legales</p>
          <h1 className="text-3xl font-bold tracking-tight mb-4">Aviso Legal</h1>
          <p className="text-white/40 font-mono text-sm max-w-xl">
            Información legal, términos de uso y políticas de cancelación de la plataforma Helicon.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-10 bg-white/3 border border-white/5 rounded-xl p-1 w-fit">
          {Object.entries(SECTIONS).map(([key, s]) => {
            const TabIcon = s.icon
            return (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-mono transition-all ${activeTab === key
                    ? 'bg-accent text-white shadow-lg shadow-accent/20'
                    : 'text-white/40 hover:text-white'
                  }`}
              >
                <TabIcon size={13} />
                {s.label}
              </button>
            )
          })}
        </div>

        {/* Card */}
        <div className="bg-[#1A1A1A] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
          {/* Card header */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
                <Icon size={16} className="text-accent" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-bold text-white">{section.label}</h2>
                <p className="text-[10px] font-mono text-white/30 mt-0.5">Última actualización: {section.lastUpdate}</p>
              </div>
            </div>
          </div>

          {/* Accordion */}
          <div className="px-8 divide-y divide-white/0">
            {section.content.map((item, i) => (
              <AccordionItem
                key={i}
                title={item.title}
                body={item.body}
                table={item.table}
                defaultOpen={i === 0}
              />
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-8 text-center text-[10px] font-mono text-white/15">
          Para cualquier consulta legal: legal@heliconstudio.es
        </p>
      </main>
    </div>
  )
}
