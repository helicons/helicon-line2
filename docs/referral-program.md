# Helicon Referral Program

## Program Overview

Helicon grows when artists tell other artists. Word of mouth in the Madrid trap and drill scene is powerful — if an artist recorded a track at The Vault with a Metro Shadows beat and it came out well, they will tell their circle. The referral program captures that conversation and turns it into a measurable, scalable acquisition channel.

There are two separate programs:

1. **Helicon Crew** — artist-to-artist referral, triggered after a completed studio session
2. **Producer Affiliate Program** — producers earn commissions on beat sales through their links

---

## Part 1 — Helicon Crew (Artist Referral Program)

### Design Principles

- The reward must feel immediate and personal, not like a coupon.
- The ask must happen at the highest-satisfaction moment in the user journey.
- The share mechanism must work both online (link) and offline (code).

### Trigger Moment

The referral ask fires at one specific moment: **immediately after a studio session is marked as completed.**

This is the highest-NPS moment in the Helicon experience. The artist just finished recording, the engineer checked them out, and they are still in the session glow. That is when they are most likely to share.

The trigger sequence:
1. Studio marks session as completed in the Helicon dashboard.
2. Artist receives a push notification + email within 15 minutes: "Sesión terminada. ¿Cómo fue? Y si conoces a alguien que necesite estudio, tienes un regalo para ellos."
3. One tap opens the share screen with their personalized link and referral code.

### Reward Structure — Double-Sided

Both the referrer and the new user must benefit. A one-sided program creates a transaction feel. A double-sided program creates the feeling of generosity — "I'm giving you something."

| Action | Referrer gets | New user gets |
|---|---|---|
| New user signs up via link | Nothing yet (not enough signal) | — |
| New user completes first booking | €15 studio credit | €10 off their first booking |

The credit is applied automatically, no claim required. The referrer gets an in-app notification and email: "Tu amigo acaba de reservar su primera sesión. Te acabamos de añadir €15 de crédito."

### Tiered Rewards — Helicon Crew Status

Repeat referrers unlock additional rewards. This creates a sense of progression and community belonging without requiring a formal loyalty program.

| Referrals | Reward |
|---|---|
| 1 successful referral | €15 studio credit (baseline) |
| 3 successful referrals | 1 free studio hour (up to €30 value, valid 90 days) |
| 5 successful referrals | "Helicon Crew" badge on profile + producer shoutout in the Discord #announcements channel + featured in the monthly Helicon TikTok post |
| 10+ successful referrals | Named on the Helicon website as a founding crew member + permanent 10% discount on all studio bookings |

The "Helicon Crew" badge and producer shoutout at 5 referrals is the most powerful tier. It converts a transactional reward into a social identity. In a scene where reputation and credibility matter, being publicly affiliated with a platform and a known producer is worth more than any credit.

### Share Mechanism

**Personalized link:** `helicon.es/ref/[username]`

The link is generated automatically when an artist creates a Helicon account. It does not require the artist to opt into anything — it is always ready.

**Referral code for offline use:** A 6-character alphanumeric code (e.g., TRAP22, VAULT7) generated alongside the link. This is for situations where the artist is talking to someone in person, at a show, or in a WhatsApp group where a link is awkward. The new user enters the code on signup.

**Pre-written share messages** (editable, in Spanish):

For WhatsApp / direct message:
> "Oye, si necesitas estudio en Madrid prueba Helicon — Neon Room, The Vault y más desde 20€/h. Con mi código [CODE] te dan 10€ de descuento en la primera sesión: helicon.es/ref/[username]"

For Instagram Stories (template provided in the app):
> Image of their session completion confirmation + sticker: "Recién grabado. Tú también puedes → helicon.es/ref/[username]"

### Fraud Prevention Rules

Referral programs attract gaming. These rules are enforced automatically.

1. **Self-referral block:** If the referring account and the new account share the same email domain, IP address at signup, or payment method, the referral is flagged for manual review and the credit is held.
2. **Minimum session completion:** The referral credit only pays out when the referred user completes a real, paid session (not just books one). Cancellations do not count.
3. **Account age check:** New accounts created within 24 hours of signup that immediately refer multiple users are flagged automatically.
4. **Credit cap:** A single user can hold a maximum of €150 in referral credit at any time. Credits expire 12 months after issue.
5. **Suspicious volume:** Any account generating more than 15 referrals in 30 days is reviewed manually before further credits are issued.
6. **Stripe linkage:** Payment methods used by referrer and referred user are checked for duplicates. Same card = flagged.

---

## Part 2 — Producer Affiliate Program

### Overview

Helicon's 12 roster producers already have audiences. Their Instagram followers, SoundCloud listeners, and YouTube subscribers are exactly Helicon's target customers. The affiliate program monetizes that reach directly and gives producers a financial incentive to promote the platform.

Producers earn a **20% commission** on every beat sold through their unique affiliate link.

### How It Works

1. Each producer gets a unique affiliate link: `helicon.es/beats/[producer-name]`
2. When an artist clicks that link and purchases any beat (not just that producer's beats), the referring producer earns 20% of the sale price.
3. Commissions accumulate in the producer's Helicon earnings dashboard.
4. Payouts are processed monthly via Stripe on the 1st of each month, for earnings from the previous calendar month.
5. Minimum payout threshold: €25. If earnings are below €25, they roll over to the next month.

**Commission example:**
- Artist clicks a producer's affiliate link
- Artist purchases a WAV + Stems license for €79
- Referring producer earns €15.80 (20%)
- Commission is tracked even if the artist returns and purchases 7 days later (7-day attribution window)

### Producer Dashboard

Each producer has access to a live dashboard showing:

- Total link clicks (last 7 days / 30 days / all time)
- Conversion rate (clicks to purchases)
- Total beats sold via affiliate link
- Total earnings (pending / cleared / paid out)
- Top-performing beats sold through their link (useful intel for what their audience responds to)
- Payout history with Stripe receipt links

The dashboard is accessible from the producer's Helicon profile admin section. It is designed to be readable in 30 seconds — no complex analytics, just the numbers that matter.

### Recruitment Email Template for Producers

This email goes to producers who are not yet on the Helicon platform but have an existing audience in the Spanish urban music scene.

---

**Subject:** tus beats, tu link, tu comisión

---

Hola [nombre del productor],

Sé que tienes una base de fans que te pide beats constantemente. La mayoría acaba comprados en marketplaces donde ni sabes quién los compra ni qué ganan.

Helicon es diferente. Es una plataforma española para artistas independientes de trap, drill y reggaetón — y necesitamos productores como tú que ya tienen credibilidad en la escena.

El modelo es sencillo:
- Subes tus beats al marketplace de Helicon (tú pones el precio)
- Te damos un link de afiliado personalizado
- Cada vez que alguien compra un beat a través de tu link, te llevas el 20% de la venta — aunque no sea tu beat
- Cobros mensuales vía Stripe, sin intermediarios

Tenemos a [mencionar 2-3 productores ya en el roster] en la plataforma. Los beats de Metro Shadows tienen más de 2 millones de plays solo en el marketplace.

¿Te interesa ver cómo funciona? Te mando acceso al panel de productor esta semana si quieres.

Un saludo,
[nombre]
Helicon

---

### Affiliate Program Terms (Summary for Producers)

- Commission rate: 20% of each sale generated through your affiliate link.
- Attribution window: 7 days (if someone clicks your link and buys within 7 days, you get the commission).
- Payout: monthly via Stripe, minimum €25.
- What counts: beat licenses (MP3, WAV, WAV + Stems, Exclusive). Custom beat commissions are not included in the affiliate program.
- Fraud: artificially inflating clicks or using your own link to purchase beats will result in immediate removal from the program and forfeiture of pending earnings.
- Termination: either party can exit with 30 days notice. Earned commissions for completed sales are always paid.

---

## Metrics to Track

These three metrics determine whether the referral programs are working and where to intervene.

### 1. Referral Rate

**Definition:** Percentage of new user signups that came from a referral link or code.

**Target:** 25% of new signups by Month 4, 35% by Month 8.

**Why it matters:** A high referral rate means Helicon is growing without paying for every user. If the rate drops below 15%, the trigger timing or reward is off — investigate which.

**How to track:** Tag all signups at source. Mixpanel event: `signup_completed` with property `acquisition_source: referral | organic | paid | email`.

---

### 2. CAC via Referral vs Paid

**Definition:** Average cost to acquire one paying customer through the referral program vs paid channels (TikTok Ads, Meta Ads).

**Expected ranges:**
- Referral CAC: €10-15 (cost of the €15 credit + €10 new user discount, shared across conversion rate)
- Paid CAC: €20-40 (estimated for early-stage campaigns targeting Madrid artists)

**Why it matters:** If referral CAC is lower than paid CAC and the LTV of referred users is similar or higher, the referral program should receive more investment (better rewards, more prominent placement) and paid budgets should be used to reach audiences that cannot be reached organically.

**How to track:** Monthly analysis. Total credits issued via referral in a period / number of new paying users acquired via referral in that period = referral CAC.

---

### 3. LTV of Referred Users vs Non-Referred Users

**Definition:** 12-month revenue generated per user, segmented by whether they were referred or not.

**Hypothesis:** Referred users have higher LTV because (a) they came in with a social endorsement from someone they trust, and (b) they tend to be in the same social circle as the referrer, meaning they are likely to book together or collaborate.

**Target:** Referred user LTV should be at least 20% higher than non-referred LTV by Month 12.

**How to track:** Cohort analysis in Mixpanel or a BI tool. Segment users by `acquisition_source` and track `total_revenue_per_user` at 30, 60, 90, 180, and 365 days.

---

## Email Sequence — Helicon Crew Program Announcement

These three emails are sent to the existing user base when the referral program launches.

### Email 1 — Program Announcement

**Subject:** te presentamos Helicon Crew

---

Ei [nombre],

Llevamos tiempo pensando cómo recompensar a los artistas que traen a otros artistas a Helicon. Porque así es como crece esto — de boca en boca, en el camerino, en el grupo de WhatsApp.

Hoy lanzamos Helicon Crew.

Cómo funciona:
- Comparte tu link personal con otros artistas: helicon.es/ref/[username]
- Cuando reserven su primera sesión, tú te llevas €15 de crédito y ellos €10 de descuento.
- A 3 referidos: te regalamos una hora gratis en cualquiera de nuestros estudios.
- A 5 referidos: badge oficial de Helicon Crew + shoutout del productor que elijas en nuestro Discord y TikTok.

Tu link personal está esperándote aquí: [CTA button: Ver mi link]

No caduca. No hay límite de referidos.

[nombre]
Helicon

---

### Email 2 — Day 7 Reminder

**Subject:** tu crédito está esperando

*(Send to users who have not yet shared their link)*

---

Ei [nombre],

Hace una semana te mandamos tu link de Helicon Crew. Todavía no lo has compartido — sin presión, pero queríamos recordarte que el crédito de €15 sigue ahí esperándote.

El proceso es: compartes el link, tu amigo reserva su primera sesión, y los €15 aparecen automáticamente en tu cuenta. No hay que hacer nada más.

Si tienes un colega que está buscando estudio o beats, este es el momento.

Tu link: helicon.es/ref/[username]

[nombre]

---

### Email 3 — Day 30 "¿Conoces a alguien?"

**Subject:** ¿conoces a alguien grabando en Madrid?

*(Send to users who have not yet generated a successful referral)*

---

Ei [nombre],

Una pregunta directa: ¿conoces a alguien que esté grabando en Madrid o buscando beats para su próximo proyecto?

Si la respuesta es sí, tu link de Helicon Crew les da €10 de descuento en su primera sesión — y tú te llevas €15 de crédito para la tuya.

No tienes que explicar nada raro. Solo mandarles: "Prueba esto, a mí me funciona."

helicon.es/ref/[username]

Un saludo,
[nombre]

---

*Si en algún momento no quieres recibir estos emails, puedes darte de baja aquí.*
