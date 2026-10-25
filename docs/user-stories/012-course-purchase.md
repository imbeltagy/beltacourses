Students pay for a single course with **Stripe**.

- Access is granted only after the **webhook** confirms the payment, and webhook handling is idempotent.
- On confirmation: the course is added to the owned list, a transaction is stored, and the amount is split between the **teacher wallet** and the **system wallet** using the configured system fee.
- Failed or abandoned payments grant nothing.
