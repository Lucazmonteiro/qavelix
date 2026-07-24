# QAVELIX — Pesquisa estratégica e roadmap global

**Data-base:** 22 de julho de 2026  
**Escopo:** ferramentas online gratuitas, público global, inglês como idioma inicial  
**Decisão central:** construir primeiro um *cluster* de mídia leve (vídeo + imagem), adicionar utilitários locais de altíssima margem e só então entrar no núcleo PDF. Não tentar ser “mais um TinyWow” com dezenas de páginas rasas.

---

## 1. Resumo executivo

O QAVELIX não deve começar pelo maior volume bruto. “PDF to Word” tem cerca de 4–5 milhões de buscas mensais nas bases públicas consultadas, mas enfrenta Adobe, iLovePDF, Smallpdf e PDF24, domínios com anos de autoridade, milhares de páginas e milhões de links/visitas. Começar por essa consulta seria caro, lento e tecnicamente arriscado.

A sequência recomendada é:

1. **Completar o trabalho do usuário de vídeo:** compress, trim, mute, extract audio, change speed e GIF. Isso aproveita o produto e a intenção já existentes.
2. **Criar um cluster de imagem totalmente no navegador:** compress, resize, crop, conversões modernas, metadata remover e “resize to KB”. É rápido, barato, privado e internacional.
3. **Publicar ferramentas utilitárias recorrentes:** QR, password, word counter, case converter, timestamp/time-zone e JSON. Elas custam quase zero por uso e formam inventário SEO sem custo de processamento.
4. **Entrar em PDF pelo browser/local-first:** merge, split, rotate, remove/reorder pages, JPG↔PDF e protect/unlock. Depois, compress e Office/OCR somente quando infraestrutura, qualidade e confiança estiverem comprovadas.
5. **Monetizar com assinatura e créditos, não depender de AdSense.** O dado público mais importante é o modelo do iLovePDF: 80–90% da receita teria vindo de Premium, principalmente empresas. Anúncio é complemento, não tese de negócio.

### Meta realista, não promessa

Sem dados do Search Console do domínio, backlinks, países ou qualidade atual, não é honesto prometer tráfego. Um cenário de planejamento após 18 meses, com 50 ferramentas excelentes, conteúdo localizado e links reais:

| Cenário | Sessões orgânicas/mês | RPM líquido de anúncios | Receita de anúncios | Conversão paga | ARPU pago | Receita paga | Total/mês |
|---|---:|---:|---:|---:|---:|---:|---:|
| Conservador | 100 mil | US$ 2 | US$ 200 | 0,10% | US$ 6 | US$ 600 | **US$ 800** |
| Base | 500 mil | US$ 3 | US$ 1.500 | 0,20% | US$ 7 | US$ 7.000 | **US$ 8.500** |
| Forte | 2 milhões | US$ 4 | US$ 8.000 | 0,30% | US$ 8 | US$ 48.000 | **US$ 56.000** |

São cenários matemáticos, não previsões. O valor depende principalmente de ranking, geografia, repetição de uso e conversão — não do número de ferramentas publicadas.

---

## 2. Método, fontes e limites

Foram combinados:

- páginas oficiais de produto e preço dos concorrentes;
- dados públicos de Ahrefs e Clicks.so para termos e domínios;
- Similarweb para sinais de escala e distribuição;
- resultados atuais do Google e páginas que os buscadores destacam;
- relatos públicos no Reddit e avaliações especializadas para fricções de produto;
- observação de arquitetura, oferta, limites, modelos Premium/API e posicionamento.

**Importante:** Ahrefs, Semrush, Similarweb e Google Ads usam bases e metodologias diferentes. A maior parte dos dados completos é paga. Por isso, este relatório usa números públicos como **ordens de grandeza**. CPC baixo em uma consulta global não significa RPM baixo em todos os países; volume global não é tráfego capturável; páginas diferentes podem canibalizar a mesma intenção.

### Evidência quantitativa principal

- Ahrefs expõe aproximadamente: “pdf to word” 4,0 M; “word to pdf” 2,5 M; “merge pdf” 1,7 M; “compress pdf” 1,6 M buscas/mês.
- Clicks.so mostra, para iLovePDF: “pdf to word” 5,0 M (KD 60), “merge pdf” 2,24 M (KD 36), “compress pdf” 1,83 M (KD 58). As diferenças confirmam a escala e também a imprecisão inevitável.
- iLovePDF declarou 16,5 milhões de documentos processados diariamente em sua página de preços; matéria do *El País* citou 150 milhões de visitas em outubro de 2024 e 80–90% da receita em Premium.
- FreeConvert aparece com cerca de 5,2 milhões de tráfego orgânico estimado, 618 mil palavras-chave e 4,4 mil domínios de referência na página pública consultada. Seus conversores de fuso horário surgem entre os maiores termos — evidência de que utilitários adjacentes podem superar conversores de arquivo.
- Remove.bg mostra um cluster enorme em “change background” (variações estimadas em 450–550 mil/mês, KD frequentemente 20–38), enquanto o termo explícito “remove background from image” aparece com 135 mil e KD 70. A oportunidade é a intenção específica, não copiar a head keyword.

---

## 3. O que os concorrentes ensinam

| Concorrente | Oferta e páginas em destaque | Monetização | Força | Fraqueza / oportunidade para QAVELIX |
|---|---|---|---|---|
| **TinyWow** | Catálogo amplo: PDF, imagem, vídeo, texto e IA; diretório pesquisável | Gratuito/ad-free declarado; captura de distribuição | Cobertura enorme e linguagem simples | Marca pouco especializada; catálogo amplo favorece páginas medianas. Vencer com qualidade, privacidade e fluxos integrados |
| **Smallpdf** | Compress, convert, merge, split, OCR, sign e editor; forte destaque a compress/conversão | Freemium, Pro, Teams e Business | UX, marca, mobile/desktop, confiança | Limites diários e paywall geram fricção; oportunidade em tarefas locais ilimitadas |
| **iLovePDF** | Suite PDF completa; merge, split, compress, Office, OCR, sign, redact, forms, AI | US$ 5/mês anual no momento da pesquisa; Business; API; poucos anúncios | Escala, localização, preço, desktop/mobile, confiança | Entrar de frente é má estratégia; atacar tarefas long-tail e local-first |
| **CloudConvert** | Mais de 200 formatos e API; documentos, imagens, áudio, vídeo, arquivos | Uso por créditos e volume | Qualidade, API e breadth | Experiência genérica e custo por processamento; QAVELIX pode especializar fluxos cotidianos |
| **FreeConvert** | Conversão de arquivos, compressão e utilitários como fusos | Ads + planos/limites | Cobertura programática, alcance global | Muitas páginas e experiência carregada; ganhar com velocidade e consistência |
| **Compress2Go / PDF2Go** | Compressão de PDF, imagem, vídeo; ecossistema de conversão | Ads + Premium | Clusters SEO bem interligados | Interface promocional e sobreposição entre marcas; oportunidade em transparência |
| **Ezgif** | GIF maker, resize, crop, optimize, video-to-GIF | Ads | Ferramentas profundas, reputação, utilidade | Visual antigo e fluxo fragmentado; oportunidade em mobile UX e presets sociais |
| **Squoosh** | Compressão/conversão de imagem no navegador com comparação visual | Gratuito | Privacidade, velocidade, controle de codecs | Quase sem suite, conta ou monetização; QAVELIX pode unir simplicidade + batch + histórico local |
| **iLoveIMG** | Compress, resize, crop, convert, remove background, watermark, meme | Freemium conjunto com iLovePDF | Marca, integração e localização | Limites; QAVELIX pode oferecer processamento local e tamanho-alvo preciso |
| **PDF24** | Suite PDF muito ampla online + Creator Windows | Gratuito ilimitado, financiado por anúncios | Funcionalidade e custo, modo offline | UX inconsistente e desktop só Windows; browser-first polido é o ângulo |
| **Canva** | Design, documentos, vídeo, templates e IA | Freemium/Teams/Enterprise | Retenção, templates, colaboração, distribuição | Produto pesado para tarefa única; QAVELIX deve ser “resultado em 20 segundos” |
| **VEED** | Editor, captions, resize, compress, AI, dubbing e geração | Freemium com créditos; planos pagos | Fluxos de creator e alto valor percebido | Free limitado e custo; oportunidade em microtarefas rápidas sem editor completo |
| **Adobe Express/Acrobat** | Design rápido e PDF; compress/merge/convert recebem grande destaque | Freemium e Creative Cloud/Acrobat | Autoridade, qualidade e ecossistema | Login/upsell/complexidade; oportunidade em anonimato e imediatismo |
| **Fotor** | Editor de foto, colagem, AI enhance/generate/remove BG | Freemium/créditos | Ferramentas AI e templates | Upsell agressivo e produto amplo; foco em utilidade previsível |
| **Pixelcut** | Fotos de produto, background, upscale, shadows e batch | Assinatura/créditos | Forte intenção e-commerce | Custo de IA; oportunidade em utilitários não generativos para marketplaces |
| **Remove.bg** | Remoção e troca de fundo, plugins e API | Créditos/API e assinatura | Especialização, qualidade e distribuição B2B | Head term difícil e custo por imagem; atacar “white background for marketplace/passport” |
| **Online-Convert / Convertio / Kapwing / Sejda** | Formatos amplos, creator suite e PDF | Freemium, ads, créditos | Cobertura e autoridade | Confirma que conversão genérica virou commodity; diferenciação deve ser fluxo, privacidade ou precisão |

### Padrões observados

1. **As homepages destacam tarefas, não formatos abstratos.** “Compress PDF” e “PDF to Word” vencem “PDF tools”.
2. **Especialistas vencem em percepção:** remove.bg e Ezgif são lembrados por uma tarefa; agregadores vencem por cobertura SEO. QAVELIX precisa primeiro ser especialista em “make media smaller/ready to share”.
3. **Premium funciona quando há repetição, batch, limites e workflow de equipe.** Uma calculadora de idade raramente converte assinatura.
4. **Privacidade é uma dor concreta.** Comunidades criticam uploads, cookies e tracking. Processar localmente é benefício verificável, não slogan.
5. **Ferramenta grátis é aquisição; API, batch, histórico, armazenamento e automação são produto pago.**

---

## 4. Avaliação franca das ideias originais

### Texto

**Boa como cluster barato; ruim como prioridade isolada.** Maiúsculas, minúsculas, Title Case, Sentence Case, alternar, remover espaços e linhas devem ser uma única ferramenta “Case Converter & Text Cleaner”, com URLs/sections indexáveis apenas quando houver intenção diferente. Criar uma página quase idêntica para cada botão é conteúdo raso e risco de canibalização.

- **Excelente:** word/character counter enriquecido com reading time, sentence/paragraph count, keyword density e limites de redes sociais.
- **Boa:** fancy text/font generator, porque tem compartilhamento e uso social; monetização é fraca e concorrência alta.
- **Fraca/ambígua:** “centralizar, alinhar e justificar texto” sem um formato de saída. Espaços não mantêm alinhamento em fontes proporcionais. Só faz sentido como *text-to-image/HTML formatter* com caso de uso explícito.

### Emojis

**Útil, mas não produto principal.** Uma página genérica de copiar emojis enfrenta Emojipedia, sistemas nativos e SERPs com resposta direta. Só publicar após existir distribuição, com long-tails úteis: combinações, significado, “emoji for Discord/Slack/Instagram”, favoritos locais e busca multilíngue. Nota: tráfego potencial razoável; receita e retenção baixas.

### Imagem

**Melhor cluster inicial.** PNG/JPG/WebP/AVIF/HEIC, compress, resize, crop e rotate compartilham pipeline e podem rodar no navegador. “Convert image” genérico deve coexistir com landing pages por par de formatos, sem criar todas as combinações automaticamente: publicar apenas pares com demanda e conteúdo útil.

- Priorizar **HEIC to JPG, WebP to JPG/PNG, JPG to WebP, image compressor, resize image, resize to KB e remove metadata**.
- SVG e GIF exigem tratamento próprio; SVG é vetor e conversões podem introduzir riscos de segurança. Não prometer equivalência perfeita.
- Remoção de fundo é atraente, mas não é “fácil”: qualidade e custo de inferência decidem o produto.

### PDF

**Excelente mercado; péssimo primeiro ataque às head keywords.** Merge, split, rotate, reorder, remove pages, JPG to PDF, PDF to JPG, protect e unlock são viáveis no browser. PDF to Word, Word to PDF, OCR e compressão avançada têm demanda enorme, mas qualidade é a barreira. Devem vir depois.

“Unlock PDF” só deve remover a senha quando o usuário a conhece/permissão é declarada; não construir quebra de senha.

### Vídeo

**É a vantagem atual do QAVELIX.** Expandir imediatamente para trim, mute/remove audio, extract audio, resize/change resolution, change speed e video-to-GIF. Conversão universal MP4/MOV/AVI/MKV é cara em CPU e armazenamento e cria suporte infinito; oferecer primeiro MP4/MOV/WebM e presets úteis. Merge vem depois de trim devido a codecs incompatíveis.

### Áudio

**Boa adjacência, prioridade média.** MP3/WAV/M4A/OGG e trim/compress têm pipeline conhecido. AAC/FLAC são úteis, mas menor prioridade. A página precisa deixar claras qualidade, bitrate e privacidade. Evitar qualquer posicionamento de baixar/converter conteúdo protegido de plataformas.

### Planilhas prontas

**Projeto separado.** Templates são produto editorial/distribuição, não utilitário transacional. Exigem screenshots, instruções, versões Google Sheets/Excel, atualização por país e intenção de download. Misturá-los dilui a arquitetura temática do QAVELIX e cria risco de malware/confiança. Criar uma marca/domínio ou subdomínio separado apenas após o core chegar a tração. Dentro do QAVELIX, no máximo calculadoras exportáveis para CSV.

### Calculadoras

**Selecionar, não copiar catálogo.** Porcentagem e unit converter são globais, rápidos e bons para interlink; idade é commodity e monetiza pouco. IMC é YMYL/saúde e exige revisão, fontes e disclaimers. Salário e impostos são localizados, mudam com legislação e elevam risco editorial — não devem entrar no roadmap global inicial. Juros/empréstimo têm CPC/intenção maiores, mas precisam fórmulas transparentes e localização.

---

## 5. Oportunidades e low-hanging fruits

### Oportunidades subexploradas

| Oportunidade | Por que é defensável | Monetização |
|---|---|---|
| **Resize image to exact KB/MB** | Resolve limites de upload de governo, vagas e marketplaces; fluxo mais específico que “compress image” | Ads + batch Premium |
| **Client-side/private tools** | Benefício forte para documentos pessoais; custo de servidor menor | Premium por batch/PWA/offline |
| **Marketplace image presets** | “Amazon/Etsy/Shopify white background + dimensions + size” combina várias tarefas | Afiliados/e-commerce plan |
| **Metadata/EXIF remover + viewer** | Dor de privacidade real e implementação barata | Ads; bundle privacy |
| **Social media video preset workflows** | Não apenas resize: limite, aspect ratio, duração e codec por plataforma | Creator subscription |
| **Batch browser processing** | Muitos concorrentes bloqueiam batch no plano pago; diferencial operacional | Limite grátis + Premium |
| **Time-zone pair pages** | Evidência pública de tráfego forte no FreeConvert e CPC maior que muitos conversores | Ads; calendário futuro |
| **PDF page operations local-first** | Sensibilidade dos documentos e baixa necessidade de servidor | Premium/offline/team |
| **Compress to email/platform limit** | Resultado orientado a tarefa (“under 25 MB”), não controle técnico | Ads + Premium |
| **Accessible output presets** | Alt-text helper, contrast/color tools e document checks podem formar cluster menos commodity | B2B/team no futuro |

### Low-hanging fruits: 1–5 dias cada, se o design system já existir

Case converter/cleaner, word counter, character/social limits, remove duplicate lines, sort lines, slug generator, password generator, UUID generator, QR generator, Unix timestamp, JSON formatter, Base64 encode/decode, color converter, aspect-ratio calculator, percentage calculator, unit converter, image metadata viewer/remover, rotate/flip image, crop image e image resize.

“Poucos dias” descreve implementação funcional; não garante ranking. Cada página ainda exige testes, conteúdo próprio, schema válido, performance, internacionalização e links.

---

## 6. Matriz de priorização

### Fórmula

Notas de 0 a 10. **Final = 25% SEO + 20% monetização + 15% facilidade + 10% velocidade + 10% retenção + 5% viral + 5% valor percebido + 10% internacional.** Em “tempo”, 10 significa rápido. A fórmula favorece aquisição, receita e capacidade de entregar sem ignorar retenção.

Legenda de demanda: **VH** >1 M; **H** 100k–1 M; **M** 10k–100k; **L** <10k ou intenção fragmentada. São faixas de cluster globais, não volumes exatos.

| # | Ferramenta | Demanda | SEO | Mon. | Fácil | Tempo | Ret. | Viral | Valor | Intl. | Final |
|---:|---|:---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| 1 | Video Compressor (aperfeiçoar) | H | 8 | 8 | 7 | 8 | 7 | 5 | 9 | 10 | **7,9** |
| 2 | Image Compressor | H | 8 | 7 | 9 | 9 | 7 | 4 | 8 | 10 | **8,0** |
| 3 | Image Resizer | H | 8 | 7 | 9 | 9 | 7 | 4 | 8 | 10 | **8,0** |
| 4 | Resize Image to KB/MB | M–H | 9 | 7 | 8 | 8 | 7 | 4 | 9 | 10 | **8,1** |
| 5 | HEIC to JPG | H | 8 | 7 | 8 | 8 | 6 | 3 | 8 | 10 | **7,6** |
| 6 | WebP to JPG | H | 8 | 6 | 9 | 9 | 6 | 3 | 7 | 10 | **7,6** |
| 7 | JPG/PNG to WebP | M–H | 8 | 7 | 9 | 9 | 7 | 3 | 8 | 10 | **7,9** |
| 8 | Video Trimmer | H | 8 | 8 | 7 | 7 | 7 | 5 | 9 | 10 | **7,8** |
| 9 | Extract Audio from Video | H | 8 | 7 | 8 | 8 | 7 | 4 | 8 | 10 | **7,8** |
| 10 | Video to GIF | H | 8 | 7 | 7 | 7 | 7 | 8 | 8 | 10 | **7,7** |
| 11 | Word & Character Counter | H | 8 | 4 | 10 | 10 | 8 | 2 | 6 | 10 | **7,5** |
| 12 | QR Code Generator | H | 8 | 6 | 9 | 9 | 7 | 6 | 8 | 10 | **7,8** |
| 13 | Case Converter & Cleaner | M–H | 7 | 3 | 10 | 10 | 6 | 3 | 6 | 10 | **7,1** |
| 14 | Image Crop/Rotate/Flip | H | 7 | 6 | 9 | 9 | 6 | 4 | 7 | 10 | **7,3** |
| 15 | Remove Image Metadata | M | 8 | 6 | 9 | 9 | 6 | 4 | 8 | 10 | **7,7** |
| 16 | Change Video Resolution/Aspect | M–H | 8 | 8 | 7 | 7 | 8 | 5 | 9 | 10 | **7,9** |
| 17 | Mute Video / Remove Audio | M–H | 8 | 7 | 8 | 8 | 6 | 4 | 8 | 10 | **7,7** |
| 18 | Video Speed Changer | M–H | 7 | 7 | 7 | 7 | 7 | 6 | 8 | 10 | **7,3** |
| 19 | Merge PDF (local-first) | VH | 8 | 9 | 7 | 7 | 8 | 3 | 9 | 10 | **8,1** |
| 20 | Split PDF | H–VH | 8 | 9 | 7 | 7 | 8 | 3 | 9 | 10 | **8,1** |
| 21 | JPG to PDF | VH | 8 | 8 | 8 | 8 | 7 | 3 | 8 | 10 | **8,0** |
| 22 | PDF to JPG/PNG | H | 8 | 8 | 7 | 7 | 7 | 3 | 8 | 10 | **7,7** |
| 23 | Rotate/Reorder/Delete PDF Pages | M–H | 8 | 8 | 8 | 8 | 7 | 3 | 8 | 10 | **7,9** |
| 24 | Protect PDF | M–H | 7 | 8 | 7 | 7 | 7 | 2 | 8 | 10 | **7,4** |
| 25 | Unlock PDF with known password | H | 8 | 8 | 7 | 7 | 6 | 2 | 8 | 10 | **7,5** |
| 26 | MP4 to MP3 | H | 8 | 7 | 8 | 8 | 6 | 4 | 8 | 10 | **7,7** |
| 27 | Audio Converter (MP3/WAV/M4A/OGG) | H | 8 | 7 | 7 | 7 | 7 | 3 | 8 | 10 | **7,5** |
| 28 | Audio Trimmer | H | 7 | 7 | 8 | 8 | 7 | 4 | 8 | 10 | **7,5** |
| 29 | Audio Compressor / target MB | M | 8 | 7 | 7 | 7 | 6 | 3 | 8 | 10 | **7,4** |
| 30 | GIF Compressor/Optimizer | H | 8 | 7 | 7 | 7 | 6 | 6 | 8 | 10 | **7,6** |
| 31 | GIF Resizer/Cropper | M–H | 7 | 6 | 7 | 7 | 6 | 5 | 7 | 10 | **7,0** |
| 32 | Video Merger | H | 7 | 8 | 5 | 5 | 7 | 5 | 9 | 10 | **7,0** |
| 33 | Video Converter (MP4/MOV/WebM) | VH | 7 | 8 | 5 | 5 | 7 | 4 | 9 | 10 | **6,9** |
| 34 | Compress PDF | VH | 8 | 9 | 5 | 5 | 8 | 2 | 9 | 10 | **7,5** |
| 35 | PDF to Word | VH | 7 | 10 | 3 | 3 | 8 | 2 | 10 | 10 | **7,0** |
| 36 | Word to PDF | VH | 7 | 9 | 4 | 4 | 7 | 2 | 9 | 10 | **6,9** |
| 37 | OCR PDF/Image to Text | H | 8 | 9 | 4 | 4 | 8 | 3 | 10 | 10 | **7,3** |
| 38 | Background Remover | H–VH | 7 | 9 | 4 | 4 | 7 | 8 | 10 | 10 | **7,3** |
| 39 | Change Background to White | H | 9 | 9 | 5 | 5 | 7 | 7 | 10 | 10 | **7,8** |
| 40 | Upscale Image | H | 7 | 9 | 4 | 4 | 6 | 7 | 9 | 10 | **7,0** |
| 41 | Time Zone Converter | H | 9 | 7 | 8 | 8 | 8 | 3 | 8 | 10 | **8,0** |
| 42 | Unix Timestamp Converter | M–H | 8 | 5 | 10 | 10 | 8 | 2 | 7 | 10 | **7,7** |
| 43 | Unit Converter | VH | 7 | 5 | 8 | 8 | 7 | 2 | 7 | 10 | **7,1** |
| 44 | Percentage Calculator | H | 7 | 5 | 10 | 10 | 6 | 2 | 7 | 10 | **7,4** |
| 45 | Loan/Interest Calculator | H | 7 | 9 | 8 | 8 | 6 | 2 | 9 | 8 | **7,6** |
| 46 | JSON Formatter/Validator | H | 8 | 5 | 9 | 9 | 8 | 2 | 8 | 10 | **7,6** |
| 47 | Password Generator | H | 7 | 4 | 10 | 10 | 7 | 2 | 7 | 10 | **7,3** |
| 48 | Fancy Text Generator | H | 7 | 4 | 8 | 8 | 6 | 9 | 7 | 10 | **7,1** |
| 49 | Emoji Copy/Search | H | 6 | 3 | 8 | 8 | 6 | 7 | 5 | 10 | **6,5** |
| 50 | Age Calculator | H | 6 | 4 | 10 | 10 | 4 | 2 | 6 | 10 | **6,8** |

Uma nota alta não define sozinha a ordem: dependências, autoridade temática e reaproveitamento de infraestrutura também contam. Por isso Merge PDF aparece depois do cluster de mídia, embora sua nota seja alta.

---

## 7. Roadmap oficial: ordem de construção

Estimativas consideram um engenheiro full-stack experiente, design system e pipeline básico existentes. “Dev” é esforço de produto inicial, não inclui meses de SEO. Receita é potencial relativo: **A** alta assinatura/API; **B** ads + algum Premium; **C** principalmente aquisição/ads.

| Ordem | Ferramenta | Motivo estratégico | SEO | Receita | Dev | Prioridade |
|---:|---|---|:---:|:---:|---:|:---:|
| 1 | Video Compressor v2 | Produto existente; melhorar qualidade, presets e conversão | 8 | A | 1–2 sem | P0 |
| 2 | Image Compressor | Cluster adjacente, barato e global | 8 | B | 3–5 d | P0 |
| 3 | Image Resizer | Reuso do pipeline; intenção enorme | 8 | B | 3–5 d | P0 |
| 4 | Resize Image to KB/MB | Long-tail orientada a resultado | 9 | B | 3–5 d | P0 |
| 5 | HEIC to JPG | Dor clara de usuários Apple | 8 | B | 3–5 d | P0 |
| 6 | WebP to JPG | Alta utilidade e implementação simples | 8 | B | 2–4 d | P0 |
| 7 | JPG/PNG to WebP | Completa cluster moderno | 8 | B | 2–4 d | P0 |
| 8 | Video Trimmer | Adjacência natural e bom upsell | 8 | A | 1 sem | P0 |
| 9 | Extract Audio from Video | Reuso de FFmpeg; forte intenção | 8 | B | 3–5 d | P0 |
| 10 | Video to GIF | Compartilhável e liga a GIF tools | 8 | B | 4–7 d | P0 |
| 11 | QR Code Generator | Custo zero; retorno e links | 8 | B | 2–4 d | P1 |
| 12 | Word & Character Counter | Aquisição barata e recorrente | 8 | C | 2–4 d | P1 |
| 13 | Case Converter & Cleaner | Consolidar todas as ideias de case | 7 | C | 2–3 d | P1 |
| 14 | Crop/Rotate/Flip Image | Completa fluxo de imagem | 7 | B | 3–5 d | P1 |
| 15 | Metadata Viewer/Remover | Diferencial privacy-first | 8 | B | 3–5 d | P1 |
| 16 | Change Video Resolution/Aspect | Presets sociais elevam valor | 8 | A | 1 sem | P1 |
| 17 | Mute Video | Microtarefa forte e barata | 8 | B | 3–5 d | P1 |
| 18 | Video Speed Changer | Retenção no cluster creator | 7 | B | 4–7 d | P1 |
| 19 | Merge PDF local-first | Primeiro ataque PDF, menor risco | 8 | A | 1–2 sem | P1 |
| 20 | Split PDF local-first | Mesma base e alto uso | 8 | A | 1 sem | P1 |
| 21 | JPG to PDF | Demanda massiva; pipeline conhecido | 8 | A | 1 sem | P1 |
| 22 | PDF to JPG/PNG | Fecha fluxo imagem/PDF | 8 | A | 1 sem | P1 |
| 23 | PDF Page Organizer | Rotate/reorder/delete em uma UX | 8 | A | 1–2 sem | P1 |
| 24 | Protect PDF | Valor profissional e privacy | 7 | A | 4–7 d | P2 |
| 25 | Unlock PDF (senha conhecida) | Demanda forte, guardrails legais | 8 | A | 4–7 d | P2 |
| 26 | MP4 to MP3 | Ponte vídeo-áudio | 8 | B | 3–5 d | P2 |
| 27 | Audio Converter | Novo cluster com mesma infraestrutura | 8 | B | 1 sem | P2 |
| 28 | Audio Trimmer | Workflow completo | 7 | B | 3–5 d | P2 |
| 29 | Audio Compressor to MB | Long-tail orientada a upload | 8 | B | 4–7 d | P2 |
| 30 | GIF Compressor | Continuidade de Video to GIF | 8 | B | 4–7 d | P2 |
| 31 | GIF Resizer/Cropper | Reuso e retenção | 7 | B | 4–7 d | P2 |
| 32 | Video Merger | Alto valor, maior complexidade codec | 7 | A | 2 sem | P2 |
| 33 | Video Converter MP4/MOV/WebM | Expandir formatos com controle de custo | 7 | A | 2–3 sem | P2 |
| 34 | Compress PDF | Só após tráfego e benchmark de qualidade | 8 | A | 2–4 sem | P2 |
| 35 | PDF to Word | Demanda máxima, qualidade/licença crítica | 7 | A+ | 4–8 sem | P3 |
| 36 | Word to PDF | Conversão de Office exige fidelidade | 7 | A | 3–6 sem | P3 |
| 37 | OCR PDF/Image | Alto valor; cobrar por página/crédito | 8 | A+ | 3–6 sem | P3 |
| 38 | Background Remover | Só com benchmark e unit economics | 7 | A+ | 3–6 sem | P3 |
| 39 | Change Background to White | Melhor long-tail/e-commerce que head term | 9 | A+ | 1–2 sem* | P3 |
| 40 | Image Upscaler | Bom Premium, custo de GPU | 7 | A+ | 3–6 sem | P3 |
| 41 | Time Zone Converter | Evidência competitiva de tráfego | 9 | B | 1 sem | P3 |
| 42 | Unix Timestamp Converter | Dev audience e repetição | 8 | C | 1–2 d | P3 |
| 43 | Unit Converter | Grande superfície de busca programática | 7 | B | 1–2 sem | P3 |
| 44 | Percentage Calculator | Simples, global, interlink | 7 | B | 1–2 d | P3 |
| 45 | Loan/Interest Calculator | CPC/intenção melhores; fórmulas claras | 7 | A | 3–5 d | P3 |
| 46 | JSON Formatter/Validator | Retenção e custo zero | 8 | C | 2–4 d | P3 |
| 47 | Password Generator | Privacy/local-first, commodity | 7 | C | 1–2 d | P4 |
| 48 | Fancy Text Generator | Viral/social, baixa receita | 7 | C | 3–5 d | P4 |
| 49 | Emoji Copy/Search | SERP difícil e pouco valor comercial | 6 | C | 1 sem | P4 |
| 50 | Age Calculator | Commodity; apenas para completar cluster | 6 | C | 1–2 d | P4 |

\* Depois de Background Remover.

### Fases e gates

**Fase 1 — Fundamento e mídia (1–10; 6–10 semanas).** Avançar quando: taxa de sucesso >98%; p95 de início de processamento <2 s; custo variável conhecido; 10%+ dos usuários usam outra ferramenta; primeiras páginas indexadas sem problemas técnicos.

**Fase 2 — Imagem/utilidades/PDF local (11–25; 10–14 semanas).** Avançar quando: pelo menos 5 páginas recebem impressões crescentes por 8 semanas; Core Web Vitals passam; taxa de tarefa concluída >70%; 2%+ capturam bookmark/PWA/email sem dark patterns.

**Fase 3 — Áudio/GIF/vídeo e PDF compression (26–34; 10–16 semanas).** Avançar quando: receita por mil sessões cobre pelo menos 3× o custo variável; usuários recorrentes >15% em 30 dias; limites Premium testados.

**Fase 4 — Conversão complexa e IA (35–40; 4–8 meses).** Só construir se cada ferramenta tiver benchmark contra 3 líderes, margem bruta projetada >70% no plano pago e taxa de conversão/qualidade aceitável.

**Fase 5 — expansão de superfície SEO (41–50; 8–12 semanas).** Publicar de maneira curada. Não gerar milhares de páginas sem volume, conteúdo e diferenciação.

---

## 8. Produto, SEO e monetização

### Posicionamento recomendado

> **QAVELIX — Fast, private tools that finish the job.**  
> Process locally whenever possible. No account for basic tasks. Exact-size presets. Batch and automation when you need more.

### Arquitetura

- `/video/compress`, `/video/trim`, `/image/compress`, `/pdf/merge`, `/text/case-converter`;
- breadcrumbs e hubs por cluster;
- uma URL por intenção real, não por botão;
- landing pages de pares de formato somente quando houver demanda e comportamento distinto;
- processamento local indicado com prova (“your file never leaves this device”); servidor indicado com retenção e região;
- inglês em `/` inicialmente; ao localizar, usar `/es/`, `/pt/`, `/de/`, `/fr/`, `/id/`, `/hi/` + `hreflang` e tradução humana/revisada.

### Página ideal de ferramenta

H1 igual à tarefa; uploader/entrada acima da dobra; promessa e limite claros; sem login antes do resultado; presets de caso de uso; comparação antes/depois; FAQ baseada em dúvidas reais; exemplos; privacidade; links para próximo passo; schema `WebApplication`/`SoftwareApplication` apenas quando fiel; conteúdo único, curto e útil.

### Modelo de receita

**Free:** tarefa única, limites generosos, sem cadastro, anúncios leves fora da área de trabalho.  
**Pro US$ 6–9/mês anual:** sem anúncios, batch, arquivos maiores, fila prioritária, histórico opcional, presets, processamento mais rápido.  
**Credits:** OCR, background removal, upscale e conversão cara.  
**API:** compress/convert/resize/OCR com preço por unidade e volume.  
**Teams:** workspace, billing, retention policy, SSO mais tarde.  
**Afiliados:** hospedagem/CDN, storage, design e e-commerce somente em contexto; nunca degradar a ferramenta.

Não colocar AdSense antes de validar velocidade e confiança. Uploads e documentos sensíveis pedem uma política de privacidade excepcionalmente clara. Nunca usar arquivos para treinamento sem consentimento explícito.

### Métricas que governam o roadmap

- impressões, posição e CTR por página/país;
- task-start, task-success, download e tempo até resultado;
- custo por processamento e margem por ferramenta;
- tool-to-tool continuation rate;
- retorno D7/D30 e PWA/bookmark;
- conversão Free→Pro e créditos;
- páginas indexadas, canibalização e links por cluster;
- reclamações de qualidade/privacidade por mil tarefas.

Matar ou fundir ferramenta que, após 6 meses e promoção/interlink adequados, não tenha impressões crescentes, uso direto ou contribuição para conversão. Não manter páginas apenas para dizer que há “50 ferramentas”.

---

## 9. Riscos e decisões que não devem ser adiadas

1. **Custos de vídeo:** limitar duração/tamanho, fazer estimativa antes do upload, apagar arquivos automaticamente e medir custo por codec.
2. **Licenças/codecs:** revisar FFmpeg, Ghostscript, LibreOffice e bibliotecas; distribuição e SaaS têm obrigações diferentes.
3. **Privacidade:** data retention curta, criptografia, regiões, logs sem conteúdo, DPA e exclusão verificável.
4. **Abuso:** malware, conteúdo ilegal, decompression bombs, SSRF em URL imports e arquivos manipulados.
5. **Qualidade Office/PDF:** não lançar “PDF to Word” medíocre para capturar volume; destrói confiança do domínio.
6. **SEO programático:** páginas combinatórias sem valor podem não indexar ou contaminar qualidade do site.
7. **YMYL:** impostos, salário, saúde e investimento exigem revisão por país e atualização contínua; ficam fora da primeira expansão.

---

## 10. Fontes consultadas

- [Ahrefs — visão pública do PDF2Go e volumes](https://ahrefs.com/websites/pdf2go.com)
- [Clicks.so — iLovePDF: termos, volume, dificuldade e CPC](https://resources.clicks.so/top-websites/ilovepdf.com)
- [Clicks.so — FreeConvert: tráfego, keywords e fusos](https://resources.clicks.so/top-websites/freeconvert.com)
- [Clicks.so — Remove.bg: background terms](https://resources.clicks.so/top-websites/remove.bg)
- [Similarweb — metodologia do Traffic Checker](https://www.similarweb.com/website/)
- [Similarweb — AI traffic do iLovePDF](https://www.similarweb.com/ai-traffic/ilovepdf.com/)
- [iLovePDF — preços, limites e ferramentas](https://www.ilovepdf.com/pricing)
- [Smallpdf — preços e recursos](https://smallpdf.com/pricing)
- [CloudConvert — formatos e modelo](https://cloudconvert.com/)
- [TinyWow — catálogo](https://tinywow.com/tools)
- [PDF24 — catálogo, modelo gratuito e privacidade](https://tools.pdf24.org/en/)
- [VEED — ferramentas e preços](https://www.veed.io/pricing)
- [Remove.bg — API](https://www.remove.bg/a/api-docs)
- [El País — escala e composição de receita do iLovePDF](https://elpais.com/eps/2024-12-04/marco-grossi-el-hombre-detras-del-exito-de-ilovepdf.html)
- [TechRadar — avaliação de PDF compressors](https://www.techradar.com/best/best-pdf-compressor)
- [Reddit — crítica a tracking/cookies em ferramentas de arquivo](https://www.reddit.com/r/YouShouldKnow/comments/1rjifb9/ysk_that_free_file_converter_websites_like/)
- [Reddit — demanda por PDF local-first](https://www.reddit.com/r/SideProject/comments/1tdw74u/i_built_a_free_pdf_tool_site_and_made_a_video/)

---

## Conclusão

O caminho vencedor não é publicar 50 ferramentas simultaneamente. É conquistar uma promessa: **QAVELIX transforma arquivos rapidamente, com privacidade e resultado exato**. O compressor de vídeo dá o ponto de partida; imagem dá velocidade e margem; PDF dá escala e assinatura quando o domínio estiver pronto; IA dá receita apenas quando a economia unitária fechar.

A ordem da seção 7 é o roadmap oficial recomendado. Reavaliar a cada seis semanas com dados do Search Console, analytics de tarefa, custo e receita. Dados próprios devem substituir gradualmente todas as estimativas externas deste relatório.
