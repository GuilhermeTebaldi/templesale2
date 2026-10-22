# Como trabalhar no TempleSale

Estas são preferências explícitas de Guilherme para este projeto. Leia-as antes de investigar, implementar ou publicar alterações. Mantenha este arquivo versionado para orientar também novas sessões.

## Investigar a experiência completa

- Comece pelo resultado que a pessoa quer obter e reproduza o fluxo inteiro. Não limite a investigação à palavra usada para descrever o sintoma.
- Antes de atribuir um comportamento ao navegador ou ao sistema operacional, examine a implementação, as chamadas duplicadas, o estado, a persistência e o ciclo de vida do site e do aplicativo instalado.
- Compare alternativas que atendam ao mesmo objetivo: recurso nativo do telefone, seletor de arquivos, API do navegador ou componente existente. Verifique se uma escolha de arquitetura provoca o problema.
- Quando outro sistema funciona melhor, compare seu código e seu fluxo, se estiverem acessíveis. Use evidência; não presuma que os dois usam o mesmo mecanismo.
- Diferencie problemas encontrados no código de limites confirmados da plataforma. Consulte documentação oficial quando necessário e não prometa resultados que os testes não demonstram.
- Corrija a causa e verifique o caminho completo, incluindo cancelamento, tentativa novamente, retorno ao aplicativo e recuperação de falhas. Use testes proporcionais à alteração e preserve os fluxos que já funcionam.

## Experiência e comunicação

- Converse em português, com explicações curtas, concretas e sem excesso de termos técnicos.
- Nas telas, use pouco texto, poucos botões e ações claras. Evite parágrafos de instruções quando uma interação simples resolve.
- O produto usa italiano. Mantenha a identidade, os componentes e a tela de inicialização existentes; não crie substitutos sem necessidade.
- Priorize celulares e confira iPhone, Android, navegador e PWA instalado. Não presuma que funcionar em um aparelho prova o funcionamento nos demais.
- Preserve rascunhos, edições e os dados do usuário. Faça alterações focadas, sem reescrever partes que não precisam mudar.

## Entregar e publicar

- Guilherme autoriza publicar as correções solicitadas depois da validação. Não peça novamente autorização rotineira para publicar.
- Faça a implementação, os testes pertinentes e a verificação automática existente; publique e confirme a versão em produção antes de dizer que está concluído.
- Não transfira os testes de rotina ao usuário quando puder executá-los. Informe brevemente o que foi validado e qualquer limitação material.
- A autorização para corrigir botões de exclusão/desativação não autoriza excluir ou desativar contas reais durante testes.

## Lições concretas deste projeto

- Foto no celular: no iPhone/iPad, abra diretamente o seletor nativo sem `capture`, que já oferece câmera e biblioteca. No Android, preserve atalhos separados de câmera e galeria onde o seletor não oferece ambos. As fotos seguem para o editor existente. Não substitua esse fluxo por uma câmera de vídeo com `getUserMedia` sem necessidade demonstrada.
- Localização: use um único `watchPosition` para obter a primeira posição e as atualizações. Não duplique com `getCurrentPosition` nem reinicie pedidos em cada troca de tela ou retorno ao app.
- Reaproveite a autorização válida do navegador. Preferências salvas pelo site não são permissões do sistema; não apague a escolha do usuário a cada publicação e não finja uma autorização permanente.
- Respeite recusa e revogação. Mantenha a recuperação por ação do usuário e evite ciclos de pedidos automáticos. Acompanhar a posição durante o uso não implica rastrear com o aplicativo fechado.
