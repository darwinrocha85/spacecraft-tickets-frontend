# spacecraft-tickets-frontend (tienda) — ROADMAP

- [x] Tienda (museo/teatro), Mis entradas (buscar/cancelar/reprogramar), deploy target `tickets`
- [x] Campo tarjeta BankIn en checkout + guardar `transaction_id` por venta (ver `Bankin/docs/BANKIN-INTEGRATION.md`)
- [x] Checkout multitramo multimoneda (2026-10-04): precio base en EUR, selector
  EUR/USD/COP, primer pago total o parcial, panel de abono del resto
  (`RemainingPayment`: `PATCH /{id}/pay`, idempotente), `Mis entradas` paga
  restos con el código. Botón Adyen deshabilitado ("próximamente") hasta integrar
  la pasarela real.
