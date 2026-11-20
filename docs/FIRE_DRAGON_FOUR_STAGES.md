# Dragon Survival — Quatro etapas do Dragão de Fogo

Branch: feature/dragon-survival-core

## Etapa 1 — Textura base 128×128

Arquivo: bedrock/resource_pack/textures/entity/dragon_fire.png

- PNG RGBA 128×128 gerado proceduralmente.
- Paleta inicial: carvão, cinza de escamas, vermelho, laranja e brilho dourado.
- Inclui áreas de cor para corpo, asas e peito.
- Estado: arquivo PNG criado e adicionado ao repositório.
- Pendente: inspeção visual no Blockbench/Minecraft, ajuste fino dos UVs e refinamento artístico.

## Etapa 2 — Refinamento da geometria

Arquivo: bedrock/resource_pack/models/entity/dragon_fire.geo.json

- Preserva tronco robusto, cabeça com chifres, duas asas, quatro patas e cauda segmentada.
- Adiciona espinhos dorsais e caudais.
- Adiciona superfícies de membrana às duas asas para dar mais volume à silhueta.
- Estado: geometria atualizada.
- Pendente: conferência de pivôs, sobreposições e aparência no renderizador Bedrock.

## Etapa 3 — Animações iniciais

Arquivos:
- bedrock/resource_pack/animations/dragon_fire.animation.json
- bedrock/resource_pack/animation_controllers/dragon_fire.animation_controllers.json
- bedrock/resource_pack/entity/dragon_fire.entity.json

Animações protótipo:
- repouso: respiração, cabeça e cauda;
- caminhada: alternância das quatro patas e movimento corporal;
- voo: batimento das asas, ajuste das patas e movimento da cauda.

O controlador escolhe repouso, caminhada ou voo usando consultas de movimento e estado no chão.

Estado: definições e ligações criadas; ainda sem validação visual dentro do jogo.

## Etapa 4 — Empacotamento automatizado

Arquivos: scripts/package-bedrock-addon.js e .github/workflows/package-bedrock-addon.yml

- O pipeline prepara cada pack com seu próprio manifesto.
- Empacota Behavior Pack e Resource Pack como arquivos MC pack.
- Junta os dois em um arquivo MC addon.
- Publica o pacote como artefato baixável do GitHub Actions.

Estado: automação executada com sucesso. O artefato Dragon-Survival-Prototype foi gerado no GitHub Actions (retenção de 14 dias). Ainda precisa ser instalado e inspecionado no Minecraft Android.

## Fora do escopo destas quatro etapas

A etapa 5 será o teste real no Minecraft Bedrock Android. Nela verificaremos importação, textura, UVs, escala, pivôs, animações e comportamento. A CI passou nos testes automatizados do projeto e na validação estrutural do protótipo. A aprovação da CI não substitui o teste no jogo.