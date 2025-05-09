# Tarjetas de Prueba de Stripe para Nkripta Demo

Este documento contiene información sobre tarjetas de prueba de Stripe que pueden usarse 
con los usuarios de demostración para probar flujos de pago en Nkripta.

## Tarjetas de Prueba

| Tipo | Número | Expiración | CVC | Código Postal | Descripción |
|------|--------|------------|-----|--------------|-------------|
| Visa (Pago exitoso) | `4242 4242 4242 4242` | 12/34 | 123 | 12345 | Siempre tiene éxito y autentica sin 3D Secure |
| Visa (Requiere autenticación) | `4000 0025 0000 3155` | 12/34 | 123 | 12345 | Requiere autenticación 3D Secure |
| Visa (Pagos rechazados) | `4000 0000 0000 0002` | 12/34 | 123 | 12345 | El cargo siempre es rechazado |
| Mastercard (Pago exitoso) | `5555 5555 5555 4444` | 12/34 | 123 | 12345 | Siempre tiene éxito y autentica sin 3D Secure |
| American Express (Pago exitoso) | `3782 822463 10005` | 12/34 | 1234 | 12345 | Siempre tiene éxito y autentica sin 3D Secure |

## Usuarios de Demostración

| Nombre | Email | Organización | Cargo | Plan |
|--------|-------|--------------|-------|------|
| Carlos Martínez | carlos.martinez@techsolutions-demo.com | TechSolutions Inc. | CEO | Premium (29.99€) |
| Miguel Fernández | miguel.fernandez@innovadesign-demo.com | InnovaDesign | Director Creativo | Premium (29.99€) |
| Isabel Torres | isabel.torres@globalhealth-demo.com | Global Health Services | Directora General | Premium (29.99€) |
| Javier López | javier.lopez@techsolutions-demo.com | TechSolutions Inc. | Desarrollador Senior | Básico (9.99€) |

## Cómo Usar

1. Inicia sesión como uno de los usuarios de demostración
2. Navega a la sección de suscripciones
3. Selecciona el plan deseado
4. Utiliza una de las tarjetas de prueba para simular el pago

## Notas Importantes

- Estas tarjetas solo funcionan en modo de prueba de Stripe
- No se realizan cargos reales a estas tarjetas
- Para probar rechazos, usa la tarjeta `4000 0000 0000 0002`
- Para probar autenticación 3D Secure, usa la tarjeta `4000 0025 0000 3155`

## Errores Comunes

| Código | Mensaje | Descripción |
|--------|---------|-------------|
| `card_declined` | Su tarjeta fue rechazada | Simulación de rechazo de tarjeta |
| `expired_card` | Su tarjeta ha expirado | Simulación de tarjeta expirada |
| `incorrect_cvc` | El código de seguridad de su tarjeta es incorrecto | Simulación de CVC incorrecto |
| `processing_error` | Ocurrió un error procesando su tarjeta | Simulación de error general |

Para más información, consulta la [documentación de Stripe sobre tarjetas de prueba](https://stripe.com/docs/testing).
