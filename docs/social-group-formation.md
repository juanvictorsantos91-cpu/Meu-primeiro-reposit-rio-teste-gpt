# Organização social, liderança e patrulhas territoriais

## Tamanhos de referência

| Espécie | Membros por grupo | Organização |
|---|---:|---|
| Fogo | 6 | Grupo territorial com vínculos de casal internos |
| Água | 6 | Grupo territorial de patrulha distribuída |
| Gelo | 6 | Grupo territorial com vínculos de casal internos |
| Terra | 10 | Grupo grande de proteção e patrulha |
| Lava | 8 | Grupo territorial grande |
| Vento | 6 | Grupo territorial móvel e disperso |
| Som | 6 | Grupo territorial coordenado por sinais |
| Elétrico | 1 | Solitário; ritual de tempestade continua temporário |
| Veneno | 1 | Solitário |
| Plasma | 1 | Solitário |

Os tamanhos são alvos mínimos para formação. Grupos podem crescer quando houver capacidade territorial e membros disponíveis; não há limite máximo artificial nesta etapa.

## Pares dentro dos grupos

Fogo e Gelo podem registrar vínculos de casal como pares internos sem dividir o grupo territorial em pequenas famílias independentes. Os membros sem vínculo de casal continuam integrados ao mesmo grupo.

## Patrulha distribuída

O grupo não precisa caminhar como uma manada. Seus indivíduos ou pares percorrem setores diferentes do território, em patrulhas independentes. O plano de patrulha só usa setores territoriais reais fornecidos pelo mundo; não cria coordenadas nem fronteiras fictícias. O líder supervisiona a cobertura e a resposta a ameaças.

## Liderança

Cada grupo possui um líder. A seleção considera liderança, experiência, saúde, energia, proteção do grupo e agressividade controlada. O líder recebe papel explícito `territory_leader` e marcador lógico `leader`; o destaque visual final no Minecraft ainda depende de integração de recursos/entidade.

## Limites de integração

A criação organizada só ocorre depois de confirmação explícita da formação. Esta camada é lógica e testável; não foi conectada ainda a eventos reais de patrulha, combate, navegação ou desenho visual dentro do Bedrock.


## Persistência e ciclo de vida

O módulo `src/ai/persistent-dragon-groups.js` oferece um repositório persistente sobre o armazenamento mundial de territórios. Ele grava a lista de grupos sem substituir territórios ou domínios já salvos, mantém o tick mundial monotônico e permite consultar grupos por estado.

A fachada de ciclo de vida aceita operações explícitas de formação, atualização e encerramento. A atualização exige a lista completa dos membros restantes para eleger um sucessor com dados de liderança; os vínculos internos são preservados apenas quando os dois indivíduos continuam no grupo. Grupos encerrados mantêm seu histórico e deixam de aparecer na consulta de grupos ativos.

O adaptador `writeDragonGroupState` sincroniza o registro com as tags de uma entidade: identidade do grupo e marcador de líder são atualizados juntos, sem alterar tags de energia, espécie ou outras mecânicas.

## Limites atuais após esta etapa

- O armazenamento persistente e o ciclo de vida lógico estão implementados e cobertos por testes automatizados.
- A sincronização de tags está disponível como adaptador explícito, mas ainda não é executada automaticamente no ciclo principal do mundo.
- Não há formação automática, descoberta automática de casais ou sucessão baseada em atributos coletados em tempo real.
- O runtime ainda precisa de uma fonte confiável de setores territoriais e de eventos de associação para ativar patrulhas físicas.
- Nenhum teste dentro do Minecraft foi realizado nesta etapa.
