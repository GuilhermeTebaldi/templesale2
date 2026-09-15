# Validação da rotação

Execute `npx vite --host 127.0.0.1 --port 5190` e abra
`http://127.0.0.1:5190/tests/map-rotation.html` em um navegador.
Clique em “Testar rotação, zoom e coordenadas”. O teste usa os carregadores e o
controle de interação reais de ProductMap, com tiles locais de teste.

O teste cobre alinhamento e seleção de coordenadas em cinco ângulos, marcadores,
distâncias, enquadramento, zoom, gestos sintéticos de dois dedos, desenho e balões.
Esta página não faz parte da entrada de produção do Vite.

Antes de integrar em produção, valide também no mapa real, com e sem login:

- Girar com dois dedos em um telefone físico e combinar giro com pinça.
- Arrastar normalmente; no computador, girar com Shift + rolagem.
- Abrir uma empresa, conferir localização do visitante, distância e WhatsApp.
- Pesquisar e selecionar outro ponto após girar o mapa.
- Fechar e reabrir o mapa durante e depois do gesto.
- Bloquear a extensão no navegador e conferir o mapa convencional como fallback.

Estado desta alteração: TypeScript e build verificados; validação visual e gestos
pendentes. O navegador remoto de testes bloqueou o acesso à página de teste.
