# Contrato de estado MIS ↔ Bedrock

Este documento define os dados que o adaptador Bedrock entrega ao núcleo do MIS.
Os valores abaixo são lidos como estado observado; a existência do leitor não
significa que todos os produtores de tags já estejam implementados.

## Escalas numéricas

- `ds:energy:<0-100>`: energia percentual.
- `ds:hunger:<0-100>`: saciedade percentual (100 = alimentado).
- `ds:aggression:<0-1>`: ajuste individual opcional de agressividade. Se ausente,
  o MIS usa a agressividade do perfil oficial da espécie.
- A saúde é obtida do componente `minecraft:health` e convertida para percentual
  usando `effectiveMax` (ou `defaultValue` como alternativa). O núcleo recebe
  sempre uma escala de 0 a 100, independentemente do HP máximo da entidade.

## Identidade e território

- `ds:species:<species>`: identificação obrigatória da espécie.
- `ds:territory:<id>`: identificador do território atribuído ao dragão.
- `ds:tamed`: dragão domesticado.
- `ds:owned` ou `ds:owner:<id>`: dragão pertencente a um jogador.
- Dragões domesticados ou pertencentes a jogadores são visitantes amigáveis por
  padrão e não podem ser escolhidos como alvo de invasão.

## Condição e relações

- `ds:has_young`: o indivíduo tem filhotes sob seus cuidados.
- `ds:injury:minor`, `ds:injury:moderate`, `ds:injury:severe`: gravidade do ferimento.
- `ds:immediate_danger`: perigo imediato percebido.
- `ds:migration_due`: ciclo de migração devido.
- `ds:known:<entity-id>`: relação reconhecida pelo indivíduo.
- `ds:hostile:<entity-id>`: relação hostil declarada.
- `ds:near_nest`: indivíduo próximo de um ninho.

## Regras de invasão consumidas pelo MIS

- Água, Plasma e Lava não iniciam invasões.
- Fogo mantém a maior probabilidade-base.
- Outras espécies só se tornam elegíveis se a agressividade individual atingir o
  limiar especial definido pelo sistema.
- O invasor precisa estar saudável, com energia e fome suficientes, sem ferimento
  grave, perigo imediato ou filhotes que exijam proteção.
- O alvo precisa ter território identificado, ser de outra espécie, estar dentro
  do raio territorial correspondente e não ser domesticado nem pertencer a jogador.
- Entre vários alvos elegíveis, o sistema seleciona o mais próximo.
- A avaliação apenas produz uma intenção. Não transfere território nem inicia
  combate automaticamente.

## Limites desta etapa

O adaptador já lê os campos descritos quando as tags estão presentes. A criação
persistente de territórios, a atribuição automática de propriedade/domesticação
e a conquista física continuam sendo tarefas separadas. Elas não são consideradas
concluídas por esta alteração e exigirão validação posterior no Minecraft.


## Sinais de rotina e personalidade

O snapshot também lê os seguintes sinais quando fornecidos pelo adaptador ou por tags:
- `ds:sleep_requested`
- `ds:play_opportunity`
- `ds:exploration_opportunity`
- `ds:quiet_observation`
- `ds:temperature:too_hot` ou `ds:temperature:too_cold`
- `ds:trait:curiosity:<0..1>`
- `ds:trait:sociability:<0..1>`
- `ds:trait:independence:<0..1>`
- `ds:trait:playfulness:<0..1>`

Essas tags são sinais de entrada, não produtores automáticos. Os quatro traços individuais são curiosidade, sociabilidade, independência e vontade de brincar. Medo, estresse e coragem não são traços de personalidade; higiene e banho não fazem parte das rotinas. Valores ausentes permanecem ausentes no snapshot; o MIS usa o perfil da espécie ou padrões conservadores como fallback. As atividades dependem de condições seguras e nunca substituem as prioridades de sobrevivência.


## Gravação dos traços individuais
O adaptador `src/adapters/bedrock/personality-writer.js` fornece `initializeDragonPersonality`, que gera e grava as quatro tags de personalidade em uma entidade Bedrock. O adaptador `src/adapters/bedrock/dragon-initializer.js` chama essa função automaticamente no evento `world.afterEvents.entitySpawn` e também como fallback no primeiro ciclo de IA de entidades já existentes. A inicialização preserva traços e `ds:spawn_tick` que já existam, e marca a entidade com `ds:dragon`.


## Memória social individual
- `ds:known:<entity-id>`: indivíduo reconhecido pelo dragão que carrega a tag.
- `ds:relation:<entity-id>:trust:<0-3>`: confiança social limitada.
- `ds:hostile:<entity-id>`: hostilidade anteriormente observada.

Os identificadores são codificados com URL encoding ao gerar tags pelo módulo social. O snapshot aceita tags legadas sem codificação. A memória é limitada a 32 indivíduos recentes no núcleo. O ciclo principal do MIS atualiza essa memória a cada decisão quando recebe `currentTick`, reconhece dragões observados e devolve `socialMemory` e `socialMemoryTags` no resultado, inclusive quando uma necessidade vital domina a ação. Confiança e hostilidade só mudam quando o adaptador fornece eventos pontuais em `socialObservations` com `interaction: "peaceful"`, `"protective"` ou `"hostile"`. Esses eventos devem ser consumidos uma única vez pelo chamador, não reenviados em todos os ticks.

O adaptador `src/adapters/bedrock/social-memory-writer.js` grava a memória no conjunto de tags da própria entidade, removendo apenas tags antigas pertencentes à memória social. A ponte em `bedrock/behavior_pack/scripts/main.js` chama esse gravador após cada decisão. A memória restaura confiança, hostilidade, último tick observado e quantidade de encontros por meio das tags `ds:seen` e `ds:encounters`.

A ponte também observa `world.afterEvents.entityHurt`: quando um dragão causa dano a outro dragão, a vítima registra o agressor como hostil. O evento é acumulado e consumido no próximo ciclo de decisão da vítima. A falha ao gravar tags não interrompe a execução da ação do dragão.

A memória social agora possui persistência por tags de entidade entre ciclos e recarregamentos da entidade, desde que o Bedrock preserve suas tags. Isso não equivale a um banco de dados global do mundo; os registros acompanham cada entidade e respeitam o limite de 32 relações por indivíduo.


## Persistência territorial no mundo Bedrock

O adaptador `src/adapters/bedrock/territory-dynamic-property-storage.js` conecta o codec territorial às propriedades dinâmicas de `world` (`getDynamicProperty` e `setDynamicProperty`). Para evitar depender de uma única string grande, o JSON é dividido em blocos UTF-8 de até 7.000 bytes por padrão. O limite pode ser configurado, mas não deve ser aumentado sem teste na versão-alvo.

A gravação usa dois slots alternados: primeiro grava os blocos, depois um manifesto com geração, tamanho e checksum, verifica o conteúdo e só então troca o ponteiro ativo. O slot anterior é mantido como cópia de recuperação. Se o slot apontado estiver incompleto ou corrompido, a leitura tenta recuperar a outra cópia válida. Isso protege contra falhas parciais de gravação, mas não substitui backups do mundo.

**Limite atual:** o adaptador está implementado e coberto por testes com um host simulado, mas ainda não foi conectado ao ciclo de vida dos reinos. A ponte ainda não possui uma fonte confiável de criação/identificação de grupos e territórios; portanto, não grava domínios fictícios nem inventa proprietários. A integração será feita quando o produtor real de território e o evento de conquista estiverem definidos e testáveis.


## Identidade de grupos de dragões

O núcleo `src/ai/dragon-groups.js` agora modela grupos persistentes com ID estável, espécie, membros, líder, território de referência, revisão e histórico. A atualização de composição registra entradas e saídas; se o último membro sair, o grupo é encerrado sem apagar seu histórico.

A ponte Bedrock lê `ds:group:<id-codificado>` no snapshot e expõe `groupId` para o MIS. O adaptador `writeDragonGroupMembership` altera somente essa família de tags e preserva as demais. A ausência de `ds:group` significa **sem grupo identificado**; o sistema não deduz amizade ou parentesco apenas pela proximidade.

O armazenamento territorial evoluiu para o esquema 2, incluindo a coleção `groups`. O leitor continua aceitando dados do esquema 1 e os normaliza para esquema 2 com uma lista de grupos vazia, permitindo migração sem descartar os territórios e reinos já salvos.

**Integração ainda pendente:** o modelo de grupos e a leitura/escrita de identidade estão prontos e testados, mas ainda não existe um produtor de agrupamento natural confiável no ciclo do jogo. Por isso, não atribuí grupos automaticamente, não alterei a formação de bandos e ainda não criei reinos no mundo. O próximo passo é ligar a identidade a eventos reais de formação, separação e migração de grupos.
