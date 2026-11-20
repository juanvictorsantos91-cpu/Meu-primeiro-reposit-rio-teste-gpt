# Estrutura técnica do Dragon Survival

Este documento define a organização do projeto sem alterar o comportamento do núcleo já existente. Ele separa o que já existe no repositório da estrutura planejada para os recursos visuais e a integração completa com o Minecraft Bedrock.

## 1. Estrutura existente (referência atual)

```text
/
├── src/
│   ├── ai/                 # MIS/DBS, decisões, caça, território, relações e migração
│   ├── adapters/           # Adaptadores entre o núcleo e plataformas
│   ├── species/            # Perfis, dietas e características das espécies
│   └── survival/           # Energia, fome, saúde, ferimentos e metabolismo
├── bedrock/
│   └── behavior_pack/
│       ├── manifest.json
│       └── scripts/
│           ├── main.js
│           └── core/       # Cópia gerada de src/ pelo build:bedrock
├── scripts/
│   └── build-bedrock-pack.js
├── tests/
├── examples/
├── package.json
└── README.md
```

O script `npm run build:bedrock` copia `src/` para `bedrock/behavior_pack/scripts/core/`. A pasta copiada é gerada; não deve ser editada manualmente. A fonte oficial do núcleo permanece em `src/`.

## 2. Estrutura-alvo para os recursos do Minecraft

A expansão visual e de entidades será organizada separadamente:

```text
bedrock/
├── behavior_pack/
│   ├── entities/            # Definições JSON das entidades
│   ├── spawn_rules/         # Regras de surgimento
│   ├── items/               # Itens e ovos, quando definidos
│   ├── scripts/             # Ponte Bedrock e núcleo gerado
│   └── manifest.json
└── resource_pack/
    ├── entity/              # Client entity definitions
    ├── models/entity/       # Geometrias .geo.json exportadas
    ├── textures/entity/     # Texturas exportadas
    ├── animations/          # Animações exportadas
    ├── animation_controllers/
    ├── render_controllers/
    ├── particles/            # Efeitos visuais, quando necessários
    ├── sounds/               # Definições/arquivos de som, quando necessários
    └── manifest.json

assets/
└── blockbench/
    ├── shared/               # Convenções, referências e componentes comuns
    └── species/
        ├── fire/
        ├── water/
        ├── electric/
        ├── ice/
        ├── earth/
        ├── lava/
        ├── wind/
        ├── sound/
        ├── poison/
        └── plasma/

docs/
├── PROJECT_STRUCTURE.md
├── MODEL_RIG_STANDARD.md     # Próxima etapa: padrão técnico flexível do rig
└── SPECIES/                  # Fichas técnicas por espécie
```

As pastas da estrutura-alvo serão criadas conforme cada recurso for realmente produzido. Sua presença neste documento não significa que os modelos, texturas, sons ou entidades já existam.

## 3. Responsabilidade de cada ferramenta

| Ferramenta | Responsabilidade | Saída esperada |
|---|---|---|
| Fal | Conceitos visuais, referências e experimentos de textura | Imagens de referência; recursos 3D apenas se o formato e a qualidade forem adequados |
| Blockbench | Modelagem, rig, UV, textura e animação | Projeto editável e exportações Bedrock |
| VS Code | JSON, JavaScript, manifests, controladores e validações | Arquivos de Behavior Pack e Resource Pack |
| GitHub | Histórico, revisão, testes automatizados e versões | Commits, branches, PRs e CI |
| Minecraft Bedrock | Validação final no dispositivo-alvo | Testes reais de importação, renderização e comportamento |

## 4. Regras de organização

1. **Fonte única:** código do núcleo é mantido em `src/`; nunca editar a cópia gerada em `bedrock/behavior_pack/scripts/core/`.
2. **Separação de pacotes:** lógica e entidades ficam no Behavior Pack; modelos, texturas, animações, sons e controladores visuais ficam no Resource Pack.
3. **Uma pasta por espécie:** cada espécie mantém seus arquivos-fonte de Blockbench e referências em `assets/blockbench/species/<species>/`; exportações Bedrock vão para as pastas comuns do Resource Pack.
4. **Base flexível:** a estrutura compartilhada define convenções e compatibilidade, não uma anatomia obrigatória. Ossos, proporções, membros, asas, caudas e animações específicas podem ser adicionados, removidos ou reorganizados conforme a espécie.
5. **Sem sobrescrita entre espécies:** nomes de entidades, arquivos, identificadores e texturas devem incluir ou pertencer claramente ao namespace da espécie.
6. **Build reproduzível:** arquivos gerados devem poder ser recriados a partir dos arquivos-fonte e scripts do repositório.
7. **Testes em camadas:** validar JSON e testes automatizados primeiro; depois importar e testar no Minecraft. CI verde não substitui teste dentro do jogo.
8. **Versões revisáveis:** mudanças entram em branch e pull request; não mesclar na branch principal sem aprovação explícita.

## 5. Convenção inicial de nomes

- IDs de entidade: `dragon_survival:<species>_dragon` (confirmar antes da primeira entidade final).
- Arquivos-fonte Blockbench: `<species>_dragon.bbmodel`.
- Geometria exportada: `geometry.dragon_survival.<species>_dragon`.
- Textura: `<species>_dragon.png`.
- Animações: `animation.dragon_survival.<species>_dragon.<action>`.
- Controladores: `controller.animation.dragon_survival.<species>_dragon.<purpose>`.

Esses nomes são uma convenção proposta para os próximos arquivos; antes de implementá-los, comparar com IDs já usados no repositório para evitar colisões.

## 6. Estado e próximos passos

- [x] Identificar a fonte do núcleo e o processo de cópia para o Behavior Pack.
- [x] Definir a separação entre lógica, pacotes Bedrock, fontes Blockbench e documentação.
- [x] Definir regras de flexibilidade anatômica e organização por espécie.
- [ ] Documentar o rig-base flexível e os módulos opcionais.
- [ ] Organizar a pasta-fonte do Dragão de Fogo no Blockbench.
- [ ] Criar/exportar entidades e recursos visuais para Behavior Pack e Resource Pack.
- [ ] Validar importação e comportamento no Minecraft Bedrock móvel.

**Nota:** esta etapa documenta a arquitetura. Ela não cria modelos 3D, texturas, animações ou um pacote instalável. O núcleo existente e sua integração atual permanecem preservados.
