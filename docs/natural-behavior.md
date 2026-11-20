# Rotina natural

O módulo `src/ai/natural-behavior.js` gera intenções cotidianas simples. Ele não executa animações, movimento ou interações diretamente no Minecraft.

## Atividades
- Sono em abrigo seguro.
- Busca por sombra ou abrigo aquecido diante de condições ambientais extremas.
- Brincadeiras e prática de movimento para filhotes e juvenis.
- Aproximação pacífica de dragões conhecidos.
- Exploração motivada pela curiosidade ou independência individual.
- Observação tranquila do ambiente.

## Prioridades
Ameaças, perigo ambiental e necessidades vitais críticas bloqueiam essas atividades. O sistema de sobrevivência e as regras de proteção continuam tendo precedência.

## Dados esperados do adaptador
O módulo aceita sinais contextuais como `sleepRequested`, `temperatureCondition`, `playOpportunity`, `explorationOpportunity` e `quietObservationOpportunity`. Esses sinais ainda precisam ser produzidos pelo adaptador do mundo; sua ausência não quebra o comportamento existente.

## Personalidade
Os traços individuais são curiosidade, sociabilidade, independência e vontade de brincar. Medo, estresse e coragem foram retirados do modelo de personalidade. Higiene, banho e limpeza de escamas também foram removidos das rotinas.

A temperatura continua sendo considerada apenas como condição física: um dragão pode procurar sombra ou abrigo aquecido para evitar dano ambiental. Isso não representa um estado emocional.

Os traços são lidos de tags `ds:trait:<nome>:<valor>` quando disponíveis. Eles ainda não são gerados automaticamente no nascimento.
