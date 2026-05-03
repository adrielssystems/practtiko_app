# 💎 Practiiko Development Standards (The Skill)

Este documento define la infraestructura, el estilo visual y los estándares de desarrollo para la plataforma Practiiko.

## 🏗️ Infraestructura y Base de Datos
- **Gestión**: Toda modificación estructural en la base de datos es ejecutada manualmente por **Héctor Ollarves** vía **DbGate**.
- **Naming**: Se prohíbe el uso del prefijo `tiiko_`. Las tablas deben ser claras (ej: `instagram_messages`, `products`).
- **Hosting**: La aplicación corre en **Easypanel** y la base de datos en **Neon**.

## 🎨 Estilo Visual y UI/UX (Premium Pro Max)
- **Colores de Marca**:
  - Primario: `#0477BF` (Azul Practiiko)
  - CTA/Acción: `#F28705` (Naranja Practiiko)
  - Fondo: Sleek Dark Mode o Blanco Editorial con sutiles sombras.
- **Efectos**: Uso intensivo de `glassmorphism` (fondos translúcidos con desenfoque).
- **Toasts (Notificaciones)**:
  - Componente: `src/components/Toast.js`
  - Uso: Notificar éxitos (verde glass) o errores (rojo glass) de forma no intrusiva.

## 🤖 Estándar del Agente de IA
- **Modelo**: DeepSeek (vía API compatible con OpenAI).
- **Regla de Oro**: "Cero Conocimiento Interno". El bot NO sabe qué vende Practiiko hasta que consulta la herramienta `consultar_productos`.
- **Verificación Obligatoria**: Antes de dar precios o modelos, el bot DEBE llamar a la herramienta de inventario.
- **Tono**: Profesional, elegante, trato de "Usted", cierre con slogan: *"Es lujo, es simple, es Practiiko 💎"*.
- **Filtro de Echos**: Bloqueo estricto del Page ID de Practiiko para evitar bucles infinitos en Instagram y WhatsApp.

## 📱 Integración Omnicanal
- **Instagram**: Webhook directo para DMs y Comentarios.
- **WhatsApp**: Integración vía **Evolution API** mediante Webhooks.

---
*Manual actualizado el 3 de mayo de 2026.*
