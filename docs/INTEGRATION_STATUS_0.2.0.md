# Integração Dragon Survival 0.2.0

## Estado desta entrega

Esta rodada integra o núcleo de sobrevivência e comportamento ao runtime Bedrock e prepara os recursos das 15 espécies no processo de build. O resultado é uma base funcional de desenvolvimento, ainda dependente de validação dentro do Minecraft Bedrock Android.

## Sobrevivência

- Energia, fome, saúde e tempo de inanição são persistidos em tags da entidade.
- O ciclo do MIS executa o metabolismo a cada 40 ticks (2 segundos).
- Custos de habilidades usam os perfis metabólicos por espécie.
- A reserva mínima impede a execução de uma habilidade quando o custo deixaria energia abaixo do limite.
- Descanso seguro pode recuperar energia, saúde e ferimentos.
- A saúde percentual do núcleo é sincronizada com o componente de saúde da entidade quando a API disponibiliza o setter.
- Os 15 perfis metabólicos consomem valores centrais de src/species/balance.js.

## Sistemas sociais e interações

- Memória social reconhece indivíduos, registra encontros e distingue interações pacíficas e hostis.
- Eventos de dano entre dragões atualizam a memória de ambos os envolvidos.
- Interações pacíficas podem gerar marcadores recíprocos, consumidos no ciclo seguinte pelo sistema de memória.
- A formação de grupos é persistida em propriedades dinâmicas do mundo.
- A seleção de liderança considera liderança, experiência, saúde, energia, proteção e agressividade.
- Grupos mistos Terra/Lava são aceitos; grupos solitários não são persistidos como grupos.
- Territórios são persistidos no mesmo estado mundial que grupos e domínios.
- Territórios de Terra são temporários e recebem ciclo inicial de 21 dias Minecraft.
- Ovos, filhotes, compatibilidade de parceiros, comandos de treinador e sinais de cuidado parental são lidos pelo adaptador a partir de tags.

Tamanhos-alvo sociais configurados: Água 3; Fogo 2; Gelo 2; Terra 6; Lava 6; Som 3; Areia 4; Luz 4; Vento 6. Espécies solitárias continuam sem grupos permanentes.

## MIS e habilidades

- As decisões agora recebem sinais de dia/noite, clima, bioma, cobertura, altitude, cavernas e oportunidades sociais.
- Regras de combate iniciais foram adicionadas para Fogo, Água, Gelo, Elétrico e Lava.
- As ações elementais de Veneno, Plasma, Som, Vento, Ácido, Areia, Luz, Radioativo e Sombra possuem intenções e/ou efeitos iniciais no executor.
- Efeitos de combate são limitados a entidades hostis próximas; a habilidade de Ácido não destrói blocos de construção.
- Radioatividade usa exposição acumulativa separada de veneno.
- O Dragão de Sombra usa ocultação e impulso curto; o de Areia pode se ocultar sem quebrar blocos.

## Balanceamento central

src/species/balance.js centraliza, por espécie:
- altura, largura e comprimento;
- velocidade terrestre e velocidade de voo;
- altitude máxima e alcance máximo de voo;
- saúde máxima;
- consumo de fome, recuperação de descanso e massa relativa.

As relações aprovadas foram preservadas: Terra é o maior, Vento tem o maior alcance de voo e Elétrico tem a maior altitude. Os valores numéricos são parâmetros iniciais para balanceamento, não medições finais.

O runtime impõe limites de altitude e distância de voo por espécie. A movimentação e o comportamento de voo ainda precisam ser ajustados visualmente no jogo.

## Modelos, texturas e animações

O script scripts/generate-species-assets.js gera, para as 15 espécies:

- entidade JSON do Behavior Pack;
- client entity do Resource Pack;
- geometria Bedrock individual com identificador próprio;
- textura de espécie PNG 128×128;
- textura de ovo PNG 16×16 e entrada no atlas;
- animações idle, walk e fly;
- animation controller e render controller;
- nomes em português e manifestos sincronizados na versão 0.2.0.

O gerador usa o rig do Dragão de Fogo como base inicial. O Dragão de Vento recebe um segundo par de asas e o Dragão de Veneno usa o corpo com apenas as duas patas traseiras. As outras espécies já têm geometrias e texturas separadas, mas ainda compartilham a estrutura anatômica quadrúpede base nesta primeira passagem.

As texturas são paletas pixel-art de protótipo, não acabamento artístico final. Animações individuais, ataques visuais, efeitos de partículas e refinamento de silhueta continuam pendentes.

## Build e validação automatizada

Com Node.js 22:

```bash
npm run build:bedrock
npm test
npm run simulate:all
npm run simulate:social
npm run simulate:world
```

Última execução registrada no GitHub Actions:
- 245 testes automatizados aprovados;
- 0 testes reprovados;
- build do bundle Bedrock aprovado;
- verificações de sintaxe aprovadas;
- simulações elétrica, das 15 espécies, vida social e sistemas integrados aprovadas;
- pacote .mcaddon gerado e publicado como artefato da execução.

## Limites e validação pendente

- Nenhum teste foi executado dentro do Minecraft Bedrock Android nesta rodada.
- O build Node valida sintaxe e estrutura do pacote, mas não substitui a validação do parser de entidades, geometria, textura, animações e componentes dentro do jogo.
- A movimentação de voo, a colisão das geometrias, os efeitos visuais e o desempenho com muitos dragões precisam de teste real.
- Reprodução, ovos, escavação, territórios físicos, invasões e várias habilidades complexas ainda exigem eventos e comportamento específico de cada entidade.
- O pacote é um protótipo 0.2.0 para teste, não uma versão final.

