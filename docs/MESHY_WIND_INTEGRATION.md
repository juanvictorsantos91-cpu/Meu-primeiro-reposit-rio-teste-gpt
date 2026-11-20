# Geometria especial — Dragão de Vento e Veneno

## Correções aplicadas ao gerador

- Veneno: a geometria deve remover `rear_leg_left` e `rear_leg_right`, preservando as duas patas dianteiras. A versão anterior filtrava os nomes dianteiros e deixava a anatomia invertida.
- Vento: mantém quatro patas e adiciona um segundo par independente de asas, com ossos próprios e animações próprias de repouso, caminhada e voo.
- Os ossos adicionais do par traseiro são derivados do rig existente e deslocados para trás; ainda exigem inspeção visual no Blockbench/Minecraft para confirmar orientação, pivôs e ausência de interseções.

## Pipeline de integração de um modelo Meshy

1. Exportar o modelo em GLB ou FBX.
2. Inspecionar escala, orientação, topologia, peças separadas e textura.
3. Criar/ajustar o rig com nomes estáveis de ossos compatíveis com as animações Bedrock.
4. Converter a malha para geometria Bedrock baseada em cubos ou reconstruir a silhueta em cubos no Blockbench. Não presumir que o GLB seja diretamente utilizável como geometry JSON.
5. Fazer UV e textura no atlas do RP; evitar depender de materiais PBR do GLB.
6. Exportar geometria Bedrock, animações e controladores, integrar client entity e manter a entidade BP existente.
7. Executar validação de JSON/IDs/nomes de ossos, empacotar .mcaddon e testar no Minecraft Bedrock Android.

## Bloqueio atual do modelo Meshy

A geometria do Dragão de Vento foi gerada no Meshy (task `01a1f685-a86e-7567-9656-56c7a2027faa`) e a tarefa de refinamento/textura foi iniciada (task `01a1f686-371a-73aa-ae09-75101c87975a`). O Meshy retornou a geometria como concluída, mas a exportação/download do GLB foi bloqueada pela conta atual com a mensagem “Please upgrade plan to download models”. Portanto, esse modelo ainda não foi convertido nem integrado ao pacote Bedrock. Não substituir esse bloqueio por uma alegação de integração concluída.

## Validação pendente

- Conferir a textura final e a geometria exportável do Meshy.
- Conferir no Blockbench a orientação das quatro asas e a hierarquia de ossos.
- Validar o JSON de geometria e as animações no parser do Minecraft.
- Testar no Android: escala, renderização, articulações, voo e desempenho.
