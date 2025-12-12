# Entrega de plataforma eCommerce con sistema de recomendación

Este documento compila los elementos solicitados para cumplir con la tarea grupal: requisitos metodológicos, diseño de infraestructura, funcionalidades clave e integración de un sistema de recomendación basado en técnicas de *machine learning*. Está pensado para usar tecnologías web modernas (React/Vite en el frontend, API REST en el backend y servicios gestionados cuando convenga), pero puede adaptarse a otras pilas tecnológicas.

## 1. Requisitos metodológicos y estratégicos

### 1.1 Análisis de requerimientos
- **Objetivos del negocio:** aumento de ventas (uplift en conversión y ticket promedio), mejora de servicio al cliente (tiempos de respuesta y resolución), reducción de devoluciones.
- **Público objetivo:** segmentar por demografía, historial de compra, afinidad de categorías y comportamiento de navegación; definir *personas* y *journeys*.
- **Alcance funcional:** catálogo, buscador, recomendador, carrito, pagos, seguimiento de pedidos, centro de ayuda, panel administrativo.
- **Especificaciones técnicas:**
  - Frontend SPA/SSR con React/Vite o Next.js; responsive *mobile-first*.
  - Backend API REST con Node/Express o NestJS; servicios de autenticación, catálogo, carrito/pedidos, recomendaciones.
  - Base de datos relacional (PostgreSQL) para catálogo y pedidos; base orientada a documentos/clave-valor opcional para eventos y caché (Redis).
  - Integraciones: pasarela de pago (Stripe/Transbank), proveedor de email/SMS, ERP/WMS, CDN de imágenes.
  - Observabilidad: logs estructurados, métricas (Prometheus/Grafana) y trazas si aplica.

### 1.2 Diseño de experiencia de usuario (UX/UI)
- **Principios:** navegación simple por categorías, jerarquía visual clara, microcopys orientados a conversión, accesibilidad WCAG AA, formularios cortos y validados en línea.
- **Mobile-first:** grillas fluidas, imágenes optimizadas, CTA persistentes, uso de gestos comunes.
- **Flujos clave:** búsqueda con autocompletado, ficha de producto con reseñas y recomendaciones, proceso de checkout en máximo 3 pasos, seguimiento de pedidos y devoluciones.
- **Pruebas de usabilidad:** prototipos en Figma, sesiones moderadas, métricas de éxito (tasa de finalización, tiempo de tarea) y mejoras iterativas.

### 1.3 Arquitectura del sistema
- **Capas principales:**
  - **Presentación:** SPA/SSR con cacheo en CDN y precarga crítica.
  - **APIs de negocio:** catálogo, carrito/pedidos, usuarios/autenticación, recomendador, pagos (proxy seguro).
  - **Datos:** PostgreSQL para entidades maestras, Redis para sesiones/caché, almacenamiento de objetos (S3/GCS) para medios.
  - **Event streaming (opcional):** cola de eventos (Kafka/Redpanda) para alimentar analítica y modelos.
- **Seguridad:** JWT/OAuth2 para sesiones, HTTPS en todo el tráfico, cifrado de datos sensibles en reposo, hardening de cabeceras, WAF.
- **Escalabilidad:** despliegue contenedorizado (Docker), orquestación (Kubernetes o ECS), *horizontal scaling* en API y workers.

### 1.4 Implementación y desarrollo
- **Metodología:** Scrum/Kanban con sprints de 2 semanas, tablero de producto y *definition of done* (DoD) que incluya QA y seguridad.
- **Versionado y CI/CD:** Git con *feature branches*, revisiones de código, pipelines de lint/build/test y despliegue continuo a entornos dev/staging/prod.
- **Funcionalidades clave (MVP):**
  - Gestión de productos (CRUD, variantes, stock, precios y promociones).
  - Buscador con filtros y ordenamiento.
  - Recomendador (ver sección 3).
  - Carrito y checkout con integración de pagos.
  - Gestión de cuentas, direcciones y medios de pago.
  - Seguimiento de pedidos y devoluciones.
  - Panel administrativo con métricas básicas.

### 1.5 Pruebas y validación
- **Usabilidad:** pruebas con usuarios objetivo sobre prototipos y versión beta.
- **Seguridad:** pruebas de OWASP Top 10 (CSRF, XSS, inyección), *security headers*, análisis SAST/DAST en CI.
- **Calidad:** pruebas unitarias (70%+ cobertura en dominio crítico), pruebas de integración API, pruebas E2E de checkout, *performance budget* en Core Web Vitals.

### 1.6 Integración de herramientas
- **Inventario/ERP/WMS:** sincronización de stock y órdenes vía webhooks/colas; reconciliación nocturna.
- **Marketing digital:** SEO técnico (sitemaps, schema.org), campañas (UTM), píxeles de seguimiento y audiencias, email marketing con segmentación.
- **Analítica:** eventos enfront (page/product/checkout), panel de BI (Metabase/Looker Studio) con KPIs de conversión, retención y CLV.

## 2. Diseño de infraestructura tecnológica

### 2.1 Diagrama lógico (texto)
- **Cliente** → CDN → **Frontend** (React/Vite, hosting estático o SSR) → **API Gateway/Ingress** → **Servicios** (Catálogo, Pedidos, Usuarios, Recomendador) → **BD** (PostgreSQL) y **Caché** (Redis).
- **Servicios de terceros:** pasarela de pago, email/SMS, ERP/WMS.
- **Canal de eventos:** Kafka/Redpanda para clics y órdenes → **Feature Store**/**Data Lake** → **Entrenamiento** de modelos.

### 2.2 Modelo de datos mínimo (relacional)
- `products(id, name, description, price, category_id, brand, specs, image_url, stock)`
- `categories(id, name, parent_id)`
- `users(id, name, email, hashed_password, phone, address_json)`
- `orders(id, user_id, status, total_amount, payment_status, created_at)`
- `order_items(id, order_id, product_id, quantity, unit_price)`
- `events(id, user_id, product_id, type, metadata_json, created_at)` para alimentar el recomendador.

### 2.3 Servicios y endpoints sugeridos
- **Catálogo:** `GET /products`, `GET /products/:id`, `GET /categories`.
- **Carrito/Pedidos:** `POST /cart`, `POST /orders/checkout`, `GET /orders/:id`.
- **Usuarios:** `POST /signup`, `POST /login`, `GET /me`.
- **Recomendador:** `GET /recommendations?userId=...` (personalizadas) y `GET /trending`.
- **Integraciones:** webhooks de pago `/webhooks/payments`, sincronización `/erp/stock`.

## 3. Sistema de recomendación con técnicas de ML

### 3.1 Objetivo
Aumentar conversión y valor medio de pedido mostrando productos relevantes (personalización) y descubrimiento (tendencias y similares).

### 3.2 Datos y *features*
- Eventos: vistas de producto, clics en recomendaciones, adición al carrito, compras, reseñas.
- Atributos de producto: categoría, marca, precio, embeddings de texto (descripciones) o imágenes.
- Atributos de usuario: segmentos, afinidades, histórico de pedidos, ticket promedio.

### 3.3 Enfoques recomendados
- **Warm start (datos suficientes):**
  - *Collaborative filtering* implícito (ALS/BPR) sobre matriz usuario–producto.
  - Modelo de *sequential recommendations* (GRU4Rec/Transformer) si se registran sesiones.
- **Cold start:**
  - Contenido: similitud por categorías/atributos, embeddings (SBERT) sobre descripciones.
  - Popularidad/contexto: más vistos/comprados por categoría y temporada.
- **Híbrido:** combinar scores CF + contenido + popularidad con *blending* ponderado.

### 3.4 Pipeline operativo
1. **Recolección:** eventos de navegación y compras enviados a API → cola de eventos.
2. **Procesamiento:** jobs diarios (Airflow) calculan matrices, embeddings y tablas de features.
3. **Entrenamiento:** scripts en notebooks/MLFlow; validación con *offline metrics* (NDCG@K, MAP@K, Recall@K).
4. **Servir recomendaciones:**
   - Online: servicio `recommendations-service` con modelos serializados (ONNX/PyTorch) o índices de vecinos aproximados (FAISS).
   - Batch: precálculo y cacheo en Redis por usuario/categoría.
5. **Monitoreo:** CTR/CVR de bloques de recomendación, *A/B testing* con *feature flags* (e.g., GrowthBook/Unleash).

### 3.5 Ejemplos de ubicaciones de recomendación
- Home (tendencias), ficha de producto (similares y complementarios), carrito (upsell/cross-sell), post-compra (recompra), emails/SMS (retargeting personalizado).

### 3.6 Consideraciones de privacidad y cumplimiento
- Consentimiento de tracking (CMP), anonimización/pseudonimización de IDs, retención limitada de eventos, cumplimiento de GDPR/ley local.

## 4. Plan de implementación

### 4.1 Roadmap iterativo (sprints de 2 semanas)
1. **Sprint 1:** setup repo/CI/CD, arquitectura básica, diseño UX en Figma, catálogo y categorías (API + UI).
2. **Sprint 2:** autenticación y cuentas, carrito + checkout con pasarela de pagos en sandbox, observabilidad mínima.
3. **Sprint 3:** seguimiento de pedidos, panel admin básico, integraciones ERP/WMS (stock), métricas de negocio.
4. **Sprint 4:** primera versión del recomendador (popularidad + contenido), bloques de recomendación en home y PDP.
5. **Sprint 5:** modelo colaborativo/híbrido, pruebas A/B, optimización de rendimiento y hardening de seguridad.

### 4.2 Backlog de historias clave (DoR/DoD)
- **Catálogo:** como visitante quiero ver y filtrar productos por categoría/precio para encontrar opciones relevantes. DoD: listado paginado, filtros, pruebas unitarias de repositorio.
- **Checkout:** como cliente quiero pagar de forma segura con tarjeta o transferencia. DoD: integración sandbox, validación 3DS, pruebas E2E.
- **Recomendaciones:** como usuario quiero ver productos similares y personalizados. DoD: endpoint `/recommendations`, métricas CTR/Recall@10, *feature flag* habilitable.
- **Analytics:** como negocio quiero medir conversión y ticket promedio. DoD: eventos en frontend, panel en BI con KPIs básicos.

## 5. Evidencias y entregables
- **Repositorio** con código de frontend, backend y scripts de ML (notebooks + pipelines de entrenamiento/serving).
- **Informe** (Markdown/PDF) resumiendo decisiones de diseño, arquitectura, resultados de pruebas y métricas del recomendador.
- **Video de demostración** en laboratorio mostrando flujos: navegación, checkout, recomendaciones activas, panel admin y métricas.
- **Checklist de conformidad con la rúbrica:**
  - Requisitos metodológicos y estratégicos documentados y aplicados en el backlog.
  - Infraestructura tecnológica diseñada e implementada con funcionalidades alineadas al negocio.
  - Sistema de recomendación con técnicas de ML integrado y medido con métricas de negocio y offline.

## 6. Métricas de éxito
- **Producto:** conversión, ticket promedio, tasa de devolución, tiempo medio de checkout.
- **Recomendaciones:** CTR/CVR de módulos, Recall@K/NDCG@K, cobertura de catálogo, latencia de respuesta <150 ms (P95).
- **Operación:** disponibilidad (SLO 99.5%), errores 5xx, tiempo de despliegue, costo por pedido servido.

## 7. Riesgos y mitigaciones
- **Datos insuficientes:** iniciar con popularidad/contenido; capturar eventos desde el día 1.
- **Fugas de privacidad:** aplicar anonimización y consentimientos explícitos; pentesting de datos sensibles.
- **Latencia alta en recomendaciones:** precálculo y caché, índices ANN y *edge caching* para módulos públicos.
- **Fallas de pagos:** redundancia de pasarelas y reintentos idempotentes.

---

Con este material se cubren los requisitos metodológicos, el diseño de infraestructura eCommerce y la integración de un sistema de recomendación con técnicas de machine learning, alineados con la rúbrica de la tarea.
