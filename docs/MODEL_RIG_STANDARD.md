# Dragon Survival — Padrão Técnico de Rig e Modelos

**Status:** especificação inicial  
**Escopo:** orientar os arquivos-fonte do Blockbench e a integração com Minecraft Bedrock.  
**Regra central:** este padrão organiza o projeto; não obriga todas as espécies a terem a mesma anatomia.

## 1. Princípios

1. Cada espécie deve ter uma silhueta, proporções e anatomia próprias.
2. O rig-base é um ponto de partida modular. Ossos podem ser adicionados, removidos ou reorganizados quando a espécie exigir.
3. Não impor quatro patas, duas asas, pescoço longo, cauda ou qualquer outro apêndice a espécies cuja anatomia não os comporte.
4. Priorizar articulação natural, leitura visual no estilo Minecraft e compatibilidade com o formato de geometria Bedrock.
5. Manter geometria, textura e rig em desenvolvimento conjunto, verificando UVs sempre que a forma mudar.
6. Não reutilizar nomes de ossos ou identificadores de forma que causem conflito entre entidades.

## 2. Organização dos arquivos-fonte

Estrutura de referência:

- `assets/blockbench/shared/` — materiais de referência e módulos realmente compartilhados.
- `assets/blockbench/species/fire/` — projeto-fonte do Dragão de Fogo.
- `assets/blockbench/species/<species>/` — projeto independente de cada outra espécie.
- `docs/SPECIES/` — fichas anatômicas e decisões visuais por espécie.

Cada espécie deve manter seu próprio projeto editável do Blockbench. Módulos compartilhados só devem ser extraídos depois de comprovado que servem a mais de uma espécie sem limitar sua anatomia.

## 3. Convenção de nomes

Usar nomes estáveis, claros e sem espaços. Sugestão inicial:

- Raiz: `root`
- Corpo: `body`
- Cabeça: `head`
- Mandíbula: `jaw`
- Pescoço: `neck`
- Asa esquerda/direita: `wing_left`, `wing_right`
- Membros: `front_leg_left`, `front_leg_right`, `rear_leg_left`, `rear_leg_right`
- Cauda: `tail_base`, `tail_mid`, `tail_tip`

Esses nomes são convenções, não uma lista obrigatória. Em espécies serpentinas, aquáticas, sem asas ou com anatomia incomum, a hierarquia deve refletir a estrutura real. Identificadores finais devem ser conferidos contra os arquivos já existentes antes da integração.

## 4. Módulos anatômicos opcionais

Os módulos abaixo são possibilidades, não requisitos universais:

- Cabeça: chifres, cristas, placas, barbilhões, antenas ou órgãos sensoriais.
- Tronco: placas, escamas salientes, órgãos luminosos ou estruturas de proteção.
- Locomoção: pernas, asas, nadadeiras, membranas, patas especializadas ou corpo serpentino.
- Cauda: segmentos, espinhos, nadadeira, clava ou ausência de cauda.
- Elementos de espécie: cristais, bolsas de veneno, órgãos elétricos, estruturas térmicas ou emissores de som.

Cada peça móvel deve receber osso próprio quando precisar de animação independente. Peças rígidas podem permanecer vinculadas ao osso de sua região.

## 5. Primeira referência: Dragão de Fogo

O Fogo será o primeiro rig de referência porque seu conceito visual já foi aprovado. Direção visual aprovada:

- corpo robusto e musculoso;
- escamas em carvão escuro;
- marcas vermelhas e alaranjadas;
- duas asas grandes com membranas lembrando chamas;
- quatro patas;
- cabeça robusta com chifres;
- cauda segmentada com espinhos;
- detalhes no peito que transmitam calor interno.

O rig do Fogo deve permitir, no mínimo, movimentos independentes de cabeça/mandíbula, tronco, patas, asas e segmentos principais da cauda. O número e a disposição finais dos ossos serão definidos pela malha e pelas necessidades reais das animações — não por uma contagem fixa.

## 6. Variações entre espécies

- **Fogo:** referência inicial de dragão quadrúpede alado.
- **Água:** prever nadadeiras e articulações adequadas à natação; não copiar asas ou patas sem necessidade anatômica.
- **Veneno:** permitir corpo mais alongado e estruturas próprias para veneno e movimentos furtivos.
- **Terra:** priorizar grande porte, sustentação e articulações compatíveis com seu corpo robusto.
- **Lava:** identidade anatômica própria, distinta do Fogo; detalhes térmicos não devem tornar as duas espécies visualmente iguais.
- **Elétrico, Gelo, Vento, Som e Plasma:** criar ou adaptar módulos conforme a silhueta e as habilidades visuais de cada espécie.

Esta lista é orientação inicial; cada ficha de espécie pode justificar mudanças maiores.

## 7. Animações

As animações devem ser específicas por espécie. Criar apenas os conjuntos que fizerem sentido para a anatomia:

- repouso e alerta;
- locomoção terrestre;
- voo e pouso, quando houver asas funcionais;
- natação, quando aplicável;
- alimentação;
- ataque e defesa;
- reação a dano e recuperação;
- interação social e comportamentos especiais.

Não criar animação genérica que mova ossos inexistentes. Manter nomes consistentes por espécie quando a função for equivalente, documentando exceções.

## 8. Compatibilidade e validação

Antes de considerar um modelo pronto para integração:

1. Abrir o projeto-fonte no Blockbench e verificar hierarquia, pivôs, rotações e articulações.
2. Conferir UVs, resolução e alinhamento da textura após alterações de geometria.
3. Exportar para o formato de geometria aceito pelo Resource Pack do Bedrock.
4. Validar identificadores, nomes de ossos, referências de textura e arquivos JSON.
5. Verificar se animações referenciam somente ossos existentes.
6. Executar os testes automatizados disponíveis no repositório.
7. Importar o pacote no Minecraft Bedrock e testar escala, renderização, animações e comportamento em jogo.

A aprovação em testes automatizados não substitui a validação visual e funcional dentro do Minecraft.

## 9. Critério de conclusão desta etapa

O padrão estará pronto para uso quando:

- a hierarquia do Dragão de Fogo estiver definida no projeto Blockbench;
- a textura e o UV estiverem alinhados com a geometria;
- as convenções de nomes e exportação estiverem documentadas;
- as exceções anatômicas por espécie puderem ser registradas sem alterar artificialmente os demais modelos.

**Estado atual:** este documento estabelece o padrão técnico. Ele não significa que o arquivo `.bbmodel`, a geometria, a textura ou as animações já tenham sido criados ou testados.
