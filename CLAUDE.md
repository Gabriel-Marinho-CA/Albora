# Albora — Guia do projeto

Tema Shopify (base Dawn) com seções customizadas próprias, prefixadas com `albora`.

## Convenções

- **CSS de seção**: quando a seção tem estilo fixo, criar um arquivo em `assets/albora-<nome>.css` e carregar no topo do `.liquid` com
  `<link rel="stylesheet" href="{{ 'albora-<nome>.css' | asset_url }}" media="all">`.
- **Estilos vindos de settings** (tamanhos, cores, pesos que o lojista edita): sempre inline num `<style>` com escopo pelo id da seção — `#Albora-<Nome>-{{ section.id }}` — nunca no CSS estático, para cada instância ter valores independentes.
- **Fonte**: `Montserrat` (já importada em `albora-header.css`), com fallback `var(--font-body-family)`.
- **Variáveis de cor de referência**: primária `#06262d`, secundária `#e74f3d`.
- Nomear ids de settings em `snake_case`.
- **Settings do tipo `range`**: o Shopify valida dois pontos, sempre conferir os dois ao criar ou editar um range:
  - `(max - min) / step` deve ser **no máximo 101** (erro: `step não tem validade. As configurações do intervalo podem ter no máximo 101 etapas`) — ajustar aumentando o `step` se passar disso.
  - `default` precisa cair exatamente em um step a partir de `min`, ou seja `(default - min) / step` tem que ser um número inteiro (erro: `default precisa ser uma etapa no intervalo`) — ajustar o `default` para o múltiplo de `step` mais próximo.

## Regra de personalização de textos e botões (OBRIGATÓRIA)

Sempre que uma seção tiver **título**, **conteúdo/texto** ou **botão (CTA)**, exponha estes settings no schema:

### Textos normais (título, conteúdo)
- `..._font_size_desktop` (range, px)
- `..._font_size_mobile` (range, px)
- `..._font_weight` (select: 400 / 500 / 600 / 700)
- `..._color` (color)

### Botão (CTA)
Tudo dos textos normais, **mais**:
- `button_background` (color) — cor de fundo
- `button_height_desktop` (range, px)
- `button_height_mobile` (range, px)

Além do conteúdo editável: `title` (texto), `content` (richtext/inline_richtext), `button_label` (texto) e `button_link` (url).

### Imagens
Sempre oferecer imagem **desktop** e **mobile** separadas (`image_desktop` / `image_mobile`), trocadas por `@media`.

## Exemplo de referência
`sections/albora-nutrition-hero.liquid` — imagem `relative`, container de conteúdo `absolute` por cima, implementando todas as regras acima.
