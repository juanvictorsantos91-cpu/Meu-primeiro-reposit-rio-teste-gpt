# Mapa do repositório — Dragon Survival

## Projeto principal
O Dragon Survival é o projeto principal deste repositório. Ele reúne o add-on Minecraft Bedrock, o MIS/DBS baseado em regras, os sistemas de sobrevivência, perfis de espécies, comportamento social, territórios, reprodução, testes e documentação.

## Protótipo original de zumbis
O protótipo de IA para zumbis permanece preservado como demonstração independente do motor genérico de regras. Ele não é o add-on Dragon Survival e não deve ser confundido com as entidades/espécies do projeto principal.

Arquivos de referência preservados:
- `src/ai/rule-engine.js` — motor genérico de regras.
- `src/brains/zombie-brain.js` — regras de decisão do zumbi.
- `examples/simulate-zombie.js` — simulação isolada do protótipo.

## Pastas do Dragon Survival
- `bedrock/behavior_pack/` — entidades, manifestos e scripts do Behavior Pack.
- `bedrock/resource_pack/` — geometria, texturas, animações e render controllers.
- `src/ai/` — MIS/DBS, decisões, percepção, caça, ciclo de vida, grupos e territórios.
- `src/survival/` — energia, fome, saúde, ferimentos e metabolismo.
- `src/species/` — perfis, dietas e personalidades por espécie.
- `src/adapters/bedrock/` — leitura de estado e execução de intenções no Bedrock.
- `tests/` — testes automatizados.
- `examples/` — simulações fora do Minecraft.
- `docs/` — decisões técnicas, contratos e documentação do projeto.

## Estado de validação
A aprovação dos testes Node.js valida somente as regras e ferramentas executadas no ambiente de testes. A geração do pacote valida a estrutura de empacotamento. Nenhuma dessas etapas substitui a importação e o teste dentro do Minecraft Bedrock Android.

O catálogo oficial de 15 espécies está documentado em `docs/SPECIES_CATALOG.md`. Os 15 perfis metabólicos, dietas, personalidades, habitats e estilos de caça estão cadastrados na branch consolidada. Habilidades e parâmetros novos ainda são experimentais: não equivalem a efeitos completos no Minecraft nem a validação dentro do jogo.
