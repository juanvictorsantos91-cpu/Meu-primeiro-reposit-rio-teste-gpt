# Dragon Survival — Primeiro modelo Bedrock do Dragão de Fogo

**Estado:** geometria inicial criada; ainda não validada no Minecraft.

## Arquivos criados

- `bedrock/resource_pack/manifest.json` — manifesto do Resource Pack e dependência do Behavior Pack existente.
- `bedrock/resource_pack/models/entity/dragon_fire.geo.json` — geometria Bedrock inicial.
- `bedrock/resource_pack/entity/dragon_fire.entity.json` — associação da geometria, material e caminho da textura.

## Anatomia representada

A geometria inicial contém:

- tronco robusto e peito ampliado;
- pescoço e cabeça com mandíbula;
- dois chifres;
- exatamente duas asas;
- exatamente quatro patas;
- cauda segmentada em três partes articuláveis;
- ossos independentes para cabeça, mandíbula, asas, patas e segmentos da cauda.

## Limitações conhecidas

1. A textura PNG ainda não foi criada. O caminho referenciado é `textures/entity/dragon_fire.png`.
2. As membranas das asas são blocos planos e precisam de refinamento visual; esta primeira geometria prioriza estrutura articulável e compatibilidade.
3. Não há animações integradas nesta etapa.
4. A entidade ainda não possui definição correspondente no Behavior Pack.
5. Não foi executado teste de importação ou renderização no Minecraft.

## Próximas etapas

1. Criar textura PNG 128×128 e ajustar UVs.
2. Criar definição da entidade no Behavior Pack com identificador `dragon_survival:fire_dragon`.
3. Integrar animações iniciais de repouso, caminhada e voo.
4. Validar os arquivos JSON e empacotar os dois packs.
5. Testar no Minecraft Bedrock Android e corrigir escala, textura, pivôs e renderização.

A geometria é uma primeira base técnica editável, não o modelo visual final aprovado. A anatomia pode ser refinada sem impor esta estrutura às outras espécies.