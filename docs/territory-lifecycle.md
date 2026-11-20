# Estado lógico e ciclo de vida dos territórios

O módulo `src/ai/territory-state.js` mantém o estado lógico de um território sem depender da API do Minecraft Bedrock.

## Operações disponíveis
- `createTerritory`: cria um território com proprietário, espécie, centro, raio, estado e histórico.
- `transferTerritory`: transfere a propriedade somente quando uma camada externa já confirmou o resultado da disputa.
- `abandonTerritory`: marca o território como abandonado sem apagar o histórico.
- `relocateTemporaryTerritory`: move territórios temporários sem trocar seu ID ou proprietário.
- `InMemoryTerritoryRepository`: repositório em memória para testes e simulações.

## Limites deliberados
- O módulo não decide se uma invasão venceu.
- O módulo não inicia combate e não captura blocos ou regiões do mundo.
- O repositório em memória não sobrevive ao encerramento do processo.
- A gravação persistente no mundo Bedrock exige um adaptador próprio e validação posterior no jogo.
- Uma migração de Dragão de Terra deve atualizar a localização do território temporário; não deve criar uma transferência de propriedade.

## Próxima integração
A camada de decisão territorial poderá solicitar uma operação, mas somente o sistema que confirmar o evento de conquista poderá chamar `transferTerritory`. A implementação Bedrock futura deverá persistir os registros e recuperar o estado ao carregar o mundo.


## Domínios e anexação (reinos)
Um domínio representa um reino composto por vários territórios independentes.
- `createTerritoryDomain` inicia um domínio com uma capital e sua primeira região.
- `annexTerritoryToDomain` incorpora uma região conquistada sem abandonar nem apagar a região original ou a região conquistada.
- A região anexada conserva seu ID, centro, raio e histórico, mas passa a pertencer ao domínio vencedor.
- Se a região pertencia a outro domínio, a operação exige o registro do domínio de origem, remove a região da lista antiga e atualiza seu histórico.
- Se o domínio derrotado perder sua última região, passa ao estado `dissolved`; se ainda tiver regiões, continua ativo e pode escolher nova capital quando a antiga for anexada.
- A anexação lógica só deve ser chamada depois que o sistema de disputa confirmar a conquista. Ela não altera blocos nem fronteiras físicas do mundo.


## Pressão de ataques e perda gradual de expansão

O módulo `src/ai/territory-pressure.js` acrescenta desgaste territorial para reinos que cresceram por anexação:
- Um reino com regiões anexadas passa a ser elegível para incursões recorrentes a cada 12.000 ticks (meio dia de Minecraft).
- A chance aumenta conforme cresce o número de regiões anexadas, podendo chegar a 90%.
- Uma incursão confirmada reduz 5% do controle de uma região anexada por padrão.
- Após perder todo o controle de uma região, ela retorna ao antigo proprietário; se pertencia a outro reino, o domínio anterior precisa ser fornecido para restaurar sua lista.
- A capital e os territórios originais registrados como núcleo não podem ser perdidos por esse mecanismo.
- A avaliação de risco não inicia ataques sozinha. O sistema de combate ou evento deve confirmar a incursão antes de chamar `applyDomainRaid`.

Assim, um reino pode perder gradualmente suas conquistas e voltar ao tamanho original, sem ter seu núcleo destruído por ataques repetidos. O desgaste é um estado lógico; fronteiras físicas e persistência no mundo Bedrock ainda não foram implementadas.


## Armazenamento versionado do estado territorial
O adaptador `src/adapters/bedrock/territory-storage.js` serializa territórios e domínios em um envelope JSON versionado (`schemaVersion: 1`). O armazenamento real é injetado por callbacks `read` e `write`, evitando assumir um limite de tamanho ou uma API de persistência ainda não validada no Bedrock. O chamador deve salvar em momentos seguros e restaurar o estado ao carregar o mundo. A integração com propriedades dinâmicas e a política de divisão em vários registros ainda ficam pendentes.
