# TempleSale — privacidade operacional na Itália

Revisão do código em 07/10/2026. Responsáveis: Guilherme Tebaldi e Cristiane Elisabeth Eistalt Tebaldi. Contato público: thetemplesale@gmail.com. Endereço não publicado por solicitação. Este inventário distingue funcionamento observado de medidas propostas; não certifica conformidade nem substitui a conferência dos painéis e contratos dos fornecedores.

## Dados observados e destinos

| Grupo | Funcionamento observado | Destino / cuidado |
| --- | --- | --- |
| Identidade | Auth0; sincronização de nome, e-mail, avatar e subject no banco local; tokens validados por assinatura RS256, emissor, audiência e expiração | Domínio configurado termina em eu.auth0.com; confirmar região, conexões sociais, logs, administradores e contrato no painel. Não foi auditado o tenant autenticado. |
| Empresa e conteúdo | Perfil, contatos, coordenadas comerciais, fotos, produtos, publicações e interações | Banco do backend; imagens podem ir ao Cloudinary. Perfil e publicações são públicos; não publicar documento pessoal, dados de clientes ou endereço residencial desnecessário. |
| Visitantes | site_daily_visitors guarda IP, identificador de visita, navegador, origem, página e país/região/cidade quando disponíveis | Banco; não há limpeza periódica desta tabela identificada. O identificador derivado não torna o conjunto anônimo, pois o IP também é guardado. |
| Proximidade | GPS mediante permissão ou cidade; cidade e última coordenada no localStorage; atualização enquanto página ativa e visível | Busca no backend; rota transmite origem e destino ao OSRM. Mapa carrega serviços OSM, Esri/ArcGIS e CARTO, além de CDNs unpkg/cdnjs. Revogar GPS não limpa sozinho o valor salvo. |
| Links externos | WhatsApp e Google Maps recebem o conteúdo do link quando abertos | Serviços externos e suas políticas; não enviar dados além do necessário. |
| Tradução | Backend pode enviar textos para LibreTranslate, com fallback MyMemory | Confirmar provedores efetivamente utilizados e contratos; não incluir dados sensíveis nos textos. |
| Sessão | Auth0 e sessão local; tokens persistem no navegador; sessão local com validade de 365 dias | Expiradas são removidas em operações de sessão, não por uma rotina contínua comprovada. Proteger contra XSS e restringir acesso administrativo. |
| Aceite | Nome declarado, empresa, e-mail verificado, subject, data UTC, versão/hash e documento exato | Comprovante privado no banco. Nova tabela vinculada à conta com exclusão em cascata; não há arquivo jurídico independente. |

## Conservação: proposta para implementar, não promessa atual

- Conta e perfil: enquanto o serviço for solicitado; encerramento por solicitação verificada, com remoção do conteúdo público e revisão de dependências no banco.
- Estatísticas identificáveis e registros de segurança: propor 30 dias como ponto inicial, justificando necessidade; depois apagar ou agregar de forma realmente anônima. Implementar rotina antes de anunciar esse prazo ao usuário.
- Comprovantes: enquanto existir a conta. Retenção excepcional para obrigação concreta ou litígio exige finalidade, prazo e acesso restrito próprios; não guardar indefinidamente por precaução.
- Backups: identificar primeiro fornecedores, frequência, acesso e ciclo real de expiração. Não prometer apagamento imediato de cópias sem conhecer esse ciclo.
- Auth0 e Cloudinary: excluir a conta no banco não demonstra exclusão nesses serviços. A exclusão deve abranger também identidade, imagens, logs aplicáveis e cópias segundo os contratos.
- Navegador: oferecer futuramente limpeza da última localização e revisar necessidade de cada identificador; por enquanto explicar a limpeza dos dados do site no navegador.

O código ainda não implementa todos esses procedimentos. Os campos LEGAL_PRIVACY_RETENTION e LEGAL_PRIVACY_TRANSFER_DETAILS continuam obrigatórios para ativar o recurso e devem descrever práticas comprovadas, em português e italiano.

## Compartilhamento e proteção mínimos

Conferir nos painéis as regiões reais de Vercel, Render, banco, Cloudinary e Auth0, os subprocessadores, acordos de tratamento e salvaguardas de transferência aplicáveis. Domínio europeu não demonstra que toda a cadeia de fornecedores trata dados exclusivamente na UE. Restringir acesso aos responsáveis que necessitam dele, habilitar MFA nas contas administrativas, revisar credenciais e backups e não registrar tokens em logs. Confirmação de e-mail prova controle do endereço naquele fluxo; não prova identidade civil, legitimidade da empresa ou inexistência de fraude.

A base jurídica das estatísticas identificáveis e do armazenamento no dispositivo precisa ser avaliada separadamente; não classificar todo rastreamento como estritamente necessário nem tratar a permissão técnica de GPS como consentimento jurídico universal. Priorizar redução da coleta antes de acrescentar uma autorização genérica.

## Solicitações e denúncias: canal atual e evolução

O e-mail público já pode ser indicado nos termos para correção, acesso, encerramento e denúncia. Não foi implantada caixa de mensagens nem botão de denúncia nesta alteração. Confirmar a titularidade da conta sem pedir cópias de documentos por padrão. Registrar recebimento, pedido, responsável e resposta; responder solicitações de direitos em até um mês, com as exceções e prorrogações legais devidamente comunicadas.

No futuro, o formulário de denúncia deve pedir somente link/identificador da empresa ou publicação, categoria, descrição objetiva e contato necessário. Evidências opcionais devem evitar dados sensíveis; acesso restrito à moderação. Confirmar recebimento, avaliar proporcionalmente, explicar decisões quando cabível e permitir contestação. Não prometer anonimato absoluto nem publicar a identidade do denunciante. Revisar as obrigações específicas de plataforma antes de lançar esse fluxo.

## Fontes oficiais consultadas

- https://auth0.com/docs/secure/data-privacy-and-compliance/data-processing
- https://auth0.com/docs/secure/data-privacy-and-compliance/gdpr/gdpr-conditions-for-consent
- https://www.garanteprivacy.it/web/guest/home/docweb/-/docweb-display/docweb/8981258
- https://www.garanteprivacy.it/home/principi-fondamentali-del-trattamento
- https://www.garanteprivacy.it/it/home/i-miei-diritti/diritti
