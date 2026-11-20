# Expansão simples de comportamento e personalidade

## Objetivo
Fazer cada dragão parecer um animal com hábitos e preferências próprios, sem criar uma IA separada por espécie ou aumentar demais o custo de processamento.

O MIS continua sendo baseado em regras. As decisões combinam:
1. Necessidades vitais (saúde, fome, energia).
2. Segurança e ameaças reais.
3. Perfil comportamental da espécie.
4. Traços individuais estáveis.
5. Contexto recente (horário, clima, relações e acontecimentos lembrados).

## Comportamentos
- Alternar entre procurar alimento, explorar, patrulhar, descansar, dormir e observar.
- Filhotes e juvenis podem brincar e praticar movimentos quando estão seguros.
- Dragões podem se aproximar de indivíduos conhecidos conforme sua sociabilidade.
- Indivíduos mais independentes podem preferir pequenas explorações individuais.
- Comunicação por postura, aproximação, afastamento, vocalização e alertas.
- Vínculos e memória social limitada para reconhecer membros do grupo, parceiros e treinador.

## Personalidade individual
Gerar no nascimento quatro tendências estáveis, em escala de 0 a 1:
- curiosidade;
- sociabilidade;
- independência;
- vontade de brincar.

Medo, estresse e coragem não são traços de personalidade neste projeto. A resposta a ameaças continua baseada na espécie, saúde, energia e contexto real. Higiene, banho e limpeza de escamas foram retirados por não acrescentarem o suficiente à experiência de jogo.

## Regras de prioridade
- Saúde, fome, energia crítica e perigo imediato têm prioridade máxima.
- Proteção de filhotes, ninho e vínculos importantes vem em seguida, conforme o contexto.
- Rotina, socialização e brincadeiras só ocorrem quando são seguros.
- Condições físicas extremas, como calor ou frio perigosos, continuam sendo tratadas como riscos ambientais, não como emoções.
- Uma ação ambiental não deve ser repetida continuamente: cada comportamento precisa de intervalo ou condição de encerramento.

## Próximas etapas técnicas
1. Produzir sinais de sono, exploração, brincadeira e observação no adaptador Bedrock.
2. Integrar anexação territorial à confirmação real de conquista.
3. Persistir domínios e desgaste territorial no mundo.
4. Refinar a origem dos eventos sociais pacíficos e protetivos; hostilidade por dano entre dragões já é observada pela ponte.

## Limites
As ações físicas no Minecraft precisam de adaptadores próprios e validação posterior no jogo. Não introduzir dezenas de variáveis persistentes antes de confirmar quais são realmente necessárias.


## Continuação: inicialização e persistência
- Personalidade automática conectada ao evento `world.afterEvents.entitySpawn`, com fallback no primeiro ciclo de IA para entidades existentes. Os quatro traços e o tick de nascimento são gravados uma única vez, preservando valores já existentes.
- Criado um codec de estado territorial com versão e um adaptador de armazenamento por callbacks. Falta conectar os callbacks à persistência do mundo Bedrock, após validar limites e comportamento da API na versão-alvo.
- Os testes automatizados dos adaptadores e da integração foram executados com sucesso no GitHub Actions: 201 testes aprovados, sem falhas. A compilação do núcleo e as simulações integradas também passaram.


## Memória social simplificada
O módulo `src/ai/social-memory.js` mantém até 32 relações recentes por dragão. Ele registra reconhecimento, espécie conhecida, nível de confiança simples (0–3), hostilidade observada, último contato e quantidade de encontros. Confiança aumenta com interações pacíficas/protetivas e diminui quando há hostilidade observada. Apenas ver outro dragão cria reconhecimento, não amizade nem hostilidade.

O adaptador de snapshot lê as tags `ds:known:<id>`, `ds:relation:<id>:trust:<0-3>` e `ds:hostile:<id>` do próprio dragão. A leitura de reconhecimento foi corrigida para consultar a memória do observador, não as tags do indivíduo observado. O ciclo do MIS atualiza a memória a cada decisão. A ponte Bedrock grava as tags na própria entidade e restaura confiança, hostilidade, último contato e contagem de encontros. A ponte também registra como hostil o dragão que causar dano a outro. A memória é individual, limitada a 32 relações e acompanha as tags da entidade; ainda não é um banco global do mundo.
