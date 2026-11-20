# Dragon Survival — IA de Regras para Minecraft Bedrock

Projeto principal de desenvolvimento de um add-on de dragões para Minecraft Bedrock, com inteligência baseada em regras (MIS), voltado também para dispositivos móveis.

> **Organização do repositório:** o protótipo original de IA para zumbis continua preservado como referência independente do motor de regras. O desenvolvimento principal está no Dragon Survival. Consulte `docs/REPOSITORY_MAP.md` para localizar cada parte e entender o estado real da implementação.

## Núcleo de sobrevivência Dragon Survival

A base consolidada `dragon-survival/consolidated` reúne uma primeira base independente da Script API para testar os sistemas de sobrevivência dos dragões:

- Energia, fome e saúde como indicadores separados.
- Ferimento simplificado, com no máximo um estado ativo.
- Metabolismo configurável por espécie.
- Decisões do MIS considerando os três indicadores e perigo imediato.
- Alimentação que recupera fome e energia com limite por refeição.
- Perfis experimentais das 15 espécies: Fogo, Água, Gelo, Elétrico, Terra, Lava, Vento, Som, Veneno, Areia, Luz, Plasma, Ácido, Radioativo e Sombra.
- Dietas e preferências alimentares por espécie.
- Personalidades distintas e tendências comportamentais cadastradas para as 15 espécies.
- Sistema DBS integrado às prioridades do MIS: proteção de filhotes/ninhos, resposta a ameaças, vínculo com o dono, socialização, descanso, exploração e comandos treinados.
- Padrões sociais naturais: Água em pequenos grupos; Fogo e Gelo em duplas; Elétrico solitário; Terra e Lava em grandes grupos, inclusive grupos mistos Terra-Lava.
- Interações entre espécies: cooperação, exploração conjunta, convivência perto de água/calor e sinais sociais pacíficos; respostas agressivas apenas diante de ataque ou conflito territorial, com recuo quando ferido ou com pouca energia.
- Ritual de comunicação dos Dragões Elétricos: três ou mais adultos saudáveis podem voar acima das nuvens e gerar uma tempestade de raios; respeita segurança, energia, saúde e intervalo mínimo de sete dias Minecraft (168.000 ticks).
- Migração de longo ciclo para o Dragão Elétrico: ciclo configurável, com referência inicial de 14 dias Minecraft (336.000 ticks), condicionada à segurança da rota.
- Dragão de Terra nômade: estabelece territórios temporários por ciclos de 21 dias Minecraft (504.000 ticks), explora/escava a região e depois procura outro local; a mudança é adiada se a rota não for segura. O adaptador deve atualizar `lastMigrationTick` após a mudança e sinalizar `temporaryTerritoryMigrationDue` nos dragões de Terra próximos para que Lava possa reconhecer o convite.
- Passagem migratória Terra-Lava: durante a mudança, os grupos de Terra podem atravessar temporariamente territórios fixos de Lava sem disparar conflito territorial automático. Lava não acompanha a migração; apenas tolera a passagem quando identifica o marcador de migração de Terra.
- Planejamento social explícito: Água (3), Fogo (2), Gelo (2), Terra (6), Lava (6), Som (2–3); Elétrico mantém padrão solitário. Os tamanhos são metas experimentais de grupo.
- Reconhecimento de relações entre pais, filhotes, irmãos, parceiros e indivíduos da mesma espécie.
- Formação de casal apenas entre adultos da mesma espécie, compatíveis, em boas condições e sem parentesco próximo conhecido.
- Cuidado parental prioriza proteção, alimentação e aquecimento dos filhotes conforme a necessidade.

Os valores desta etapa são parâmetros experimentais para simulação, não balanceamento final.

## Catálogo das espécies\n\nO catálogo oficial com habitat, alimentação, comportamento, habilidades e pendências de cada espécie está em [`docs/SPECIES_CATALOG.md`](docs/SPECIES_CATALOG.md). Os perfis e habilidades novos são dados experimentais; não significam que as ações já estejam implementadas no Minecraft.\n\n## Estrutura principal

- `src/ai/rule-engine.js`: motor genérico de regras.
- `src/ai/survival-decisions.js`: prioridades de sobrevivência do MIS.
- `src/survival/`: energia, fome, saúde, ferimentos e metabolismo.
- `src/species/profiles/`: perfis metabólicos das 15 espécies.
- `src/species/diets/species-diets.js`: dietas e preferências alimentares.
- `src/species/behavior-profiles.js`: personalidade e tendências por espécie.
- `src/ai/dragon-behavior.js`: decisões comportamentais integradas ao MIS.
- `src/ai/social-groups.js`: planejamento do tamanho e da coesão dos grupos por espécie, incluindo bandos mistos de Terra e Lava.
- `src/ai/social-interactions.js`: possibilidades de interações pacíficas, tolerância à passagem migratória de Terra pelo território de Lava e respostas defensivas/agressivas condicionais.
- `src/ai/dragon-relationships.js`: reconhecimento de parentesco, parceiros e compatibilidade para formação de casais.
- `src/ai/electric-storm-ritual.js`: condições, participantes e intervalo do ritual coletivo de tempestade elétrica.
- `src/ai/migration-cycle.js`: agenda de migração de longo ciclo do Dragão Elétrico e do ciclo territorial temporário do Dragão de Terra, medida em ticks do mundo.
- `tests/dragon-behavior.test.js`: testes do sistema de comportamentos.
- `examples/simulate-all-dragons.js`: simulação comparativa das 15 espécies.
- `examples/simulate-social-life.js`: simulação de grupos, parentesco e cuidado parental.
- `examples/simulate-electric-dragon.js`: simulação fora do Minecraft.
- `tests/survival.test.js`: testes automatizados do núcleo.

## Como testar

Com Node.js instalado:

```bash
npm test
npm run simulate:electric
npm run simulate:all
npm run simulate:social
```

O DBS é uma camada de decisão: os adaptadores que percebem entidades/ambiente e executam ações reais ainda precisam ser implementados.

O núcleo ainda não está conectado à Script API e não é um Add-On instalável. A integração com o Minecraft Bedrock será uma etapa posterior, após confirmar a versão do jogo e a API disponível.


## Sistemas de mundo e ciclo de vida

A nova camada de planejamento adiciona quatro avaliações independentes, integradas ao MIS/DBS:

- **Percepção ambiental** (`src/ai/environment-awareness.js`): reconhece tags de bioma/terreno, recursos úteis e perigos; calcula adequação de habitat, segurança e locais candidatos.
- **Território e ninhos** (`src/ai/territory.js`): define raios experimentais por espécie, diferencia membros do mesmo grupo de grupos independentes, mede risco de sobreposição e reconhece visitantes de outras espécies sem iniciar combate automático. O Plasma é nômade e não mantém território fixo; Terra mantém territórios temporários em ciclos de 21 dias Minecraft. A proteção física ainda depende do adaptador Bedrock.
- **Caça** (`src/ai/hunting.js`): seleciona presas pela dieta, valor nutricional, distância e risco; atribui estilos por espécie (emboscada, rastreamento por eco, caça aquática em grupo, perseguição ou mergulho aéreo); permite cooperação quando o grupo está saudável e com energia; abandona a caça diante de perigo. Exclui animais domesticados, de fazenda ou protegidos pelo jogador. Captura e compartilhamento real ainda dependem do adaptador.
- **Ciclo de vida** (`src/ai/life-cycle.js`): calcula ovo, filhote, jovem e adulto a partir da idade em ticks, avalia cuidado parental, incubação, eclosão e condições para tentativa de reprodução. Envelhecimento adulto é um marcador experimental, sem morte automática.

Os prazos iniciais de crescimento e envelhecimento são parâmetros experimentais e configuráveis no código; precisam de simulação e balanceamento. Quando o adaptador não informar idade, a fase permanece "unknown" em vez de presumir que todo dragão é filhote.

Para simular as quatro camadas integradas:

```bash
npm run simulate:world
```

As funções produzem avaliações e intenções. Elas não criam blocos, entidades, animações, sons, ovos ou ataques dentro do Minecraft; isso pertence à futura integração com a Script API Bedrock.


## Primeira ponte com Minecraft Bedrock

A estrutura inicial do Behavior Pack está em `bedrock/behavior_pack/`:

- `manifest.json`: declara o módulo Script API estável `@minecraft/server` 2.10.0, alinhado à documentação atual do Bedrock 1.26.50.
- `scripts/main.js`: consulta dragões marcados com `ds:dragon`, coleta contexto local em intervalos de 40 ticks e envia o estado ao MIS/DBS.
- `src/adapters/bedrock/snapshot.js`: converte entidades observadas em estados que o núcleo consegue avaliar.
- `scripts/build-bedrock-pack.js`: copia o núcleo JavaScript para dentro do Behavior Pack.

### Convenção inicial de tags

Cada entidade de dragão precisa receber `ds:dragon` e uma tag `ds:species:<espécie>`, por exemplo `ds:species:electric`. Indicadores podem ser fornecidos por tags `ds:energy:0-100`, `ds:hunger:0-100` e `ds:spawn_tick:<ticks>`. Presas só entram no planejamento de caça se estiverem explicitamente marcadas com `ds:wild`; isso evita que animais de fazendas sejam tratados como selvagens por engano.

### Limite desta primeira ponte

A ponte já consulta entidades e contexto do mundo e calcula decisões do MIS/DBS. Por segurança, publica a decisão como uma tag `ds:action:<ação>` na entidade. Ela ainda não move o dragão, não aplica ataques e não cria efeitos: esses comportamentos exigem componentes e eventos correspondentes nos arquivos JSON das entidades, além de validação dentro do Minecraft.

Antes de distribuir o pacote, confirme a versão exata do Minecraft instalada no celular. A dependência declarada é a versão estável 2.10.0 da Script API, documentada para a linha Bedrock 1.26.50; se a versão instalada exigir outra dependência, o manifesto deverá ser ajustado.

Para preparar a pasta do Behavior Pack:

```bash
npm run build:bedrock
```


## Sétima espécie: Dragão de Vento

O Dragão de Vento foi adicionado ao catálogo oficial do Dragon Survival. Seu perfil experimental contempla:

- Personalidade independente, curiosa e exploradora.
- Habitat distribuído entre planícies abertas, costas, savanas e regiões de altitude com correntes de vento; montanhas são uma opção, não o habitat padrão.
- Pequenos grupos flexíveis, podendo também viver sozinho.
- Voo de planagem com consumo reduzido quando aproveita correntes favoráveis.
- Rajada de vento defensiva para afastar criaturas hostis próximas.
- Dieta de pequenos animais, carne e peixes; alimentos preferidos: coelho, frango e salmão.
- Montaria somente na fase adulta.

Os custos de energia e as condições de recuperação são parâmetros iniciais de balanceamento, ainda não validados dentro do Minecraft.

## Executor inicial de ações Bedrock

O adaptador agora chama `executeDragonAction` após a decisão do MIS/DBS. O executor já possui ações limitadas e seguras:

- Estabilizar/parar o movimento em descanso ou pouso.
- Aplicar impulsos pequenos para aproximação e afastamento.
- Aproximar-se de uma presa selecionada e tentar um ataque corpo a corpo quando estiver ao alcance.
- Aplicar empurrão em criaturas hostis com a rajada de vento.

A caça exige a tag `ds:wild` na presa. Animais domesticados, próprios ou marcados como fazenda/protegidos são recusados. Essa marcação explícita é intencional para evitar ataques indevidos a animais do jogador. Ações como voo completo, animações, eclosão, escavação e construção de ninho continuam dependendo dos eventos e componentes específicos das entidades.

O adaptador consulta dragões marcados com `ds:dragon`; cada dragão precisa ter também `ds:species:<espécie>`. Para solicitar a rajada defensiva do Dragão de Vento, a entidade recebe `ds:wind_gust_requested` enquanto o sistema de comando/combate não possui uma interface própria.

A pasta do Behavior Pack pode ser preparada com `npm run build:bedrock`.


## Oitava espécie: Dragão de Som (oficial; ficha em revisão)

O Dragão de Som está registrado no catálogo oficial. Sua anatomia foi definida como a de um dragão tradicional, com quatro patas, duas asas e cauda; não possui corpo serpentino nem estrutura física especial.

- **Eco Localizador:** emite pulsos sonoros e interpreta os ecos para localizar criaturas, obstáculos e espaços próximos, inclusive no escuro.
- **Onda de Impacto:** libera uma onda de pressão sonora que empurra criaturas e pode interromper ataques.
- **Rugido Desorientador:** emite uma frequência intensa que confunde temporariamente adversários e dificulta a perseguição.
- **Percepção de Vibrações:** identifica movimentos transmitidos pelo solo e pelas paredes, como passos e escavações.
- Personalidade observadora e cautelosa; tende a viver em pequenos grupos.
- Dieta experimental baseada em pequenos animais, peixes e carne.

As habilidades estão implementadas como decisões no núcleo de regras, mas seus efeitos sonoros, visuais e físicos ainda dependem do adaptador e de testes dentro do Minecraft. A ficha continua aberta a ajustes.

## Nona espécie: Dragão Venenoso (em desenvolvimento)

O Dragão Venenoso entrou no núcleo experimental com uma anatomia serpentina alada, duas patas como principal suporte de locomoção e corpo projetado para ser o mais comprido do catálogo. Seu perfil comportamental é cauteloso, solitário e especializado em emboscadas.

- **Cuspir veneno**: ataque concentrado contra uma ameaça.
- **Baforar veneno**: ataque em área à frente do dragão.
- **Nuvem de camuflagem**: bloqueia temporariamente a visão para fuga ou emboscada, mas não concede invisibilidade.
- A camuflagem só é elegível quando o contexto informado pelo adaptador confirma sombra ou escuridão (`camouflageSuitable: true`).
- O núcleo recusa a camuflagem em locais claros e exige energia suficiente.
- Metabolismo, dieta e custos de energia são parâmetros experimentais, ainda sem balanceamento.

A implementação atual cobre o perfil e o planejamento das decisões. A detecção real de iluminação/sombra, a emissão visual da nuvem e os efeitos de veneno ainda dependem do adaptador, dos componentes/eventos da entidade e de testes dentro do Minecraft.

## Décima espécie: Dragão de Plasma (em desenvolvimento)

O Dragão de Plasma entrou no núcleo experimental com porte médio, anatomia tradicional de quatro patas e duas asas, comportamento solitário e raridade natural extrema. Sua aparência mantém escamas escuras, fissuras luminosas azuis, violetas e brancas e estruturas dorsais energéticas. O brilho deve diminuir durante a furtividade e aumentar durante a sobrecarga.

- **Sopro de Plasma:** fluxo concentrado de plasma.
- **Descarga de Plasma:** descarga energética em área próxima.
- **Projétil Ionizado:** projétil concentrado de energia ionizada.
- **Sobrecarga:** aumenta temporariamente a potência e o brilho, com alto consumo de energia.
- **Arco de Plasma:** arcos energéticos contra alvos próximos.
- **Furtividade:** reduz a luminosidade e procura cobertura; não concede invisibilidade. Também pode reposicionar-se por rotas protegidas.
- **Surgimento raro experimental:** somente durante tempestades com raios; intervalo global mínimo de cinco dias Minecraft (120.000 ticks); distância mínima de 1.500 blocos do último surgimento e 1.200 blocos de outro Plasma existente; chance de 1 em 100 por verificação, realizada a cada 6.000 ticks.
- **Comportamento em tempestades:** pode aproveitar a tempestade para recuperar energia em segurança e procurar abrigo para observar sem se expor.
- **Reprodução:** mantém o ciclo normal, mas não constrói nem depende de ninhos. O sistema permite iniciar reprodução sem a condição de ninho.

A regra de elegibilidade do surgimento foi criada e possui testes automatizados no núcleo. Ela ainda não está conectada à geração natural de entidades no Behavior Pack; portanto, não significa que o Plasma já apareça no mundo. Efeitos visuais, ataques, brilho e comportamento físico também precisam do adaptador Bedrock e de testes no jogo.

## Diversificação de habitats e intenções

Os habitats foram redistribuídos para reduzir a concentração em montanhas e cavernas:
- Água: rios, oceanos, cachoeiras e manguezais.
- Gelo: planícies nevadas, picos congelados, geleiras e oceanos congelados.
- Fogo: desertos, savanas, terras áridas e regiões vulcânicas.
- Terra: florestas, selvas, planícies vegetadas e colinas arborizadas; cavernas deixam de ser preferência dominante.
- Lava: regiões vulcânicas, deltas de basalto e cavernas quentes.
- Vento: planícies abertas, costas, savanas e altitude.
- Venenoso: pântanos, manguezais, selvas e florestas densas.
- Som: vales, cânions rochosos, florestas, penhascos e cavernas.
- Elétrico: montanhas frias e planaltos expostos.
- Plasma: planaltos, costas expostas ao vento e áreas elevadas adequadas a tempestades.

Novas intenções específicas:
- Som: sinalizar o grupo por ecos e investigar vibrações incomuns.
- Venenoso: aguardar em emboscada e procurar sombra/vegetação antes de liberar a nuvem de camuflagem.
- Plasma: absorver energia durante tempestades quando estiver seguro e procurar abrigo para observar sem se expor.

Essas são decisões do núcleo. A detecção precisa de clima, cobertura, luz e pontos de surgimento ainda deve ser conectada ao adaptador do jogo.


## Caça executada no Behavior Pack
O executor Bedrock agora valida novamente a presa antes de agir, aproxima-se e persegue o alvo, aplica dano corpo a corpo quando está ao alcance e restaura fome após um abate confirmado. A aproximação e o ataque consomem energia. A caça é interrompida diante de perigo, saúde muito baixa ou energia insuficiente. Entidades domesticadas, pertencentes ao jogador, de fazenda, filhotes ou protegidas não são alvos; apenas entidades marcadas com `ds:wild` podem ser caçadas.

## Migração territorial do Dragão de Terra
A cada ciclo de 21 dias, o grupo de Terra pode atravessar regiões ocupadas por outras espécies. Lava é a única espécie que aceita a passagem sem conflito. As demais reconhecem o grupo como intruso; uma chance determinística por encontro define se partem para confronto ou se apenas emitem um aviso/observam. O resultado é estável durante o encontro para evitar alternância aleatória a cada atualização.


## Invasão territorial seletiva

O MIS/DBS avalia tentativas raras de invasão, sem transferir automaticamente a propriedade nem iniciar combate. Água e Plasma não invadem; Lava também foi excluída desse comportamento por sua dependência de habitat. O Dragão de Fogo tem a maior chance-base (3,5% por ciclo diário), mas a tentativa exige agressividade individual de pelo menos 0,7, saúde, energia e fome suficientes, ausência de perigo imediato, ausência de filhotes sob cuidado e um território vizinho válido. Outras espécies podem tentar somente se o indivíduo tiver agressividade elevada, com chance-base muito menor (0,8% por ciclo diário). O resultado é determinístico dentro de cada ciclo para evitar repetição aleatória a cada atualização. A intenção de invasão ainda precisa de execução física e validação dentro do Minecraft.
